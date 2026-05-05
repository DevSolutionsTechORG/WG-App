import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'

export default async function CalendarPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Kalender</h1>
        <div className="bg-card rounded-lg shadow border p-6">
          <p className="text-muted-foreground">
            Hier wird später der WG-Kalender mit Terminen angezeigt.
          </p>
        </div>
      </div>
    </div>
  )
}
