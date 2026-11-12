'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Lässt die PWA sich wie eine App verhalten: registriert den Service Worker
 * und verlängert bei jedem Öffnen/Zurückkehren die Session. Ist sie
 * abgelaufen, geht es direkt zum Login; sonst werden die Daten neu geladen.
 */
export function AppLifecycle() {
  const router = useRouter()
  const isLogin = usePathname() === '/login'

  useEffect(() => {
    navigator.serviceWorker?.register('/sw.js').catch(() => {})
  }, [])

  useEffect(() => {
    if (isLogin) return

    const sync = async (reloadData: boolean) => {
      try {
        const res = await fetch('/api/users/refresh-token', { method: 'POST' })
        if (res.status === 401 || res.status === 403) {
          window.location.replace('/login')
          return
        }
      } catch {
        return // offline: aktuellen Stand behalten
      }
      if (reloadData) router.refresh()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync(true)
    }
    // bfcache-Restore feuert kein visibilitychange
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void sync(true)
    }

    void sync(false)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [isLogin, router])

  return null
}
