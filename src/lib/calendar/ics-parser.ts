export type ParsedIcsEvent = {
  title: string
  startDate: string
  endDate: string
  allDay: boolean
  description?: string
  location?: string
}

function parseIcsDate(value: string, isAllDay: boolean): string {
  // All-day: YYYYMMDD → midnight UTC ISO
  if (isAllDay && /^\d{8}$/.test(value)) {
    const y = value.slice(0, 4)
    const m = value.slice(4, 6)
    const d = value.slice(6, 8)
    return `${y}-${m}-${d}T00:00:00.000Z`
  }
  // With time: YYYYMMDDTHHmmss[Z]
  if (/^\d{8}T\d{6}/.test(value)) {
    const y = value.slice(0, 4)
    const mo = value.slice(4, 6)
    const d = value.slice(6, 8)
    const h = value.slice(9, 11)
    const mi = value.slice(11, 13)
    const s = value.slice(13, 15)
    const z = value.endsWith('Z') ? 'Z' : '+00:00'
    return `${y}-${mo}-${d}T${h}:${mi}:${s}.000${z}`
  }
  return new Date().toISOString()
}

function unfoldLines(raw: string): string[] {
  // RFC 5545: lines folded with CRLF + whitespace must be unfolded
  return raw.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').split('\n')
}

function decodeIcsText(value: string): string {
  return value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

export function parseIcs(content: string): ParsedIcsEvent[] {
  const lines = unfoldLines(content)
  const events: ParsedIcsEvent[] = []

  let inEvent = false
  let current: Partial<ParsedIcsEvent> & { rawStart?: string; rawEnd?: string; startAllDay?: boolean } = {}

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      current = {}
      continue
    }
    if (line === 'END:VEVENT') {
      inEvent = false
      if (current.title && current.rawStart) {
        const allDay = current.startAllDay ?? false
        const startDate = parseIcsDate(current.rawStart, allDay)
        // DTEND for all-day is exclusive (next day) — use startDate as endDate
        const endDate = current.rawEnd ? parseIcsDate(current.rawEnd, allDay) : startDate
        events.push({
          title: current.title,
          startDate,
          endDate: allDay && current.rawEnd ? parseIcsDate(current.rawStart, true) : endDate,
          allDay,
          ...(current.description ? { description: current.description } : {}),
          ...(current.location ? { location: current.location } : {}),
        })
      }
      continue
    }

    if (!inEvent) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const prop = line.slice(0, colonIdx).toUpperCase()
    const value = line.slice(colonIdx + 1).trim()

    if (prop === 'SUMMARY') {
      current.title = decodeIcsText(value)
    } else if (prop.startsWith('DTSTART')) {
      current.startAllDay = prop.includes('VALUE=DATE') && !prop.includes('DATE-TIME')
      current.rawStart = value
    } else if (prop.startsWith('DTEND')) {
      current.rawEnd = value
    } else if (prop === 'DESCRIPTION') {
      current.description = decodeIcsText(value)
    } else if (prop === 'LOCATION') {
      current.location = decodeIcsText(value)
    }
  }

  return events
}
