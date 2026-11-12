import type { Payload } from 'payload'
import { sendNotification, WebPushError } from 'web-push'

/**
 * Bewusst KEIN 'use server': nimmt eine Payload-Instanz entgegen und darf nie
 * als Server Action vom Client aufrufbar sein.
 */

export interface PushMessage {
  title: string
  body: string
  /** Seite, die beim Antippen geöffnet wird. */
  url?: string
  /** Gleicher Tag ersetzt eine ältere Benachrichtigung statt sie zu stapeln. */
  tag?: string
}

/** Push ist nur aktiv, wenn alle drei VAPID-Variablen gesetzt sind. */
function vapidDetails() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return null
  return { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY, subject: VAPID_SUBJECT }
}

export const pushEnabled = () => vapidDetails() !== null

/** Sendet an alle Geräte der genannten Nutzer (oder aller). Liefert die Zahl erreichter Geräte. */
export async function sendPush(
  payload: Payload,
  userIds: string[] | 'all',
  message: PushMessage,
): Promise<number> {
  const vapid = vapidDetails()
  if (!vapid) return 0

  const { docs } = await payload.find({
    collection: 'push-subscriptions',
    where: userIds === 'all' ? {} : { user: { in: userIds } },
    depth: 0,
    limit: 500,
  })

  const delivered = await Promise.all(
    docs.map(async (sub) => {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(message),
          { vapidDetails: vapid, TTL: 12 * 60 * 60 },
        )
        return true
      } catch (error) {
        const status = error instanceof WebPushError ? error.statusCode : undefined
        if (status === 404 || status === 410) {
          // Abo existiert nicht mehr (App entfernt oder Berechtigung entzogen).
          await payload.delete({ collection: 'push-subscriptions', id: sub.id })
        } else {
          console.error('Push fehlgeschlagen:', status ?? error)
        }
        return false
      }
    }),
  )

  return delivered.filter(Boolean).length
}
