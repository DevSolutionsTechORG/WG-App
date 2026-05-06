import { AlertTriangle, CheckCircle2, Circle, User } from 'lucide-react'
import { getOverdueAssignments, getWeeklyAssignments } from '@/lib/cleaning/actions'

import { CompleteTaskButton } from '@/components/cleaning/CompleteTaskButton'
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

  const { assignments, currentWeek, currentYear, totalUsers } = await getWeeklyAssignments()
  const { overdueAssignments, totalOverdue } = await getOverdueAssignments()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Putzplan</h1>
          <div className="text-sm text-muted-foreground">
            KW {currentWeek} / {currentYear}
          </div>
        </div>

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
                          {historyNotes && `: "${historyNotes}"`}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isCompleted && isAssignedToCurrentUser && (
                    <CompleteTaskButton
                      assignmentId={assignment.id}
                      isCustom={!!template.isCustom}
                    />
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
