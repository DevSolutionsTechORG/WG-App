'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

const SESSION_COOKIE = 'payload-token'
const REFRESH_COOKIE = 'payload-refresh-token'

/**
 * Get current session info
 * Returns user if authenticated, null otherwise
 */
export async function getSession() {
  try {
    const headers = new Headers()
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)
    
    if (token) {
      headers.set('cookie', `${SESSION_COOKIE}=${token.value}`)
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers })

    return { user, isAuthenticated: !!user }
  } catch {
    return { user: null, isAuthenticated: false }
  }
}

/**
 * Refresh session if needed
 * Payload handles refresh automatically via cookies
 */
export async function refreshSession() {
  // Payload's built-in auth automatically refreshes tokens
  // This is a placeholder for explicit refresh logic if needed
  const session = await getSession()
  return session
}

/**
 * Clear session (logout)
 */
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}
