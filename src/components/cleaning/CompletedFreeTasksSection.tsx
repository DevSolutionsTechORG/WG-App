'use client'

import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { EnrichedFreeTask } from '@/lib/cleaning/actions'
import { useState } from 'react'

const DEFAULT_VISIBLE = 2

interface Props {
  tasks: EnrichedFreeTask[]
}

export function CompletedFreeTasksSection({ tasks }: Props) {
  const [showAll, setShowAll] = useState(false)

  if (tasks.length === 0) return null

  const visibleTasks = showAll ? tasks : tasks.slice(0, DEFAULT_VISIBLE)
  const hasMore = tasks.length > DEFAULT_VISIBLE

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <h2 className="text-lg font-semibold text-foreground">Freie Aufgaben (erledigt)</h2>
      </div>

      <div className="space-y-4">
        {visibleTasks.map((task) => (
          <div key={task.id} className="bg-card rounded-lg shadow border p-4 opacity-80">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">
                  {task.template.title} – KW {task.weekNumber} – {task.year}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {task.completedBy.name || task.completedBy.email}
                  {task.notes && (
                    <span className="text-foreground"> – &ldquo;{task.notes}&rdquo;</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Zeige erledigt ({tasks.length - DEFAULT_VISIBLE} weitere)
            </>
          )}
        </button>
      )}
    </div>
  )
}
