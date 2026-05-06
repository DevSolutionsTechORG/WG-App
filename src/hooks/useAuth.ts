'use client'

import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'member' | 'admin'
  avatar?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

/**
 * Client-side auth hook for session management
 * Auto-refreshes session on mount and provides auth state
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setState({
          user: data.user || null,
          isLoading: false,
          isAuthenticated: !!data.user,
        })
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [])

  // Auto-refresh on mount
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Periodic refresh (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(refreshSession, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshSession])

  const logout = useCallback(async () => {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  return {
    ...state,
    refreshSession,
    logout,
  }
}
