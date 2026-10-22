'use client'

import { Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'

// ponytail: localStorage statt User-Feld — Hinweis kommt auf neuem Gerät
// wieder. Users-Feld ergänzen, falls das stört.
const DISMISS_KEY = 'wg-app:hint:free-task-options'

export function FeatureHintCard() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="bg-card rounded-lg shadow border p-4 mb-8 flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
      <p className="flex-1 text-sm text-foreground">
        <span className="font-medium">Neu bei &bdquo;Freie Aufgabe&ldquo;:</span> Beim Abhaken
        wählst du jetzt aus einer Liste, was du erledigt hast — inklusive Beschreibung. War die
        Aufgabe in den letzten 2 Wochen schon dran, bekommst du einen Hinweis.
      </p>
      <button
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1')
          setVisible(false)
        }}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Hinweis schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
