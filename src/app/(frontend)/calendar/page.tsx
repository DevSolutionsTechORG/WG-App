'use client'

import 'react-big-calendar/lib/css/react-big-calendar.css'

import { Calendar, SlotInfo, Views, dateFnsLocalizer } from 'react-big-calendar'
import { Calendar as CalendarIcon, Plus, Trash2, Upload } from 'lucide-react'
import { createEvent, deleteEvent, getEvents, importIcsEvents, updateEvent } from '@/lib/calendar/actions'
import { parseIcs } from '@/lib/calendar/ics-parser'
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

import { EventListOverview } from '@/components/EventListOverview'
import { useAuth } from '@/hooks/useAuth'
import type { View } from 'react-big-calendar'
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

type EventType = 'wg-meeting' | 'party' | 'cleaning' | 'waste-collection' | 'other'

const eventTypeColors: Record<EventType, string> = {
  'wg-meeting': '#3b82f6',
  party: '#8b5cf6',
  cleaning: '#10b981',
  'waste-collection': '#f59e0b',
  other: '#6b7280',
}

const eventTypeLabels: Record<EventType, string> = {
  'wg-meeting': 'WG-Treffen',
  party: 'Party',
  cleaning: 'Reinigung',
  'waste-collection': 'Abfallentsorgung',
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
    createdById?: string
    createdByName?: string
  }
}

interface FormData {
  title: string
  startDate: string
  endDate: string
  multiDay: boolean
  description: string
  location: string
  eventType: EventType
}

const makeDefaultForm = (start: Date, end: Date): FormData => ({
  title: '',
  startDate: format(start, 'yyyy-MM-dd'),
  endDate: format(start, 'yyyy-MM-dd'), // Use start date as end date for single-day events
  multiDay: false,
  description: '',
  location: '',
  eventType: 'other',
})

export default function CalendarPage() {
  const { user } = useAuth()
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

  const icsInputRef = useRef<HTMLInputElement>(null)

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
            createdById:
              typeof event.createdBy === 'string' ? event.createdBy : event.createdBy?.id,
            createdByName:
              typeof event.createdBy === 'string' ? '' : ((event.createdBy as any)?.name ?? ''),
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

  const handleIcsImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      const text = await file.text()
      const parsed = parseIcs(text)
      if (parsed.length === 0) {
        alert('Keine Termine in der ICS-Datei gefunden.')
        return
      }
      if (!confirm(`${parsed.length} Termine gefunden. Importieren?`)) return
      const result = await importIcsEvents(parsed)
      alert(result.message)
      if (result.imported > 0) loadEvents()
    },
    [loadEvents],
  )

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
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for comparison

    const slotDate = new Date(start)
    slotDate.setHours(0, 0, 0, 0) // Set to start of day for comparison

    // Prevent creating events on past dates
    if (slotDate < today) {
      return
    }

    setSelectedEvent(null)
    setFormData(makeDefaultForm(start as Date, end as Date))
    setIsModalOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      startDate: format(event.start, 'yyyy-MM-dd'),
      endDate: format(event.end, 'yyyy-MM-dd'),
      multiDay: event.start.toDateString() !== event.end.toDateString(),
      description: event.resource?.description ?? '',
      location: event.resource?.location ?? '',
      eventType: event.resource?.eventType ?? 'other',
    })
    setIsModalOpen(true)
  }, [])

  const handleDrillDown = useCallback((date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for comparison

    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0) // Set to start of day for comparison

    // Prevent creating events on past dates
    if (selectedDate < today) {
      return
    }

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
      allDay: true, // Always true since we only use dates
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
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <>
                <input
                  ref={icsInputRef}
                  type="file"
                  accept=".ics"
                  className="hidden"
                  onChange={handleIcsImport}
                />
                <button
                  onClick={() => icsInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent"
                >
                  <Upload className="w-4 h-4" />
                  ICS importieren
                </button>
              </>
            )}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Termin erstellen
            </button>
          </div>
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
          <EventListOverview
            events={currentMonthEvents}
            currentDate={currentDate}
            onNavigatePrevious={() =>
              setCurrentDate((d) => new Date(getYear(d), getMonth(d) - 1, 1))
            }
            onNavigateToday={() => setCurrentDate(new Date())}
            onNavigateNext={() => setCurrentDate((d) => new Date(getYear(d), getMonth(d) + 1, 1))}
            enableModal={true}
            currentUserId={user?.id}
            isAdmin={user?.role === 'admin'}
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (() => {
        const canEdit =
          !selectedEvent ||
          user?.role === 'admin' ||
          selectedEvent.resource?.createdById === user?.id
        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold">
                    {selectedEvent ? (canEdit ? 'Termin bearbeiten' : 'Termin') : 'Neuer Termin'}
                  </h2>
                  {selectedEvent?.resource?.createdByName && (
                    <span className="text-xs text-muted-foreground mt-1">
                      von {selectedEvent.resource.createdByName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Titel *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-muted disabled:cursor-not-allowed"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Typ</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => updateForm({ eventType: e.target.value as EventType })}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-muted disabled:cursor-not-allowed"
                  >
                    <option value="wg-meeting">WG-Treffen</option>
                    <option value="party">Party</option>
                    <option value="cleaning">Reinigung</option>
                    <option value="waste-collection">Abfallentsorgung</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="multiDay"
                    checked={formData.multiDay}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const isMultiDay = e.target.checked
                      updateForm({ multiDay: isMultiDay })
                      if (!isMultiDay && formData.startDate) {
                        updateForm({ endDate: formData.startDate })
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor="multiDay" className="text-sm">
                    Mehrtägig
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      min={new Date().toISOString().slice(0, 10)}
                      disabled={!canEdit}
                      onChange={(e) => {
                        updateForm({ startDate: e.target.value })
                        if (!formData.multiDay) {
                          updateForm({ endDate: e.target.value })
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md disabled:bg-muted disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Ende {formData.multiDay ? '*' : ''}
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={(e) => updateForm({ endDate: e.target.value })}
                      disabled={!formData.multiDay || !canEdit}
                      className={`w-full px-3 py-2 border rounded-md ${
                        !formData.multiDay || !canEdit ? 'bg-muted cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>
                {formData.multiDay && new Date(formData.endDate) < new Date(formData.startDate) && (
                  <div className="text-sm text-destructive">
                    Das Enddatum muss nach dem Startdatum liegen
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Ort</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateForm({ location: e.target.value })}
                    disabled={!canEdit}
                    placeholder="z.B. Wohnzimmer"
                    className="w-full px-3 py-2 border rounded-md disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    disabled={!canEdit}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>

                {selectedEvent && !canEdit && (
                  <p className="text-xs text-muted-foreground">
                    Nur der Ersteller kann diesen Termin bearbeiten.
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  {canEdit && (
                    <button
                      onClick={handleSave}
                      disabled={
                        !formData.title ||
                        !formData.startDate ||
                        (formData.multiDay &&
                          (!formData.endDate ||
                            new Date(formData.endDate) < new Date(formData.startDate)))
                      }
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {selectedEvent ? 'Speichern' : 'Erstellen'}
                    </button>
                  )}
                  {selectedEvent && canEdit && (
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
                    {selectedEvent && !canEdit ? 'Schließen' : 'Abbrechen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
