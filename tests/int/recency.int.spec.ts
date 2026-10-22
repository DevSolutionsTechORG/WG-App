import { describe, expect, it } from 'vitest'
import { TWO_WEEKS_MS, withRecency } from '@/lib/cleaning/recency'

const now = new Date('2026-08-06T12:00:00.000Z')
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

const options = [
  { title: 'Fenster putzen' },
  { title: 'Müll rausbringen' },
  { title: 'Kühlschrank reinigen' },
]

describe('withRecency', () => {
  it('markiert eine Option als kürzlich erledigt, wenn Treffer innerhalb 14 Tagen liegt', () => {
    const result = withRecency(
      options,
      [{ selectedOption: 'Fenster putzen', completedAt: daysAgo(3) }],
      now,
    )
    expect(result.find((o) => o.title === 'Fenster putzen')?.lastDoneAt).toBe(daysAgo(3))
    expect(result.find((o) => o.title === 'Müll rausbringen')?.lastDoneAt).toBeNull()
  })

  it('zählt einen Treffer genau an der 14-Tage-Grenze noch mit', () => {
    const exactlyAtCutoff = new Date(now.getTime() - TWO_WEEKS_MS).toISOString()
    const result = withRecency(
      options,
      [{ selectedOption: 'Fenster putzen', completedAt: exactlyAtCutoff }],
      now,
    )
    expect(result.find((o) => o.title === 'Fenster putzen')?.lastDoneAt).toBe(exactlyAtCutoff)
  })

  it('ignoriert Treffer außerhalb von 14 Tagen', () => {
    const result = withRecency(
      options,
      [{ selectedOption: 'Fenster putzen', completedAt: daysAgo(15) }],
      now,
    )
    expect(result.find((o) => o.title === 'Fenster putzen')?.lastDoneAt).toBeNull()
  })

  it('nimmt bei mehreren Treffern den jüngsten', () => {
    const result = withRecency(
      options,
      [
        { selectedOption: 'Müll rausbringen', completedAt: daysAgo(10) },
        { selectedOption: 'Müll rausbringen', completedAt: daysAgo(2) },
        { selectedOption: 'Müll rausbringen', completedAt: daysAgo(7) },
      ],
      now,
    )
    expect(result.find((o) => o.title === 'Müll rausbringen')?.lastDoneAt).toBe(daysAgo(2))
  })

  it('ignoriert Einträge ohne selectedOption oder mit unbekanntem Titel', () => {
    const result = withRecency(
      options,
      [
        { selectedOption: null, completedAt: daysAgo(1) },
        { selectedOption: 'Unbekannte Aufgabe', completedAt: daysAgo(1) },
      ],
      now,
    )
    expect(result.every((o) => o.lastDoneAt === null)).toBe(true)
  })
})
