import type { Payload } from 'payload'
import type { TaskAssignment, TaskTemplate, User } from '@/payload-types'
import { eligibleUsers, isDueInWeek, rotationIndex, toId } from '@/lib/cleaning/rotation'

/**
 * Bewusst KEIN 'use server': alles hier nimmt eine Payload-Instanz entgegen
 * und darf nie als Server Action vom Client aufrufbar sein.
 */

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function getFridayOfWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7 // 1 = Monday, 7 = Sunday
  const firstMonday = new Date(year, 0, 4 - jan4Day + 1)
  const friday = new Date(firstMonday)
  friday.setDate(firstMonday.getDate() + (week - 1) * 7 + 4)
  return friday
}

export async function getActiveUsers(payload: Payload): Promise<User[]> {
  const result = await payload.find({
    collection: 'users',
    where: { role: { in: ['member', 'admin'] } },
    limit: 100,
  })
  return result.docs as User[]
}

/**
 * Wer ist in `weekNumber` für `template` dran? `templates` ist die volle
 * Template-Liste in DB-Reihenfolge: der Index innerhalb der Rotationsgruppe
 * gehört zur Formel und darf sich durch Überspringen nie verschieben.
 */
export function assigneeFor(
  template: TaskTemplate,
  templates: TaskTemplate[],
  users: User[],
  weekNumber: number,
): User | null {
  const rotationGroup = template.rotationGroup || 0
  const indexInGroup = templates
    .filter((t) => (t.rotationGroup || 0) === rotationGroup)
    .findIndex((t) => t.id === template.id)
  const eligible = eligibleUsers(template, users)
  const index = rotationIndex({
    weekNumber,
    rotationGroup,
    indexInGroup,
    frequency: template.frequency,
    eligibleCount: eligible.length,
  })
  return index < 0 ? null : eligible[index]
}

/**
 * Create the assignments that are missing for a given week.
 * Idempotent per template: templates already present in `existing` are skipped.
 * Returns only the newly created assignments.
 */
export async function generateAssignmentsForWeek(
  weekNumber: number,
  year: number,
  users: User[],
  payload: Payload,
  existing: TaskAssignment[] = [],
): Promise<TaskAssignment[]> {
  const templatesResult = await payload.find({
    collection: 'task-templates',
    limit: 100,
  })
  const templates = templatesResult.docs as TaskTemplate[]
  if (templates.length === 0) return []

  const alreadyAssigned = new Set(existing.map((a) => toId(a.template)))
  const created: TaskAssignment[] = []

  for (const template of templates) {
    if (alreadyAssigned.has(template.id)) continue
    if (!isDueInWeek(template.frequency, weekNumber)) continue

    const assignee = assigneeFor(template, templates, users, weekNumber)
    if (!assignee) continue // Nutzerliste gesetzt, aber kein aktiver Nutzer passt

    try {
      const assignment = await payload.create({
        collection: 'task-assignments',
        data: {
          template: template.id,
          assignedTo: assignee.id,
          weekNumber,
          year,
          status: 'pending',
          dueDate: getFridayOfWeek(year, weekNumber).toISOString(),
        },
        overrideAccess: true,
      })
      created.push(assignment as TaskAssignment)
    } catch (error) {
      // Der beforeChange-Hook der Collection wirft bei Duplikaten
      // (TaskAssignments.ts). Nicht fatal — darf nie die ganze Seite killen.
      // ponytail: find-then-create ist nicht atomar; Mongo-Unique-Index auf
      // (template, weekNumber, year), falls je echte Duplikate auftauchen.
      console.error(`Assignment skipped for template ${template.id}:`, error)
    }
  }

  return created
}

/**
 * Stellt sicher, dass alle Aufgaben der Woche von `date` existieren, und
 * liefert sie (depth 2) zurück. Aufgerufen vom stündlichen Server-Timer
 * (instrumentation.ts) und als Fallback beim Seitenaufruf.
 */
export async function ensureWeekAssignments(payload: Payload, date = new Date()) {
  const currentWeek = getISOWeek(date)
  const currentYear = date.getFullYear()
  const users = await getActiveUsers(payload)

  const existing = await payload.find({
    collection: 'task-assignments',
    where: { weekNumber: { equals: currentWeek }, year: { equals: currentYear } },
    depth: 2,
    limit: 100,
  })
  let assignments = existing.docs as TaskAssignment[]

  if (users.length > 0) {
    const created = await generateAssignmentsForWeek(
      currentWeek,
      currentYear,
      users,
      payload,
      assignments,
    )
    if (created.length > 0) assignments = [...assignments, ...created]
  }

  return { currentWeek, currentYear, users, assignments }
}
