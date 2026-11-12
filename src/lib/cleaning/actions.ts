'use server'

import type { TaskAssignment, TaskCompletionHistory, TaskTemplate, User } from '@/payload-types'

export interface EnrichedFreeTask {
  id: string
  template: TaskTemplate
  completedBy: User
  completedAt: string
  weekNumber: number
  year: number
  notes?: string | null
  selectedOption?: string | null
  repeatedWithinTwoWeeks?: boolean | null
}

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload, type Where } from 'payload'
import { completeTaskSchema } from '@/lib/schemas'
import {
  assigneeFor,
  ensureWeekAssignments,
  generateAssignmentsForWeek,
  getISOWeek,
} from '@/lib/cleaning/generate'
import { isDueInWeek, isRestricted, toId } from '@/lib/cleaning/rotation'
import { TWO_WEEKS_MS, withRecency } from '@/lib/cleaning/recency'

/** Offene Aufgaben aus Wochen vor der aktuellen. Nicht exportiert: 'use server'-Datei. */
function overdueWhere(now = new Date()): Where {
  const currentWeek = getISOWeek(now)
  const currentYear = now.getFullYear()
  return {
    and: [
      { status: { equals: 'pending' } },
      {
        or: [
          { year: { less_than: currentYear } },
          { and: [{ year: { equals: currentYear } }, { weekNumber: { less_than: currentWeek } }] },
        ],
      },
    ],
  }
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

    const { currentWeek, currentYear, users, assignments } = await ensureWeekAssignments(payload)

    if (users.length === 0) {
      return { success: false, message: 'No users found', assignments: [] }
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
 * Permanente Karten für Aufgaben mit fester Nutzerliste, nur für berechtigte Nutzer.
 * Zustand: diese Woche fällig (`current`), überfällig aus Vorwochen (`overdue`),
 * sonst nächster Termin (`next`).
 */
export async function getRestrictedTaskCards() {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: await config })
    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) return { success: false, cards: [] }

    const { users, assignments } = await ensureWeekAssignments(payload)
    const templates = (await payload.find({ collection: 'task-templates', limit: 100 }))
      .docs as TaskTemplate[]

    const cards = await Promise.all(
      templates
        .filter(
          (t) => isRestricted(t) && t.assignedUsers!.some((u) => toId(u) === currentUser.id),
        )
        .map(async (template) => {
          const current = assignments.find((a) => toId(a.template) === template.id)

          const overdueResult = await payload.find({
            collection: 'task-assignments',
            where: { and: [{ template: { equals: template.id } }, overdueWhere()] },
            sort: 'dueDate',
            depth: 1,
            limit: 1,
          })
          const overdue = overdueResult.docs[0] as TaskAssignment | undefined

          let next: { weekNumber: number; user: User | null } | null = null
          for (let k = 1; k <= 8 && !next; k++) {
            const date = new Date(Date.now() + k * 7 * 86400000)
            const weekNumber = getISOWeek(date)
            if (isDueInWeek(template.frequency, weekNumber)) {
              next = { weekNumber, user: assigneeFor(template, templates, users, weekNumber) }
            }
          }

          const toView = (a: TaskAssignment | undefined) =>
            a && {
              id: a.id,
              weekNumber: a.weekNumber,
              year: a.year,
              isCompleted: a.status === 'completed',
              assignedUser: a.assignedTo as User,
              isMine: toId(a.assignedTo) === currentUser.id,
            }

          return { template, current: toView(current), overdue: toView(overdue), next }
        }),
    )

    return { success: true, cards }
  } catch (error) {
    console.error('Get restricted task cards error:', error)
    return { success: false, cards: [] }
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

    // Find all pending assignments from previous weeks
    const overdueResult = await payload.find({
      collection: 'task-assignments',
      where: overdueWhere(),
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

    let repeatedWithinTwoWeeks = false

    if (template.isCustom) {
      if (!parsed.data.selectedOption) {
        return { success: false, message: 'Bitte eine Aufgabe auswählen' }
      }

      // Trust boundary: der Client schickt nur einen Titel-String. Gegen die
      // Auswahlliste des Templates prüfen, statt ihn ungeprüft zu speichern.
      const isValidOption = (template.freeTaskOptions ?? []).some(
        (option) => option.title === parsed.data.selectedOption,
      )
      if (!isValidOption) {
        return { success: false, message: 'Unbekannte Aufgabe' }
      }

      const cutoff = new Date(now.getTime() - TWO_WEEKS_MS).toISOString()
      const recent = await payload.find({
        collection: 'task-completion-history',
        where: {
          selectedOption: { equals: parsed.data.selectedOption },
          completedAt: { greater_than_equal: cutoff },
        },
        limit: 1,
      })
      repeatedWithinTwoWeeks = recent.docs.length > 0
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
        repeatedWithinTwoWeeks,
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
 * Auswahllisten aller Freien Aufgaben (isCustom-Templates), jede Option
 * angereichert mit `lastDoneAt`, falls sie in den letzten 2 Wochen erledigt wurde.
 */
export async function getFreeTaskOptionLists() {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers })
    if (!user) return { success: false, lists: [] }

    const templates = (
      await payload.find({
        collection: 'task-templates',
        where: { isCustom: { equals: true } },
        limit: 20,
      })
    ).docs as TaskTemplate[]

    const titles = templates.flatMap((t) => (t.freeTaskOptions ?? []).map((o) => o.title))
    const recent =
      titles.length === 0
        ? []
        : (
            await payload.find({
              collection: 'task-completion-history',
              where: {
                selectedOption: { in: titles },
                completedAt: {
                  greater_than_equal: new Date(Date.now() - TWO_WEEKS_MS).toISOString(),
                },
              },
              sort: '-completedAt',
              limit: 200,
            })
          ).docs

    const lists = templates.map((template) => ({
      templateId: template.id,
      templateTitle: template.title,
      options: withRecency(
        (template.freeTaskOptions ?? []).map((o) => ({
          id: o.id ?? o.title,
          title: o.title,
          description: o.description ?? null,
        })),
        recent,
        new Date(),
      ),
    }))

    return { success: true, lists }
  } catch (error) {
    console.error('Get free task options error:', error)
    return { success: false, lists: [] }
  }
}

/**
 * Get completion history for all "Freie Aufgaben" (isCustom templates).
 * Two-step: find custom template IDs, then query history for those templates.
 * Sorted newest to oldest by completedAt.
 */
export async function getCompletedFreeTaskHistory(): Promise<{
  success: boolean
  message?: string
  history: EnrichedFreeTask[]
}> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated', history: [] }
    }

    // Step 1: Find all templates where isCustom is true
    const templatesResult = await payload.find({
      collection: 'task-templates',
      where: { isCustom: { equals: true } },
      limit: 100,
    })
    const customTemplates = templatesResult.docs as TaskTemplate[]

    if (customTemplates.length === 0) {
      return { success: true, history: [] }
    }

    const customTemplateIds = customTemplates.map((t) => t.id)

    // Step 2: Find completion history entries for those template IDs
    const historyResult = await payload.find({
      collection: 'task-completion-history',
      where: { template: { in: customTemplateIds } },
      sort: '-completedAt',
      depth: 2,
      limit: 100,
    })

    const history = historyResult.docs
      .filter(
        (entry) =>
          typeof entry.template === 'object' &&
          typeof entry.completedBy === 'object',
      )
      .map((entry) => ({
        id: entry.id,
        template: entry.template as TaskTemplate,
        completedBy: entry.completedBy as User,
        completedAt: entry.completedAt,
        weekNumber: entry.weekNumber,
        year: entry.year,
        notes: entry.notes,
        selectedOption: entry.selectedOption,
        repeatedWithinTwoWeeks: entry.repeatedWithinTwoWeeks,
      }))

    return { success: true, history }
  } catch (error) {
    console.error('Get completed free task history error:', error)
    return { success: false, message: 'Failed to load history', history: [] }
  }
}

/**
 * Löscht alle überfälligen (offenen, aus Vorwochen stammenden) Aufgaben — nur Admin.
 * Die aktuelle Woche bleibt unangetastet. Die Rotation ist formelbasiert,
 * Löschen verschiebt also keine künftige Zuteilung.
 */
export async function deleteOverdueAssignments() {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: await config })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'Admin access required' }
    }

    const result = await payload.delete({
      collection: 'task-assignments',
      where: overdueWhere(),
      overrideAccess: true,
    })

    return {
      success: true,
      deleted: result.docs.length,
      message: `${result.docs.length} überfällige Aufgaben gelöscht`,
    }
  } catch (error) {
    console.error('Delete overdue assignments error:', error)
    return { success: false, message: 'Fehler beim Löschen' }
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
