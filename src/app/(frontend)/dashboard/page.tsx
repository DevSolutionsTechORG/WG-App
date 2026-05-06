import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Calendar,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Users,
  Clock,
  Home,
} from 'lucide-react'

import { getDashboardData, getDashboardStats } from '@/lib/dashboard/actions'

export default async function DashboardPage() {
  const dashboardResult = await getDashboardData()
  const statsResult = await getDashboardStats()

  if (
    !dashboardResult.success ||
    !statsResult.success ||
    !dashboardResult.data ||
    !statsResult.stats
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Fehler beim Laden des Dashboards</p>
      </div>
    )
  }

  const data = dashboardResult.data
  const stats = statsResult.stats

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-foreground">WG-App Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {data.currentUser.name || data.currentUser.email}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  data.currentUser.role === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {data.currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offene Einkäufe</p>
                <p className="text-2xl font-bold text-foreground">{stats.openShoppingItems}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meine Aufgaben</p>
                <p className="text-2xl font-bold text-foreground">{stats.myTasksThisWeek}</p>
              </div>
              <Home className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Events diesen Monat</p>
                <p className="text-2xl font-bold text-foreground">{stats.eventsThisMonth}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">WG-Mitglieder</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* My Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Meine Aufgaben diese Woche
            </h2>
            {data.myTasks.length > 0 ? (
              <div className="space-y-3">
                {data.myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{(task.template as any)?.title}</p>
                      {task.dueDate && (
                        <p className="text-sm text-muted-foreground">
                          Fällig: {format(new Date(task.dueDate), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      )}
                    </div>
                    <Link href="/cleaning" className="text-sm text-primary hover:underline">
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Keine offenen Aufgaben diese Woche</p>
            )}
          </div>

          {/* Overdue Tasks */}
          {data.overdueTasks.length > 0 && (
            <div className="bg-card rounded-lg shadow border p-6 border-red-200">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Überfällige Aufgaben
              </h2>
              <div className="space-y-3">
                {data.overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{(task.template as any)?.title}</p>
                      <p className="text-sm text-red-600">
                        Fällig:{' '}
                        {task.dueDate
                          ? format(new Date(task.dueDate), 'dd.MM.yyyy', { locale: de })
                          : 'Kein Datum'}
                      </p>
                    </div>
                    <Link href="/cleaning" className="text-sm text-primary hover:underline">
                      Erledigen
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/cleaning" className="block">
            <div className="p-6 bg-card rounded-lg shadow border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <Home className="w-8 h-8 text-green-500" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Putzplan</h2>
                  <p className="text-muted-foreground">Deine wöchentlichen Aufgaben</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/shopping" className="block">
            <div className="p-6 bg-card rounded-lg shadow border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-blue-500" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Einkaufsliste</h2>
                  <p className="text-muted-foreground">Gemeinsame Einkaufsliste</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/calendar" className="block">
            <div className="p-6 bg-card rounded-lg shadow border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Kalender</h2>
                  <p className="text-muted-foreground">WG-Termine & Events</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming Events */}
        {data.upcomingEvents.length > 0 && (
          <div className="bg-card rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Kommende Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground">{event.title}</h3>
                    {event.location && (
                      <span className="text-sm text-muted-foreground">{event.location}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
