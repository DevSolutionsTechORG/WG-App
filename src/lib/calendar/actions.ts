'use server'

import type { Event, User } from '@/payload-types'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { createEventSchema, idSchema, updateEventSchema } from '@/lib/schemas'
import type { ParsedIcsEvent } from '@/lib/calendar/ics-parser'

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

export async function createEvent(input: unknown) {
  const parsed = createEventSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, message: 'Ungültige Eingabe' }
  }

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
        ...parsed.data,
        createdBy: currentUser.id,
      },
    })

    return { success: true, event, message: 'Termin erstellt' }
  } catch (error) {
    console.error('Create event error:', error)
    return { success: false, message: 'Fehler beim Erstellen' }
  }
}

async function loadEventOwner(payload: Awaited<ReturnType<typeof getPayload>>, eventId: string) {
  const event = (await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
    overrideAccess: true,
  })) as Event | null
  if (!event) return null
  const ownerId = typeof event.createdBy === 'string' ? event.createdBy : (event.createdBy as User).id
  return { event, ownerId }
}

export async function updateEvent(eventId: unknown, input: unknown) {
  const idResult = idSchema.safeParse(eventId)
  const dataResult = updateEventSchema.safeParse(input)
  if (!idResult.success || !dataResult.success) {
    return { success: false, message: 'Ungültige Eingabe' }
  }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const owner = await loadEventOwner(payload, idResult.data)
    if (!owner) return { success: false, message: 'Termin nicht gefunden' }

    if (currentUser.role !== 'admin' && owner.ownerId !== currentUser.id) {
      return { success: false, message: 'Nicht berechtigt' }
    }

    const event = await payload.update({
      collection: 'events',
      id: idResult.data,
      data: dataResult.data,
    })

    return { success: true, event, message: 'Termin aktualisiert' }
  } catch (error) {
    console.error('Update event error:', error)
    return { success: false, message: 'Fehler beim Aktualisieren' }
  }
}

export async function deleteEvent(eventId: unknown) {
  const idResult = idSchema.safeParse(eventId)
  if (!idResult.success) {
    return { success: false, message: 'Ungültige Eingabe' }
  }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const owner = await loadEventOwner(payload, idResult.data)
    if (!owner) return { success: false, message: 'Termin nicht gefunden' }

    if (currentUser.role !== 'admin' && owner.ownerId !== currentUser.id) {
      return { success: false, message: 'Nicht berechtigt' }
    }

    await payload.delete({
      collection: 'events',
      id: idResult.data,
    })

    return { success: true, message: 'Termin gelöscht' }
  } catch (error) {
    console.error('Delete event error:', error)
    return { success: false, message: 'Fehler beim Löschen' }
  }
}

export async function importIcsEvents(
  events: ParsedIcsEvent[],
): Promise<{ success: boolean; imported: number; errors: number; message: string }> {
  if (!Array.isArray(events) || events.length === 0) {
    return { success: false, imported: 0, errors: 0, message: 'Keine Events übergeben' }
  }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, imported: 0, errors: 0, message: 'Not authenticated' }
    }

    let imported = 0
    let errors = 0

    for (const ev of events) {
      const parsed = createEventSchema.safeParse({
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate,
        allDay: ev.allDay,
        description: ev.description,
        location: ev.location,
        eventType: 'waste-collection',
      })
      if (!parsed.success) {
        errors++
        continue
      }
      try {
        await payload.create({
          collection: 'events',
          data: { ...parsed.data, createdBy: currentUser.id } as never,
        })
        imported++
      } catch {
        errors++
      }
    }

    return {
      success: true,
      imported,
      errors,
      message:
        errors === 0
          ? `${imported} Termine importiert`
          : `${imported} Termine importiert, ${errors} Fehler`,
    }
  } catch (error) {
    console.error('Import ICS error:', error)
    return { success: false, imported: 0, errors: 0, message: 'Import fehlgeschlagen' }
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
