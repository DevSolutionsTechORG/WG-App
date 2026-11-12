import { AlertTriangle, CheckCircle2, Circle, User } from 'lucide-react'
import {
  getCompletedFreeTaskHistory,
  getFreeTaskOptionLists,
  getOverdueAssignments,
  getRestrictedTaskCards,
  getWeeklyAssignments,
} from '@/lib/cleaning/actions'
import { isRestricted } from '@/lib/cleaning/rotation'

import { CompleteTaskButton } from '@/components/cleaning/CompleteTaskButton'
import { CompletedFreeTasksSection } from '@/components/cleaning/CompletedFreeTasksSection'
import { DeleteOverdueButton } from '@/components/cleaning/DeleteOverdueButton'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function CleaningPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  const {
    assignments: allAssignments,
    currentWeek,
    currentYear,
    totalUsers,
  } = await getWeeklyAssignments()
  const { overdueAssignments: allOverdue = [] } = await getOverdueAssignments()
  const { cards } = await getRestrictedTaskCards()

  // Aufgaben mit fester Nutzerliste laufen ausschließlich über ihre eigene Karte.
  const assignments = allAssignments.filter(({ template }) => !isRestricted(template))
  const overdueAssignments = allOverdue.filter(({ template }) => !isRestricted(template))
  const totalOverdue = overdueAssignments.length
  const { history: freeTaskHistory } = await getCompletedFreeTaskHistory()
  const { lists: freeTaskLists } = await getFreeTaskOptionLists()
  const optionsFor = (templateId: string) =>
    freeTaskLists.find((list) => list.templateId === templateId)?.options ?? []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Putzplan</h1>
          <div className="text-sm text-muted-foreground">
            KW {currentWeek} / {currentYear}
          </div>
        </div>

        {user.role === 'admin' && allOverdue.length > 0 && (
          <div className="flex justify-end mb-4">
            <DeleteOverdueButton count={allOverdue.length} />
          </div>
        )}

        {/* Permanente Karten (z.B. Badezimmer): blau = du bist dran, rot = überfällig */}
        {cards.length > 0 && (
          <div className="space-y-4 mb-8">
            {cards.map(({ template, current, overdue, next }) => {
              const currentOpen = current && !current.isCompleted ? current : undefined
              const tone = overdue
                ? 'bg-red-50 border-red-200'
                : currentOpen?.isMine
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-card'
              const mine = [overdue, currentOpen].filter((a) => a?.isMine)

              return (
                <div
                  key={template.id}
                  className={`${tone} rounded-lg shadow border p-4 flex items-start justify-between gap-4`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {overdue ? (
                      <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
                    ) : current?.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle
                        className={`w-6 h-6 mt-0.5 shrink-0 ${currentOpen?.isMine ? 'text-blue-500' : 'text-muted-foreground'}`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{template.title}</h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      )}
                      {overdue && (
                        <p className="text-sm text-red-600 mt-2 font-medium">
                          Überfällig seit KW {overdue.weekNumber}/{overdue.year}:{' '}
                          {overdue.isMine ? 'du' : overdue.assignedUser?.name}
                        </p>
                      )}
                      {currentOpen && (
                        <p
                          className={`text-sm mt-2 font-medium ${currentOpen.isMine ? 'text-blue-700' : 'text-muted-foreground'}`}
                        >
                          {currentOpen.isMine
                            ? `Diese Woche (KW ${currentOpen.weekNumber}) bist du dran`
                            : `Diese Woche (KW ${currentOpen.weekNumber}): ${currentOpen.assignedUser?.name}`}
                        </p>
                      )}
                      {current?.isCompleted && (
                        <p className="text-sm text-green-600 mt-2">
                          KW {current.weekNumber} erledigt
                        </p>
                      )}
                      {!currentOpen && next && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <User className="w-4 h-4 shrink-0" />
                          Nächster Termin: KW {next.weekNumber} –{' '}
                          {next.user ? (next.user.id === user.id ? 'du' : next.user.name) : '—'}
                        </p>
                      )}
                    </div>
                  </div>

                  {mine.map((a) => (
                    <CompleteTaskButton key={a!.id} assignmentId={a!.id} />
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* Overdue Assignments Section */}
        {(totalOverdue ?? 0) > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-600">
                Überfällige Aufgaben ({totalOverdue})
              </h2>
            </div>
            <div className="space-y-4">
              {overdueAssignments?.map(
                ({
                  assignment,
                  template,
                  assignedUser,
                  weekNumber,
                  year,
                  isAssignedToCurrentUser,
                }) => (
                  <div
                    key={assignment.id}
                    className="bg-red-50 border-red-200 rounded-lg shadow border p-4 flex items-start justify-between"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <Circle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-red-900">{template.title}</h3>
                        {template.description && (
                          <p className="text-sm text-red-700 mt-1">{template.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <User className="w-4 h-4 shrink-0" />
                          <span>Zugewiesen: {assignedUser?.name || assignedUser?.email}</span>
                        </div>
                        <p className="text-sm text-red-500 mt-1 font-medium">
                          Überfällig seit KW {weekNumber}/{year}
                        </p>
                      </div>
                    </div>

                    {isAssignedToCurrentUser && (
                      <CompleteTaskButton
                        assignmentId={assignment.id}
                        isCustom={!!template.isCustom}
                        options={optionsFor(template.id)}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {totalUsers === 0 ? (
          <div className="bg-card rounded-lg shadow border p-6">
            <p className="text-muted-foreground">
              Noch keine Mitglieder vorhanden. Admin muss Benutzer im Panel anlegen.
            </p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-card rounded-lg shadow border p-6">
            <p className="text-muted-foreground">
              Noch keine Putzaufgaben vorhanden. Admin muss Tasks im Panel anlegen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(
              ({
                assignment,
                template,
                assignedUser,
                isCompleted,
                completedBy,
                historyNotes,
                selectedOption,
                isAssignedToCurrentUser,
              }) => (
                <div
                  key={assignment.id}
                  className={`bg-card rounded-lg shadow border p-4 flex items-start justify-between ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                        {template.title}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span>Zugewiesen: {assignedUser?.name || assignedUser?.email}</span>
                      </div>
                      {isCompleted && completedBy && (
                        <p className="text-sm text-green-600 mt-1">
                          Erledigt von {completedBy.name || completedBy.email}
                          {(selectedOption || historyNotes) &&
                            `: "${selectedOption || historyNotes}"`}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isCompleted && isAssignedToCurrentUser && (
                    <CompleteTaskButton
                      assignmentId={assignment.id}
                      isCustom={!!template.isCustom}
                      options={optionsFor(template.id)}
                    />
                  )}
                </div>
              ),
            )}
          </div>
        )}

        {/* Legende: für alle einsehbar, nicht nur für wen die Freie Aufgabe gerade dran ist */}
        {freeTaskLists
          .filter((list) => list.options.length > 0)
          .map((list) => (
            <details key={list.templateId} className="mt-8 bg-card rounded-lg shadow border p-4">
              <summary className="cursor-pointer font-medium text-foreground">
                Was zählt als „{list.templateTitle}“? ({list.options.length} Optionen)
              </summary>
              <ul className="mt-3 space-y-3">
                {list.options.map((option) => (
                  <li key={option.id} className="text-sm">
                    <span className="font-medium text-foreground">{option.title}</span>
                    {option.lastDoneAt && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        kürzlich erledigt
                      </span>
                    )}
                    {option.description && (
                      <span className="block text-muted-foreground">{option.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}

        <CompletedFreeTasksSection tasks={freeTaskHistory ?? []} />
      </div>
    </div>
  )
}
