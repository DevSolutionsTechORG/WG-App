'use client'

import { endOfWeek, format, getWeek, startOfWeek } from 'date-fns'
import { getDashboardData, getDashboardStats } from '@/lib/dashboard/actions'
import { useEffect, useState } from 'react'

import { EventListOverview } from '@/components/EventListOverview'
import Link from 'next/link'
import type { ShoppingItem } from '@/payload-types'
import { de } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

// Helper function to get week range
const getWeekRange = (date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }) // Sunday
  return `${format(weekStart, 'dd.MM.yyyy', { locale: de })} - ${format(weekEnd, 'dd.MM.yyyy', { locale: de })}`
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isLoading, isAuthenticated, router])

  const loadDashboardData = async () => {
    try {
      const [dataResult, statsResult] = await Promise.all([getDashboardData(), getDashboardStats()])

      setDashboardData(
        dataResult.success
          ? dataResult.data
          : { upcomingEvents: [], openShoppingItems: [], myTasks: [] },
      )
      setDashboardStats(
        statsResult.success
          ? statsResult.stats
          : { openShoppingItems: 0, myTasksThisWeek: 0, eventsThisMonth: 0, totalUsers: 0 },
      )
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Lade Dashboard...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  const data = dashboardData
  const stats = dashboardStats

  if (!data || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Fehler beim Laden des Dashboards</p>
      </div>
    )
  }

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
        {/* User Tasks Section */}
        <div className="bg-card rounded-lg shadow border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Meine Aufgaben</h2>
          {data.myTasks.length > 0 ? (
            <div className="space-y-3">
              {data.myTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-foreground">
                        {(task.template as any)?.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status === 'completed'
                          ? 'Erledigt'
                          : task.status === 'pending'
                            ? 'Offen'
                            : 'Übersprungen'}
                      </span>
                    </div>
                    {task.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Fällig KW {getWeek(new Date(task.dueDate))}:{' '}
                        {getWeekRange(new Date(task.dueDate))}
                      </p>
                    )}
                  </div>
                  <Link href="/cleaning" className="text-sm text-primary hover:underline ml-4">
                    Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Keine Aufgaben zugeteilt</p>
          )}
        </div>

        {/* Shopping Preview Section */}
        <div className="bg-card rounded-lg shadow border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Einkaufsliste Vorschau</h2>
            <Link href="/shopping" className="text-sm text-primary hover:underline">
              Alle anzeigen
            </Link>
          </div>
          {data.openShoppingItems.length > 0 ? (
            <div className="space-y-2">
              {data.openShoppingItems.slice(0, 3).map((item: ShoppingItem) => (
                <Link
                  key={item.id}
                  href="/shopping"
                  className="block p-3 bg-muted rounded-lg border hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : item.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.priority === 'high'
                            ? 'Hoch'
                            : item.priority === 'medium'
                              ? 'Mittel'
                              : 'Niedrig'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.category === 'food'
                            ? 'Lebensmittel'
                            : item.category === 'cleaning'
                              ? 'Reinigung'
                              : 'Sonstiges'}
                        </span>
                        {item.quantity && item.unit && (
                          <span className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(item.requestedBy as any)?.name || 'Unbekannt'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Keine offenen Einkaufsartikel</p>
          )}
        </div>

        {/* Events Overview */}
        <div className="bg-card rounded-lg shadow border p-6">
          <EventListOverview
            events={data.upcomingEvents.map((event: any) => ({
              id: event.id,
              title: event.title,
              start: new Date(event.startDate),
              end: new Date(event.endDate || event.startDate),
              allDay: event.allDay || false,
              resource: {
                description: event.description || undefined,
                location: event.location || undefined,
                eventType: (event.eventType as any) || 'other',
                createdById:
                  typeof event.createdBy === 'string' ? event.createdBy : event.createdBy?.id,
                createdByName:
                  typeof event.createdBy === 'string' ? '' : (event.createdBy?.name ?? ''),
              },
            }))}
            currentDate={new Date()}
            title="Nächste 2 Wochen"
            showNavigation={false}
            titleAsLink={true}
            filterByMonth={false}
            currentUserId={data.currentUser.id}
            isAdmin={data.currentUser.role === 'admin'}
            enableModal={true}
          />
        </div>
      </main>
    </div>
  )
}
