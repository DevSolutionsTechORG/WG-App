import type { TaskTemplate, User } from '@/payload-types'

/** Relationship-Werte kommen je nach depth als String-ID oder als Objekt. */
export const toId = (value: string | { id: string }): string =>
  typeof value === 'string' ? value : value.id

/**
 * Biweekly nur in geraden KW ("1 Woche Zeit"): erzeugt in der geraden Woche,
 * fällig Freitag, überfällig in der folgenden ungeraden Woche.
 * ponytail: 'monthly' verhält sich weiterhin wie 'weekly' — wie bisher.
 * Regel ergänzen, sobald es tatsächlich eine monatliche Aufgabe gibt.
 */
export function isDueInWeek(
  frequency: TaskTemplate['frequency'] | null | undefined,
  weekNumber: number,
): boolean {
  return frequency === 'biweekly' ? weekNumber % 2 === 0 : true
}

/** Aufgaben mit fester Nutzerliste (z.B. Badezimmer) bekommen eine eigene, permanente Karte. */
export const isRestricted = (template: Pick<TaskTemplate, 'assignedUsers'>) =>
  (template.assignedUsers?.length ?? 0) > 0

/** Berechtigte Nutzer: explizite Liste falls gesetzt, sonst alle. Reihenfolge folgt `users`, damit die Rotation stabil bleibt. */
export function eligibleUsers(
  template: Pick<TaskTemplate, 'assignedUsers'>,
  users: User[],
): User[] {
  const picked = template.assignedUsers
  if (!picked || picked.length === 0) return users
  const ids = new Set(picked.map(toId))
  return users.filter((user) => ids.has(user.id))
}

/**
 * Index in die Liste der berechtigten Nutzer.
 * Weekly behält exakt die bisherige Formel: (weekNumber + rotationGroup + indexInGroup) % n.
 * Biweekly zählt Vorkommen (weekNumber / 2), damit pro Vorkommen um genau
 * einen Nutzer weitergerückt wird statt um zwei. -1 = niemand berechtigt.
 */
export function rotationIndex({
  weekNumber,
  rotationGroup,
  indexInGroup,
  frequency,
  eligibleCount,
}: {
  weekNumber: number
  rotationGroup: number
  indexInGroup: number
  frequency?: TaskTemplate['frequency'] | null
  eligibleCount: number
}): number {
  if (eligibleCount <= 0) return -1
  const occurrence = frequency === 'biweekly' ? Math.floor(weekNumber / 2) : weekNumber
  return (occurrence + rotationGroup + indexInGroup) % eligibleCount
}
