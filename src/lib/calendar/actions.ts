'use server'

import type { Event, User } from '@/payload-types'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

/**
 * Get events for a date range
 */
export async function getEvents(startDate?: string, endDate?: string) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated', events: [] }
    }

    const where: { and?: unknown[] } = {}

    if (startDate && endDate) {
      where.and = [
        { startDate: { greater_than_equal: startDate } },
        { startDate: { less_than_equal: endDate } },
      ]
    }

    const result = await payload.find({
      collection: 'events',
      where: where as never,
      sort: 'startDate',
      depth: 1,
      limit: 200,
    })

    return {
      success: true,
      events: result.docs as Event[],
      total: result.totalDocs,
    }
  } catch (error) {
    console.error('Get events error:', error)
    return { success: false, message: 'Failed to load events', events: [] }
  }
}

/**
 * Create new event
 */
export async function createEvent(data: {
  title: string
  startDate: string
  endDate?: string
  allDay?: boolean
  description?: string
  location?: string
  eventType?: 'wg-meeting' | 'party' | 'cleaning' | 'other'
}) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const event = await payload.create({
      collection: 'events',
      data: {
        ...data,
        createdBy: currentUser.id,
      },
    })

    return { success: true, event, message: 'Termin erstellt' }
  } catch (error) {
    console.error('Create event error:', error)
    return { success: false, message: 'Fehler beim Erstellen' }
  }
}

/**
 * Update event
 */
export async function updateEvent(
  eventId: string,
  data: {
    title?: string
    startDate?: string
    endDate?: string
    allDay?: boolean
    description?: string
    location?: string
    eventType?: 'wg-meeting' | 'party' | 'cleaning' | 'other'
  },
) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const event = await payload.update({
      collection: 'events',
      id: eventId,
      data,
    })

    return { success: true, event, message: 'Termin aktualisiert' }
  } catch (error) {
    console.error('Update event error:', error)
    return { success: false, message: 'Fehler beim Aktualisieren' }
  }
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    await payload.delete({
      collection: 'events',
      id: eventId,
    })

    return { success: true, message: 'Termin gelöscht' }
  } catch (error) {
    console.error('Delete event error:', error)
    return { success: false, message: 'Fehler beim Löschen' }
  }
}

/**
 * Get events for a specific month
 */
export async function getEventsForMonth(year: number, month: number) {
  // month is 0-indexed (0 = January)
  const startDate = new Date(year, month, 1).toISOString()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  return getEvents(startDate, endDate)
}
