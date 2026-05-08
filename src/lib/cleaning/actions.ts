'use server'

import type { TaskAssignment, TaskCompletionHistory, TaskTemplate, User } from '@/payload-types'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { completeTaskSchema } from '@/lib/schemas'

/**
 * Get ISO week number for a date
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Get current week's cleaning assignments from TaskAssignments collection
 * Auto-generates assignments if they don't exist for current week
 */
export async function getWeeklyAssignments() {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get current user for auth check
    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated', assignments: [] }
    }

    // Calculate current week
    const now = new Date()
    const currentWeek = getISOWeek(now)
    const currentYear = now.getFullYear()

    // Get all active users
    const usersResult = await payload.find({
      collection: 'users',
      where: {
        role: { in: ['member', 'admin'] },
      },
      limit: 100,
    })
    const users = usersResult.docs as User[]

    if (users.length === 0) {
      return { success: false, message: 'No users found', assignments: [] }
    }

    // Check if assignments exist for current week
    const existingAssignmentsResult = await payload.find({
      collection: 'task-assignments',
      where: {
        weekNumber: { equals: currentWeek },
        year: { equals: currentYear },
      },
      depth: 2,
      limit: 100,
    })

    let assignments: TaskAssignment[] = existingAssignmentsResult.docs as TaskAssignment[]

    // If no assignments exist, generate them
    if (assignments.length === 0) {
      assignments = await generateAssignmentsForWeek(currentWeek, currentYear, users, payload)
    }

    // Enrich assignments with completion history
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const template = assignment.template as TaskTemplate
        const assignedUser = assignment.assignedTo as User

        // Check completion history for this week
        const historyResult = await payload.find({
          collection: 'task-completion-history',
          where: {
            assignment: { equals: assignment.id },
            weekNumber: { equals: currentWeek },
            year: { equals: currentYear },
          },
          limit: 1,
        })
        const history = historyResult.docs[0] as TaskCompletionHistory | undefined

        return {
          assignment,
          template,
          assignedUser,
          isCompleted: assignment.status === 'completed' || !!history,
          completedAt: history?.completedAt,
          completedBy: history?.completedBy as User | undefined,
          historyNotes: history?.notes,
          selectedOption: history?.selectedOption,
          isAssignedToCurrentUser: currentUser.id === assignedUser.id,
        }
      }),
    )

    return {
      success: true,
      assignments: enrichedAssignments,
      currentWeek,
      currentYear,
      totalUsers: users.length,
    }
  } catch (error) {
    console.error('Get assignments error:', error)
    return { success: false, message: 'Failed to load assignments', assignments: [] }
  }
}

/**
 * Get overdue assignments from previous weeks (pending status)
 * These are tasks that were assigned but never completed
 */
export async function getOverdueAssignments() {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get current user for auth check
    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated', overdueAssignments: [] }
    }

    const now = new Date()
    const currentWeek = getISOWeek(now)
    const currentYear = now.getFullYear()

    // Find all pending assignments from previous weeks
    const overdueResult = await payload.find({
      collection: 'task-assignments',
      where: {
        and: [
          { status: { equals: 'pending' } },
          {
            or: [
              { year: { less_than: currentYear } },
              {
                and: [
                  { year: { equals: currentYear } },
                  { weekNumber: { less_than: currentWeek } },
                ],
              },
            ],
          },
        ],
      },
      depth: 2,
      limit: 100,
      sort: '-weekNumber', // Most recent overdue first
    })

    const overdueAssignments = overdueResult.docs as TaskAssignment[]

    // Enrich with template and user info
    const enrichedOverdue = await Promise.all(
      overdueAssignments.map(async (assignment) => {
        const template = assignment.template as TaskTemplate
        const assignedUser = assignment.assignedTo as User

        return {
          assignment,
          template,
          assignedUser,
          weekNumber: assignment.weekNumber,
          year: assignment.year,
          isOverdue: true,
          isAssignedToCurrentUser: assignedUser.id === currentUser.id,
        }
      }),
    )

    return {
      success: true,
      overdueAssignments: enrichedOverdue,
      totalOverdue: enrichedOverdue.length,
    }
  } catch (error) {
    console.error('Get overdue assignments error:', error)
    return { success: false, message: 'Failed to load overdue assignments', overdueAssignments: [] }
  }
}

/**
 * Generate task assignments for a specific week using rotation logic
 * rotationGroup + weekOffset determines assignment rotation
 */
