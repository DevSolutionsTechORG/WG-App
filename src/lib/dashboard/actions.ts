'use server'

import type { Event, ShoppingItem, TaskAssignment } from '@/payload-types'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { getISOWeek } from '@/lib/cleaning/generate'

/**
 * Get dashboard overview data
 */
export async function getDashboardData() {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    // Get current week number and year
    const now = new Date()
    const weekNumber = getISOWeek(now)
    const year = now.getFullYear()

    // Get user's current cleaning tasks (all tasks, not just this week)
    const assignmentsResult = await payload.find({
      collection: 'task-assignments',
      where: {
        and: [{ assignedTo: { equals: currentUser.id } }, { status: { not_equals: 'completed' } }],
      },
      sort: 'dueDate',
      depth: 2,
      limit: 10,
    })

    // Get shopping items
    const shoppingResult = await payload.find({
      collection: 'shopping-items',
      where: { status: { equals: 'open' } },
      sort: 'createdAt',
      depth: 1,
      limit: 10,
    })

    // Get events for the next 14 days
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const eventsResult = await payload.find({
      collection: 'events',
      where: {
        and: [
          // Ganztägige Termine liegen auf Mitternacht UTC ihres Tages — ab Tagesbeginn
          // filtern, sonst fehlen die heutigen Termine.
          { startDate: { greater_than_equal: `${now.toISOString().slice(0, 10)}T00:00:00.000Z` } },
          { startDate: { less_than_equal: twoWeeksLater.toISOString() } },
        ],
      },
      sort: 'startDate',
      depth: 1,
      limit: 20,
    })

    // Get overdue tasks
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday
    const overdueResult = await payload.find({
      collection: 'task-assignments',
      where: {
        and: [
          { assignedTo: { equals: currentUser.id } },
          { dueDate: { less_than: pastDate.toISOString() } },
          { status: { not_equals: 'completed' } },
        ],
      },
      sort: 'dueDate',
      depth: 1,
      limit: 5,
    })

    return {
      success: true,
      data: {
        currentUser,
        currentWeek: weekNumber,
        currentYear: year,
        myTasks: assignmentsResult.docs as TaskAssignment[],
        openShoppingItems: shoppingResult.docs as ShoppingItem[],
        upcomingEvents: eventsResult.docs as Event[],
        overdueTasks: overdueResult.docs as TaskAssignment[],
      },
    }
  } catch (error) {
    console.error('Dashboard data error:', error)
    return { success: false, message: 'Failed to load dashboard data' }
  }
}
