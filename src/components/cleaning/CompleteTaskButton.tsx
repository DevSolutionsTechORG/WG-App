'use client'

import { AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { completeTask } from '@/lib/cleaning/actions'
import { useState } from 'react'

export interface CleaningTaskOption {
  id: string
  title: string
  description?: string | null
  lastDoneAt: string | null
}

interface CompleteTaskButtonProps {
  assignmentId: string
  isCustom?: boolean
  options?: CleaningTaskOption[]
  onComplete?: () => void
}

function ago(dateString: string): string {
  const days = Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 86400000))
  return days === 0 ? 'heute' : days === 1 ? 'gestern' : `vor ${days} Tagen`
}

export function CompleteTaskButton({
  assignmentId,
  isCustom,
  options = [],
  onComplete,
}: CompleteTaskButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [selected, setSelected] = useState<CleaningTaskOption | null>(null)

  const handleComplete = async () => {
    setIsPending(true)
    try {
      const result = await completeTask(assignmentId, undefined, selected?.title)
      if (result.success) {
        onComplete?.()
        window.location.reload()
      } else {
        alert(result.message)
      }
    } catch {
      alert('Fehler beim Abschließen der Aufgabe')
    } finally {
      setIsPending(false)
    }
  }

  if (isCustom && showPicker) {
    return (
      <div className="space-y-2 w-full max-w-sm">
        <button
          type="button"
          onClick={() => setListOpen((prev) => !prev)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {listOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {selected ? 'Ändern' : 'Liste anzeigen'}
        </button>

        {selected && !listOpen && (
          <p className="text-sm font-medium text-foreground">{selected.title}</p>
        )}

        {listOpen &&
          (options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Optionen hinterlegt — Admin pflegt sie im Template „Freie Aufgabe“.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1 border rounded-md p-2">
              {options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer text-sm"
                >
                  <input
                    type="radio"
                    name="freeTaskOption"
                    className="mt-1"
                    checked={selected?.id === option.id}
                    onChange={() => {
                      setSelected(option)
                      setListOpen(false)
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{option.title}</span>
                    {option.description && (
                      <span className="block text-muted-foreground">{option.description}</span>
                    )}
                    {option.lastDoneAt && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        zuletzt {ago(option.lastDoneAt)}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          ))}

        {selected?.lastDoneAt && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Diese Aufgabe wurde {ago(selected.lastDoneAt)} schon erledigt. Trotzdem eintragen?
              Wird in der Historie als Wiederholung vermerkt.
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleComplete}
            disabled={isPending || !selected}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <Check className="w-4 h-4" />
            {isPending ? '...' : 'Speichern'}
          </button>
          <button
            onClick={() => {
              setShowPicker(false)
              setSelected(null)
              setListOpen(false)
            }}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={isCustom ? () => setShowPicker(true) : handleComplete}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Check className="w-4 h-4" />
      {isPending ? 'Wird erledigt...' : 'Erledigt'}
    </button>
  )
}