async function generateAssignmentsForWeek(
  weekNumber: number,
  year: number,
  users: User[],
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<TaskAssignment[]> {
  // Get all task templates
  const templatesResult = await payload.find({
    collection: 'task-templates',
    limit: 100,
  })
  const templates = templatesResult.docs as TaskTemplate[]

  if (templates.length === 0 || users.length === 0) {
    return []
  }

  const assignments: TaskAssignment[] = []

  // Group templates by rotationGroup
  const templatesByGroup: Record<number, TaskTemplate[]> = {}
  for (const template of templates) {
    const group = template.rotationGroup || 0
    if (!templatesByGroup[group]) {
      templatesByGroup[group] = []
    }
    templatesByGroup[group].push(template)
  }

  // Generate assignments for each rotation group
  for (const [group, groupTemplates] of Object.entries(templatesByGroup)) {
    const groupNum = parseInt(group)
    const groupSize = groupTemplates.length

    for (let i = 0; i < groupSize; i++) {
      const template = groupTemplates[i]

      // Calculate which user gets this task based on:
      // (weekOffset + taskIndex) % userCount
      // Different groups have different weekOffsets so they rotate independently
      const weekOffset = weekNumber + groupNum
      const userIndex = (weekOffset + i) % users.length
      const assignedUser = users[userIndex]

      // Create assignment
      const assignment = await payload.create({
        collection: 'task-assignments',
        data: {
          template: template.id,
          assignedTo: assignedUser.id,
          weekNumber,
          year,
          status: 'pending',
          dueDate: getFridayOfWeek(year, weekNumber).toISOString(),
        },
        overrideAccess: true,
      })

      assignments.push(assignment as TaskAssignment)
    }
  }

  return assignments
}

/**
 * Get Friday of a specific ISO week
 */
function getFridayOfWeek(year: number, week: number): Date {
  // ISO week starts on Monday, so we calculate from there
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7 // 1 = Monday, 7 = Sunday
  const firstMonday = new Date(year, 0, 4 - jan4Day + 1)

  // Add (week - 1) weeks + 4 days to get to Friday
  const friday = new Date(firstMonday)
  friday.setDate(firstMonday.getDate() + (week - 1) * 7 + 4)

  return friday
}

/**
 * Mark a task assignment as completed
 * Creates entry in TaskCompletionHistory
 */
export async function completeTask(assignmentId: unknown, notes?: unknown, selectedOption?: unknown) {
  const parsed = completeTaskSchema.safeParse({ assignmentId, notes, selectedOption })
  if (!parsed.success) {
    return { success: false, message: 'Ungültige Eingabe' }
  }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Verify user is authenticated
    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const now = new Date()
    const currentWeek = getISOWeek(now)
    const currentYear = now.getFullYear()

    // Get assignment
    const assignment = (await payload.findByID({
      collection: 'task-assignments',
      id: parsed.data.assignmentId,
      depth: 1,
    })) as TaskAssignment

    if (!assignment) {
      return { success: false, message: 'Assignment not found' }
    }

    const template = assignment.template as TaskTemplate

    // Get assigned user ID (could be string or populated User object)
    const assignedUserId =
      typeof assignment.assignedTo === 'string'
        ? assignment.assignedTo
        : (assignment.assignedTo as User).id

    // STRICT: Only assigned user can complete - NO admin exception
    if (currentUser.id !== assignedUserId) {
      return { success: false, message: 'Nur der zugewiesene Nutzer kann diese Aufgabe abhaken' }
    }

    // overrideAccess is required because TaskAssignments and TaskCompletionHistory access
    // restrict mutations to admins only — we've already verified the assigned user above.
    await payload.update({
      collection: 'task-assignments',
      id: parsed.data.assignmentId,
      data: {
        status: 'completed',
        notes: parsed.data.notes || assignment.notes,
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'task-completion-history',
      data: {
        assignment: parsed.data.assignmentId,
        template: template.id,
        completedBy: currentUser.id,
        completedAt: now.toISOString(),
        weekNumber: currentWeek,
        year: currentYear,
        notes: parsed.data.notes || '',
        selectedOption: parsed.data.selectedOption || '',
      },
      overrideAccess: true,
    })

    return { success: true, message: 'Task completed' }
  } catch (error) {
    console.error('Complete task error:', error)
    return { success: false, message: 'Failed to complete task' }
  }
}

/**
 * Get cleaning task options (for "Anderes" task)
 */
export async function getCleaningTaskOptions() {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const optionsResult = await payload.find({
      collection: 'cleaning-task-options',
      where: {
        isActive: { equals: true },
      },
      sort: 'sortOrder',
      limit: 100,
    })

    return {
      success: true,
      options: optionsResult.docs,
    }
  } catch (error) {
    console.error('Get options error:', error)
    return { success: false, options: [] }
  }
}

/**
 * Reset and regenerate assignments (admin only)
 * Clears future assignments and regenerates from current week
 */
export async function resetRotation() {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Verify admin
    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'Admin access required' }
    }

    const now = new Date()
    const currentWeek = getISOWeek(now)
    const currentYear = now.getFullYear()

    // Delete all assignments for current and future weeks
    const assignmentsToDelete = await payload.find({
      collection: 'task-assignments',
      where: {
        and: [
          {
            or: [
              { year: { greater_than: currentYear } },
              {
                and: [
                  { year: { equals: currentYear } },
                  { weekNumber: { greater_than_equal: currentWeek } },
                ],
              },
            ],
          },
        ],
      },
      limit: 1000,
    })

    for (const assignment of assignmentsToDelete.docs) {
      await payload.delete({
        collection: 'task-assignments',
        id: assignment.id,
        overrideAccess: true,
      })
    }

    // Regenerate assignments for current week
    const usersResult = await payload.find({
      collection: 'users',
      where: {
        role: { in: ['member', 'admin'] },
      },
      limit: 100,
    })

    await generateAssignmentsForWeek(currentWeek, currentYear, usersResult.docs as User[], payload)

    return {
      success: true,
      message: `Reset completed. Deleted ${assignmentsToDelete.docs.length} assignments and regenerated for KW ${currentWeek}.`,
    }
  } catch (error) {
    console.error('Reset rotation error:', error)
    return { success: false, message: 'Failed to reset rotation' }
  }
}
