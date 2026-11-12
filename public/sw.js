// Handgeschriebener Service Worker: nur Push-Benachrichtigungen.
// Bewusst KEIN Caching, damit die App nie einen veralteten Stand zeigt.
// ponytail: kein Offline-Modus; bei Bedarf gezielt statische Assets cachen.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  // Räumt Caches früherer Service-Worker-Versionen weg.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'WG-App', {
      body: data.body,
      tag: data.tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/dashboard' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients[0]
      if (!client) return self.clients.openWindow(url)
      return client.navigate(url).then((navigated) => (navigated || client).focus())
    }),
  )
})
