import Link from 'next/link'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-foreground">WG-App Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  user.role === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 p-6 bg-card rounded-lg shadow border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Meine Aufgabe diese Woche</h2>
          <p className="text-muted-foreground">
            Hier wird später die aktuelle Putzplan-Aufgabe angezeigt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/cleaning" className="block">
            <div className="p-6 bg-card rounded-lg shadow border hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-2">Putzplan</h2>
              <p className="text-muted-foreground">Deine wöchentlichen Aufgaben</p>
            </div>
          </Link>

          <Link href="/shopping" className="block">
            <div className="p-6 bg-card rounded-lg shadow border hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-2">Einkaufsliste</h2>
              <p className="text-muted-foreground">Gemeinsame Einkaufsliste</p>
            </div>
          </Link>

          <Link href="/calendar" className="block">
            <div className="p-6 bg-card rounded-lg shadow border hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-2">Kalender</h2>
              <p className="text-muted-foreground">WG-Termine & Events</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
