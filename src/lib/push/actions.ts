'use server'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { pushSubscriptionSchema } from '@/lib/schemas'
import { sendPush } from '@/lib/push/send'

async function currentUser() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  return { payload, user }
}

/** Speichert das Push-Abo dieses Geräts für den eingeloggten Nutzer. */
export async function subscribePush(input: unknown) {
  const parsed = pushSubscriptionSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Ungültiges Push-Abo' }

  try {
    const { payload, user } = await currentUser()
    if (!user) return { success: false, message: 'Not authenticated' }

    const { endpoint, keys } = parsed.data
    const data = { user: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }

    // Ein Gerät = ein Endpoint: bei Nutzerwechsel am selben Gerät umhängen statt duplizieren.
    const existing = await payload.find({
      collection: 'push-subscriptions',
      where: { endpoint: { equals: endpoint } },
      depth: 0,
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'push-subscriptions', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'push-subscriptions', data })
    }
    return { success: true, message: 'Benachrichtigungen aktiviert' }
  } catch (error) {
    console.error('Subscribe push error:', error)
    return { success: false, message: 'Fehler beim Aktivieren' }
  }
}

/** Entfernt das Abo dieses Geräts (nur das eigene). */
export async function unsubscribePush(endpoint: unknown) {
  if (typeof endpoint !== 'string') return { success: false, message: 'Ungültige Eingabe' }

  try {
    const { payload, user } = await currentUser()
    if (!user) return { success: false, message: 'Not authenticated' }

    await payload.delete({
      collection: 'push-subscriptions',
      where: { and: [{ endpoint: { equals: endpoint } }, { user: { equals: user.id } }] },
    })
    return { success: true, message: 'Benachrichtigungen deaktiviert' }
  } catch (error) {
    console.error('Unsubscribe push error:', error)
    return { success: false, message: 'Fehler beim Deaktivieren' }
  }
}

/** Test-Benachrichtigung an die eigenen Geräte. */
export async function sendTestPush() {
  try {
    const { payload, user } = await currentUser()
    if (!user) return { success: false, message: 'Not authenticated' }

    const devices = await sendPush(payload, [user.id], {
      title: 'WG-App',
      body: 'Test: Benachrichtigungen funktionieren.',
      url: '/dashboard',
      tag: 'test',
    })
    return devices > 0
      ? { success: true, message: `Test an ${devices} Gerät(e) gesendet` }
      : { success: false, message: 'Kein Gerät erreicht' }
  } catch (error) {
    console.error('Test push error:', error)
    return { success: false, message: 'Fehler beim Senden' }
  }
}
