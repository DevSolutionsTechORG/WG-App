import { CalendarClient } from './CalendarClient'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function CalendarPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  return <CalendarClient user={{ id: user.id, role: user.role }} />
}
