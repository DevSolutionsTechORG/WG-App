import { describe, expect, it } from 'vitest'
import type { TaskTemplate, User } from '@/payload-types'
import { eligibleUsers, isDueInWeek, rotationIndex } from '@/lib/cleaning/rotation'
import { assigneeFor } from '@/lib/cleaning/generate'

const user = (id: string) => ({ id }) as User
const users = [user('a'), user('b'), user('c')]

describe('cleaning rotation', () => {
  it('weekly behält die bisherige Formel', () => {
    for (const weekNumber of [10, 11, 12, 52]) {
      expect(
        rotationIndex({
          weekNumber,
          rotationGroup: 1,
          indexInGroup: 2,
          frequency: 'weekly',
          eligibleCount: 3,
        }),
      ).toBe((weekNumber + 1 + 2) % 3)
    }
  })

  it('biweekly fällt nur in gerade Wochen', () => {
    expect(isDueInWeek('biweekly', 32)).toBe(true)
    expect(isDueInWeek('biweekly', 33)).toBe(false)
    expect(isDueInWeek('weekly', 33)).toBe(true)
  })

  it('biweekly rückt pro Vorkommen um genau einen Nutzer weiter', () => {
    const [first, ...rest] = [32, 34, 36, 38].map((weekNumber) =>
      rotationIndex({
        weekNumber,
        rotationGroup: 0,
        indexInGroup: 0,
        frequency: 'biweekly',
        eligibleCount: 3,
      }),
    )
    expect(rest).toEqual([1, 2, 3].map((step) => (first + step) % 3))
  })

  it('rotiert nur unter den konfigurierten Nutzern', () => {
    expect(eligibleUsers({ assignedUsers: null }, users)).toHaveLength(3)
    expect(eligibleUsers({ assignedUsers: ['c', user('a')] }, users).map((u) => u.id)).toEqual([
      'a',
      'c',
    ])
    expect(eligibleUsers({ assignedUsers: ['unknown-id'] }, users)).toHaveLength(0)
    expect(
      rotationIndex({
        weekNumber: 32,
        rotationGroup: 0,
        indexInGroup: 0,
        frequency: 'biweekly',
        eligibleCount: 0,
      }),
    ).toBe(-1)
  })

  it('assigneeFor: Gruppenindex aus voller Liste, biweekly nur unter berechtigten Nutzern', () => {
    const t = (id: string, rotationGroup: number, extra: Partial<TaskTemplate> = {}) =>
      ({ id, rotationGroup, frequency: 'weekly', ...extra }) as TaskTemplate
    const bath = t('bath', 1, { frequency: 'biweekly', assignedUsers: ['a', 'c'] })
    const templates = [t('x', 0), t('y', 0), bath]

    // Zweites Template in Gruppe 0 → indexInGroup 1, Formel (10 + 0 + 1) % 3
    expect(assigneeFor(templates[1], templates, users, 10)?.id).toBe(users[(10 + 1) % 3].id)
    // Biweekly KW 44 → Vorkommen 22: (22 + 1 + 0) % 2 = 1 → zweiter berechtigter Nutzer
    expect(assigneeFor(bath, templates, users, 44)?.id).toBe('c')
    expect(assigneeFor(bath, templates, users, 46)?.id).toBe('a')
  })
})
