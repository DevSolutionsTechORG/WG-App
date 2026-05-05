import './styles.css'

import { Navigation } from '@/components/navigation'
import React from 'react'

export const metadata = {
  description: 'WG-App - Haushaltsmanagement für deine Wohngemeinschaft',
  title: 'WG-App',
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
