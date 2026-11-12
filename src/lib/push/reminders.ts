import type { Payload } from 'payload'
import type { TaskTemplate } from '@/payload-types'
import { toId } from '@/lib/cleaning/rotation'
import { pushEnabled, sendPush } from '@/lib/push/send'

/**
 * Bewusst KEIN 'use server' (siehe send.ts).
 *
 * Erinnerungszeiten in Europe/Berlin — hier anpassen.
 * ponytail: der Server-Timer läuft stündlich, die Erinnerung kommt also
 * irgendwann in der Stunde ab der Zielzeit. Intervall in instrumentation.ts
 * verkürzen, falls es pünktlicher sein soll.
 */
export const WASTE_HOUR = 18 // Müll: am Vorabend ab 18 Uhr
export const TASK_HOURS: Record<string, number> = { Mon: 9, Fri: 17 } // Putzplan: Wochentag → ab Stunde
const QUIET_FROM = 22 // danach wird nichts mehr nachgeholt

function berlinClock(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    weekday: parts.weekday,
  }
}

const nextDay = (date: string) =>
  new Date(new Date(`${date}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10)

/** Reine Entscheidung, was zum Zeitpunkt `now` fällig ist — ohne DB testbar. */
export function dueReminders(now: Date) {
  const { date, hour, weekday } = berlinClock(now)
  const awake = hour < QUIET_FROM
  const taskHour = TASK_HOURS[weekday]
  return {
    today: date,
    /** Abholtag (yyyy-MM-dd), für den jetzt erinnert wird, sonst null. */
    wasteDay: awake && hour >= WASTE_HOUR ? nextDay(date) : null,
    tasks: awake && taskHour !== undefined && hour >= taskHour,
  }
}

/**
 * Verschickt fällige Erinnerungen. Idempotent: `reminderSentAt` am Termin bzw.
 * an der Aufgabe verhindert Doppelversand, auch über Server-Neustarts hinweg.
 */
export async function sendDueReminders(payload: Payload, now = new Date()) {
  if (!pushEnabled()) return
  const { today, wasteDay, tasks } = dueReminders(now)
  const sentAt = now.toISOString()

  if (wasteDay) {
    // Termine liegen als Mitternacht UTC des Kalendertags in der DB (Formular + ICS-Import).
    const { docs } = await payload.find({
      collection: 'events',
      where: {
        and: [
          { eventType: { equals: 'waste-collection' } },
          { startDate: { greater_than_equal: `${wasteDay}T00:00:00.000Z` } },
          { startDate: { less_than: `${nextDay(wasteDay)}T00:00:00.000Z` } },
          { reminderSentAt: { exists: false } },
        ],
      },
      depth: 0,
      limit: 20,
    })
    if (docs.length > 0) {
      await sendPush(payload, 'all', {
        title: 'Müll morgen',
        body: `${docs.map((event) => event.title).join(', ')} – Tonne heute Abend rausstellen.`,
        url: '/calendar',
        tag: 'waste',
      })
      await payload.update({
        collection: 'events',
        where: { id: { in: docs.map((event) => event.id) } },
        data: { reminderSentAt: sentAt },
      })
    }
  }

  if (tasks) {
    const { docs } = await payload.find({
      collection: 'task-assignments',
      where: {
        and: [
          { status: { equals: 'pending' } },
          {
            or: [
              { reminderSentAt: { exists: false } },
              { reminderSentAt: { less_than: `${today}T00:00:00.000Z` } },
            ],
          },
        ],
      },
      depth: 1,
      limit: 200,
    })

    const titlesByUser = new Map<string, string[]>()
    for (const assignment of docs) {
      const userId = toId(assignment.assignedTo)
      const title = (assignment.template as TaskTemplate)?.title ?? 'Aufgabe'
      titlesByUser.set(userId, [...(titlesByUser.get(userId) ?? []), title])
    }

    for (const [userId, titles] of titlesByUser) {
      const unique = [...new Set(titles)]
      await sendPush(payload, [userId], {
        title: 'Putzplan',
        body:
          unique.length === 1
            ? `Noch offen: ${unique[0]}`
            : `${titles.length} Aufgaben offen: ${unique.slice(0, 3).join(', ')}`,
        url: '/cleaning',
        tag: 'tasks',
      })
    }

    if (docs.length > 0) {
      await payload.update({
        collection: 'task-assignments',
        where: { id: { in: docs.map((assignment) => assignment.id) } },
        data: { reminderSentAt: sentAt },
      })
    }
  }
}
