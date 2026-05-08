'use server'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import {
  createUserSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '@/lib/schemas'

/**
 * Request password reset.
 * Public — anyone can request a reset for an existing email. Rate-limited via middleware.
 * Always returns generic success to avoid leaking which emails exist.
 */
export async function requestPasswordReset(email: unknown) {
  const parsed = requestPasswordResetSchema.safeParse({ email })
  if (!parsed.success) {
    return { success: true, message: 'Wenn die E-Mail existiert, wurde eine Reset-Mail gesendet.' }
  }

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    await payload.forgotPassword({
      collection: 'users',
      data: { email: parsed.data.email },
      // overrideAccess: required because Payload's forgotPassword by default
      // restricts to authenticated users; we want unauthenticated reset requests.
      overrideAccess: true,
    })
  } catch (error) {
    console.error('Password reset error:', error)
  }

  return { success: true, message: 'Wenn die E-Mail existiert, wurde eine Reset-Mail gesendet.' }
}

/**
 * Reset password with token. Public — token authenticates the request.
 */
export async function resetPassword(token: unknown, password: unknown) {
  const parsed = resetPasswordSchema.safeParse({ token, password })
  if (!parsed.success) {
    return { success: false, message: 'Ungültige Eingabe' }
  }

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.resetPassword({
      collection: 'users',
      data: { token: parsed.data.token, password: parsed.data.password },
      // overrideAccess: required because resetPassword default access is admin-only;
      // the cryptographic token itself authenticates the request.
      overrideAccess: true,
    })

    return { success: true, user: result.user }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, message: 'Invalid or expired token' }
  }
}

/**
 * Create user (Admin only).
 * No public signup allowed - requires admin authentication.
 */
export async function createUserByAdmin(input: unknown) {
  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, message: 'Ungültige Eingabe' }
  }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: adminUser } = await payload.auth({ headers })

    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required' }
    }

    const user = await payload.create({
      collection: 'users',
      data: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
        role: parsed.data.role || 'member',
      },
    })

    return { success: true, user }
  } catch (error) {
    console.error('Create user error:', error)
    return { success: false, message: 'Failed to create user' }
  }
}
