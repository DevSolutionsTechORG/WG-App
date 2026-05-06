'use server'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

/**
 * Request password reset
 * Admin-only: Sends reset email to user
 */
export async function requestPasswordReset(email: string) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    await payload.forgotPassword({
      collection: 'users',
      data: { email },
      overrideAccess: true,
    })

    return { success: true, message: 'Password reset email sent' }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, message: 'Failed to send reset email' }
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, password: string) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    })

    return { success: true, user: result.user }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, message: 'Invalid or expired token' }
  }
}

/**
 * Create user (Admin only)
 * No public signup allowed - requires admin authentication
 */
export async function createUserByAdmin(data: {
  email: string
  password: string
  name: string
  role?: 'member' | 'admin'
}) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Verify admin is authenticated
    const { user: adminUser } = await payload.auth({ headers })

    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required' }
    }

    const user = await payload.create({
      collection: 'users',
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || 'member',
      },
      overrideAccess: true,
    })

    return { success: true, user }
  } catch (error) {
    console.error('Create user error:', error)
    return { success: false, message: 'Failed to create user' }
  }
}
