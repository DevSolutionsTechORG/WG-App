'use client'

import { Bell, BellOff } from 'lucide-react'
import { sendTestPush, subscribePush, unsubscribePush } from '@/lib/push/actions'
import { useEffect, useState } from 'react'

/**
 * Glocke: Push-Benachrichtigungen für dieses Gerät an/aus.
 * Unsichtbar, wenn der Server keine VAPID-Keys hat oder der Browser kein Push kann
 * (iOS: nur in der zum Home-Bildschirm hinzugefügten App).
 */
export function PushToggle({ vapidPublicKey }: { vapidPublicKey?: string }) {
  const [state, setState] = useState<'unsupported' | 'off' | 'on'>('unsupported')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!vapidPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? 'on' : 'off'))
      .catch(() => {})
  }, [vapidPublicKey])

  if (state === 'unsupported') return null

  const toggle = async () => {
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()

      if (existing) {
        await unsubscribePush(existing.endpoint)
        await existing.unsubscribe()
        setState('off')
        return
      }

      if ((await Notification.requestPermission()) !== 'granted') {
        alert('Benachrichtigungen sind für diese App blockiert. Bitte in den Geräte-Einstellungen erlauben.')
        return
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })
      const result = await subscribePush(subscription.toJSON())
      if (!result.success) {
        await subscription.unsubscribe()
        alert(result.message)
        return
      }
      setState('on')
      await sendTestPush()
    } catch {
      alert('Benachrichtigungen konnten nicht umgeschaltet werden.')
    } finally {
      setBusy(false)
    }
  }

  const Icon = state === 'on' ? Bell : BellOff
  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={state === 'on'}
      aria-label={state === 'on' ? 'Benachrichtigungen ausschalten' : 'Benachrichtigungen einschalten'}
      title={state === 'on' ? 'Benachrichtigungen an' : 'Benachrichtigungen aus'}
      className={`p-2 rounded-md hover:bg-muted disabled:opacity-50 ${state === 'on' ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}
