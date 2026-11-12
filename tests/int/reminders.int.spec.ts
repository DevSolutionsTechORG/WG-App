import { describe, expect, it } from 'vitest'
import { dueReminders } from '@/lib/push/reminders'

// Zeitpunkte in UTC; Berlin ist im November UTC+1, im Juli UTC+2.
describe('dueReminders', () => {
  it('erinnert am Vorabend ab 18 Uhr Berliner Zeit an den Müll von morgen', () => {
    expect(dueReminders(new Date('2026-11-12T16:59:00Z')).wasteDay).toBeNull() // 17:59
    expect(dueReminders(new Date('2026-11-12T17:05:00Z')).wasteDay).toBe('2026-11-13') // 18:05
    expect(dueReminders(new Date('2026-07-31T16:05:00Z')).wasteDay).toBe('2026-08-01') // Sommerzeit, Monatswechsel
  })

  it('holt nach 22 Uhr nichts mehr nach', () => {
    expect(dueReminders(new Date('2026-11-12T21:30:00Z')).wasteDay).toBeNull() // 22:30
  })

  it('erinnert an Putzaufgaben nur Montag ab 9 und Freitag ab 17 Uhr', () => {
    expect(dueReminders(new Date('2026-11-09T07:30:00Z')).tasks).toBe(false) // Mo 08:30
    expect(dueReminders(new Date('2026-11-09T08:30:00Z')).tasks).toBe(true) // Mo 09:30
    expect(dueReminders(new Date('2026-11-11T12:00:00Z')).tasks).toBe(false) // Mi
    expect(dueReminders(new Date('2026-11-13T15:30:00Z')).tasks).toBe(false) // Fr 16:30
    expect(dueReminders(new Date('2026-11-13T16:30:00Z')).tasks).toBe(true) // Fr 17:30
  })

  it('liefert das Berliner Datum, nicht das UTC-Datum', () => {
    expect(dueReminders(new Date('2026-11-12T23:30:00Z')).today).toBe('2026-11-13')
  })
})
