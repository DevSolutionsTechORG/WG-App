'use client'

import { MapPin, Plus, Trash2 } from 'lucide-react'
import { createEvent, deleteEvent, updateEvent } from '@/lib/calendar/actions'
import { format, isSameMonth } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'
import { de } from 'date-fns/locale/de'

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

interface EventListOverviewProps {
  events: CalendarEvent[]
  currentDate: Date
  showNavigation?: boolean
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
  onNavigateToday?: () => void
  title?: string
  titleAsLink?: boolean
  onEventClick?: (event: CalendarEvent) => void
  enableModal?: boolean
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
  endDate: format(end, 'yyyy-MM-dd'),
  multiDay: false,
  description: '',
  location: '',
  eventType: 'other',
})

export function EventListOverview({
  events,
  currentDate,
  showNavigation = true,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
  title,
  titleAsLink = false,
  onEventClick,
  enableModal = false,
}: EventListOverviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState<FormData>(() => {
    const now = new Date()
    return makeDefaultForm(now, new Date(now.getTime() + 60 * 60 * 1000))
  })

  // Nur Events des aktuellen Monats, chronologisch sortiert
  const currentMonthEvents = events
    .filter((e) => isSameMonth(e.start, currentDate))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const updateForm = useCallback(
    (patch: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...patch })),
    [],
  )

  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      if (onEventClick) {
        onEventClick(event)
      } else if (enableModal) {
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
      } else {
        // Navigate to calendar when clicking on event
        window.location.href = '/calendar'
      }
    },
    [onEventClick, enableModal],
  )

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) return

    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, {
          title: formData.title,
          startDate: formData.startDate,
          endDate: formData.endDate,
          allDay: true, // Always true since we only use dates
          description: formData.description,
          location: formData.location,
          eventType: formData.eventType,
        })
      } else {
        await createEvent({
          title: formData.title,
          startDate: formData.startDate,
          endDate: formData.endDate,
          allDay: true, // Always true since we only use dates
          description: formData.description,
          location: formData.location,
          eventType: formData.eventType,
        })
      }
      closeModal()
      // Reload events by triggering parent refresh
      window.location.reload()
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }, [formData, selectedEvent])

  const handleDelete = useCallback(async () => {
    if (!selectedEvent) return

    try {
      await deleteEvent(selectedEvent.id)
      closeModal()
      // Reload events by triggering parent refresh
      window.location.reload()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }, [selectedEvent])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        {titleAsLink ? (
          <Link
            href="/calendar"
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {title || `Termine im ${format(currentDate, 'MMMM yyyy', { locale: de })}`}
          </Link>
        ) : (
          <h2 className="text-lg font-semibold text-foreground">
            {title || `Termine im ${format(currentDate, 'MMMM yyyy', { locale: de })}`}
          </h2>
        )}
        {showNavigation && (
          <div className="flex items-center gap-1">
            {onNavigatePrevious && (
              <button
                onClick={onNavigatePrevious}
                className="p-1.5 rounded hover:bg-muted"
                aria-label="Vorheriger Monat"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
            {onNavigateToday && (
              <button
                onClick={onNavigateToday}
                className="px-2 py-1 text-xs rounded hover:bg-muted text-muted-foreground"
              >
                Heute
              </button>
            )}
            {onNavigateNext && (
              <button
                onClick={onNavigateNext}
                className="p-1.5 rounded hover:bg-muted"
                aria-label="Nächster Monat"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
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
                onClick={() => handleEventClick(event)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                {/* Farbstreifen */}
                <div
                  className="mt-0.5 w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{event.title}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: `${color}20`,
                        color,
                      }}
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

      {/* Modal */}
      {enableModal && isModalOpen && (
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

              <div>
                <label className="block text-sm font-medium mb-1">Start *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    updateForm({ startDate: e.target.value })
                    // If not multi-day, update end date to match start date
                    if (!formData.multiDay) {
                      updateForm({ endDate: e.target.value })
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md"
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
                  disabled={!formData.multiDay}
                  className={`w-full px-3 py-2 border rounded-md ${
                    !formData.multiDay ? 'bg-muted cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multiDay"
                  checked={formData.multiDay}
                  onChange={(e) => {
                    const isMultiDay = e.target.checked
                    updateForm({ multiDay: isMultiDay })
                    // If not multi-day, set end date to start date
                    if (!isMultiDay && formData.startDate) {
                      updateForm({ endDate: formData.startDate })
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor="multiDay" className="text-sm font-medium">
                  Mehrtägig
                </label>
              </div>
              {formData.multiDay && new Date(formData.endDate) < new Date(formData.startDate) && (
                <div className="text-sm text-destructive">
                  Das Enddatum muss nach dem Startdatum liegen
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateForm({ location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
                  >
                    Abbrechen
                  </button>
                  {selectedEvent && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                    >
                      Löschen
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={
                    !formData.title ||
                    !formData.startDate ||
                    (formData.multiDay &&
                      (!formData.endDate ||
                        new Date(formData.endDate) < new Date(formData.startDate)))
                  }
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {selectedEvent ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
