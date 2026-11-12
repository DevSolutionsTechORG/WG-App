'use client'

import { LogOut } from 'lucide-react'
import { unsubscribePush } from '@/lib/push/actions'
import { useState } from 'react'

export function LogoutButton() {
  const [busy, setBusy] = useState(false)

  const logout = async () => {
    setBusy(true)
    try {
      // Push-Abo dieses Geräts entfernen, sonst bekäme es weiter Erinnerungen des alten Nutzers.
      const registration = await navigator.serviceWorker?.getRegistration()
      const subscription = await registration?.pushManager?.getSubscription()
      if (subscription) {
        await unsubscribePush(subscription.endpoint)
        await subscription.unsubscribe()
      }
    } catch {
      // Abmelden darf daran nicht scheitern.
    }
    await fetch('/api/users/logout', { method: 'POST' }).catch(() => {})
    window.location.replace('/login')
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      aria-label="Abmelden"
      title="Abmelden"
      className="p-2 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
    >
      <LogOut className="w-5 h-5" />
    </button>
  )
}
