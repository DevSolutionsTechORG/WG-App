'use client'

import { Check } from 'lucide-react'
import { completeTask } from '@/lib/cleaning/actions'
import { useState } from 'react'

interface CompleteTaskButtonProps {
  assignmentId: string
  isCustom?: boolean
  onComplete?: () => void
}

export function CompleteTaskButton({
  assignmentId,
  isCustom,
  onComplete,
}: CompleteTaskButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')

  const handleComplete = async () => {
    setIsPending(true)
    try {
      const result = await completeTask(assignmentId, notes)
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

  if (isCustom && showNotes) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Was hast du gemacht?"
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <Check className="w-4 h-4" />
            {isPending ? '...' : 'Speichern'}
          </button>
          <button
            onClick={() => setShowNotes(false)}
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
      onClick={isCustom ? () => setShowNotes(true) : handleComplete}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Check className="w-4 h-4" />
      {isPending ? 'Wird erledigt...' : 'Erledigt'}
    </button>
  )
}
