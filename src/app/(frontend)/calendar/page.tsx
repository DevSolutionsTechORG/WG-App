'use client'

import 'react-big-calendar/lib/css/react-big-calendar.css'

import { Calendar, SlotInfo, View, Views, dateFnsLocalizer } from 'react-big-calendar'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'
import { createEvent, deleteEvent, getEvents, updateEvent } from '@/lib/calendar/actions'
import {
  format,
  getDay,
  getMonth,
  getYear,
  isSameMonth,
  parse,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { de } from 'date-fns/locale/de'

const locales = { de }

const localizer = dateFnsLocalizer({
  format,
  parse: (value: string, formatStr: string, referenceDate: Date) =>
    parse(value, formatStr, referenceDate, { locale: de }),
  startOfWeek: (date: Date) => startOfWeek(date, { locale: de }),
  getDay,
  locales,
})

type EventType = 'wg-meeting' | 'party' | 'cleaning' | 'other'

const eventTypeColors: Record<EventType, string> = {
  'wg-meeting': '#3b82f6',
  party: '#8b5cf6',
  cleaning: '#10b981',
  other: '#6b7280',
}

const eventTypeLabels: Record<EventType, string> = {
  'wg-meeting': 'WG-Treffen',
  party: 'Party',
  cleaning: 'Reinigung',
  other: 'Sonstiges',
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource?: {
    description?: string
    location?: string
    eventType: EventType
  }
}

interface FormData {
  title: string
  startDate: string
  endDate: string
  allDay: boolean
  description: string
  location: string
  eventType: EventType
}

const makeDefaultForm = (start: Date, end: Date): FormData => ({
  title: '',
  startDate: format(start, "yyyy-MM-dd'T'HH:mm"),
  endDate: format(end, "yyyy-MM-dd'T'HH:mm"),
  allDay: false,
  description: '',
  location: '',
  eventType: 'other',
})

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [formData, setFormData] = useState<FormData>(() => {
    const now = new Date()
    return makeDefaultForm(now, new Date(now.getTime() + 60 * 60 * 1000))
  })

  // Ref für den Touch-Handler — hält immer die aktuellen events + currentDate
  // ohne den useCallback neu erstellen zu müssen
  const eventsRef = useRef(events)
  const currentDateRef = useRef(currentDate)
  useEffect(() => {
    eventsRef.current = events
  }, [events])
  useEffect(() => {
    currentDateRef.current = currentDate
  }, [currentDate])

  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    const start = new Date(getYear(currentDate), getMonth(currentDate), 1)
    const end = new Date(getYear(currentDate), getMonth(currentDate) + 1, 0, 23, 59, 59)
    const result = await getEvents(start.toISOString(), end.toISOString())
    if (result.success && result.events) {
      setEvents(
        result.events.map((event) => ({
          id: event.id,
          title: event.title,
          start: parseISO(event.startDate),
          end: event.endDate ? parseISO(event.endDate) : parseISO(event.startDate),
          allDay: event.allDay ?? undefined,
          resource: {
            description: event.description ?? undefined,
            location: event.location ?? undefined,
            eventType: (event.eventType as EventType) ?? 'other',
          },
        })),
      )
    }
    setIsLoading(false)
  }, [currentDate])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    console.log('events: ', events)
  }, [events])

  const updateForm = useCallback(
    (patch: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...patch })),
    [],
  )

  const openCreateModal = useCallback(() => {
    const now = new Date()
    setSelectedEvent(null)
    setFormData(makeDefaultForm(now, new Date(now.getTime() + 60 * 60 * 1000)))
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const { start, end } = slotInfo
    setSelectedEvent(null)
    setFormData(makeDefaultForm(start as Date, end as Date))
    setIsModalOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      startDate: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(event.end, "yyyy-MM-dd'T'HH:mm"),
      allDay: event.allDay ?? false,
      description: event.resource?.description ?? '',
      location: event.resource?.location ?? '',
      eventType: event.resource?.eventType ?? 'other',
    })
    setIsModalOpen(true)
  }, [])

  const handleDrillDown = useCallback((date: Date) => {
    setSelectedEvent(null)
    setFormData(makeDefaultForm(date, new Date(date.getTime() + 60 * 60 * 1000)))
    setIsModalOpen(true)
  }, [])

  const getDrilldownView = useCallback(() => null, [])

  // Touch-Handler: umgeht RBCs unzuverlässiges Touch-Routing auf Mobile
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0]
      const target = document.elementFromPoint(touch.clientX, touch.clientY)
      if (!target) return

      // 1. Termin angeklickt?
      const eventEl = target.closest('.rbc-event') as HTMLElement | null
      if (eventEl) {
        const eventId = eventEl.dataset.eventId
        const found = eventsRef.current.find((ev) => ev.id === eventId)
        if (found) {
          handleSelectEvent(found)
          return
        }
      }

      // 2. Tageszahl angeklickt (.rbc-date-cell enthält den Link/Button mit der Zahl)
      const dateCellEl = target.closest('.rbc-date-cell') as HTMLElement | null
      if (dateCellEl) {
        const dayNum = parseInt(dateCellEl.textContent?.trim() ?? '0', 10)
        if (!dayNum) return
        const date = new Date(
          getYear(currentDateRef.current),
          getMonth(currentDateRef.current),
          dayNum,
        )
        handleDrillDown(date)
        return
      }

      // 3. Leere Tagesfläche angeklickt (.rbc-day-bg)
      const dayBgEl = target.closest('.rbc-day-bg') as HTMLElement | null
      if (dayBgEl) {
        const row = dayBgEl.closest('.rbc-month-row')
        if (!row) return
        const cells = Array.from(row.querySelectorAll('.rbc-day-bg'))
        const colIndex = cells.indexOf(dayBgEl)
        const dateCells = Array.from(row.querySelectorAll('.rbc-date-cell'))
        const dayNum = parseInt(dateCells[colIndex]?.textContent?.trim() ?? '0', 10)
        if (!dayNum) return
        const date = new Date(
          getYear(currentDateRef.current),
          getMonth(currentDateRef.current),
          dayNum,
        )
        handleDrillDown(date)
      }
    },
    [handleSelectEvent, handleDrillDown],
  )

  const handleSave = useCallback(async () => {
    const data = {
      title: formData.title,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      allDay: formData.allDay,
      description: formData.description || undefined,
      location: formData.location || undefined,
      eventType: formData.eventType,
    }
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, data)
    } else {
      await createEvent(data)
    }
    setIsModalOpen(false)
    loadEvents()
  }, [formData, selectedEvent, loadEvents])

  const handleDelete = useCallback(async () => {
    if (selectedEvent && confirm('Termin wirklich löschen?')) {
      await deleteEvent(selectedEvent.id)
      setIsModalOpen(false)
      loadEvents()
    }
  }, [selectedEvent, loadEvents])

  // data-event-id damit der Touch-Handler Events identifizieren kann
  const eventPropGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: eventTypeColors[event.resource?.eventType ?? 'other'],
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
      },
      'data-event-id': event.id,
    }),
    [],
  )

  const currentMonthEvents = useMemo(
    () =>
      events
        .filter((e) => isSameMonth(e.start, currentDate))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, currentDate],
  )

  const formats = useMemo(
    () => ({
      monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: de }),
      dayHeaderFormat: (date: Date) => format(date, 'EEEE dd.MM', { locale: de }),
      dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, 'dd.MM.', { locale: de })} – ${format(end, 'dd.MM.yyyy', { locale: de })}`,
    }),
    [],
  )

  const messages = useMemo(
    () => ({
      today: 'Heute',
      previous: 'Zurück',
      next: 'Weiter',
      month: 'Monat',
      week: 'Woche',
      day: 'Tag',
      agenda: 'Agenda',
      date: 'Datum',
      time: 'Zeit',
      event: 'Termin',
      noEventsInRange: 'Keine Termine in diesem Zeitraum',
      showMore: (count: number) => `+${count} weitere`,
    }),
    [],
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            Kalender
          </h1>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Termin erstellen
          </button>
        </div>

        {/* Kalender-Wrapper: onTouchEnd fängt alle Touch-Events direkt ab */}
        <div className="bg-card rounded-lg shadow border p-4" onTouchEnd={handleTouchEnd}>
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">Lade Kalender...</p>
            </div>
          ) : (
            <Calendar<CalendarEvent>
              localizer={localizer}
              events={events}
              date={currentDate}
              view={currentView}
              onView={setCurrentView}
              onNavigate={setCurrentDate}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              defaultView={Views.MONTH}
              views={{ month: true }}
              culture="de"
              formats={formats}
              messages={messages}
              selectable
              longPressThreshold={10}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
              onDrillDown={handleDrillDown}
              getDrilldownView={getDrilldownView}
              popup
            />
          )}
        </div>

        {/* Event-Liste */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Termine im {format(currentDate, 'MMMM yyyy', { locale: de })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate((d) => new Date(getYear(d), getMonth(d) - 1, 1))}
                className="p-1.5 rounded hover:bg-muted"
                aria-label="Vorheriger Monat"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-1 text-xs rounded hover:bg-muted text-muted-foreground"
              >
                Heute
              </button>
              <button
                onClick={() => setCurrentDate((d) => new Date(getYear(d), getMonth(d) + 1, 1))}
                className="p-1.5 rounded hover:bg-muted"
                aria-label="Nächster Monat"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {currentMonthEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Keine Termine in diesem Monat
            </p>
          ) : (
            <div className="space-y-2">
              {currentMonthEvents.map((event) => {
                const color = eventTypeColors[event.resource?.eventType ?? 'other']
                const label = eventTypeLabels[event.resource?.eventType ?? 'other']
                return (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="mt-0.5 w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{event.title}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {event.allDay
                          ? format(event.start, 'dd. MMMM', { locale: de })
                          : `${format(event.start, 'dd. MMM, HH:mm', { locale: de })} – ${format(event.end, 'HH:mm', { locale: de })} Uhr`}
                      </div>
                      {event.resource?.location && (
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.resource.location}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">
                {selectedEvent ? 'Termin bearbeiten' : 'Neuer Termin'}
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1">Titel *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Typ</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => updateForm({ eventType: e.target.value as EventType })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="wg-meeting">WG-Treffen</option>
                  <option value="party">Party</option>
                  <option value="cleaning">Reinigung</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => updateForm({ allDay: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="allDay" className="text-sm">
                  Ganztägig
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start *</label>
                  <input
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={formData.startDate}
                    onChange={(e) => updateForm({ startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ende</label>
                  <input
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={formData.endDate}
                    onChange={(e) => updateForm({ endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateForm({ location: e.target.value })}
                  placeholder="z.B. Wohnzimmer"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!formData.title || !formData.startDate}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {selectedEvent ? 'Speichern' : 'Erstellen'}
                </button>
                {selectedEvent && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
