import './styles.css'

import type { Metadata, Viewport } from 'next'

import { Navigation } from '@/components/navigation'
import React from 'react'

export const metadata: Metadata = {
  title: 'WG-App',
  description: 'Haushaltsmanagement für deine Wohngemeinschaft',
  applicationName: 'WG-App',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WG-App',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="de">
      <body className="bg-background text-foreground">
        <div className="pb-16 md:pb-0">
          <Navigation />
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
