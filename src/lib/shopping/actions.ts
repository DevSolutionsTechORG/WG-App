'use server'

import type { ShoppingItem, User } from '@/payload-types'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

/**
 * Get all shopping items
 */
export async function getShoppingItems(category?: string, status: string = 'open') {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated', items: [] }
    }

    const where: Record<string, unknown> = {}

    if (status !== 'all') {
      where.status = { equals: status }
    }

    if (category && category !== 'all') {
      where.category = { equals: category }
    }

    const result = await payload.find({
      collection: 'shopping-items',
      where,
      sort: '-priority', // High priority first
      depth: 1,
      limit: 200,
    })

    return {
      success: true,
      items: result.docs as ShoppingItem[],
      total: result.totalDocs,
    }
  } catch (error) {
    console.error('Get shopping items error:', error)
    return { success: false, message: 'Failed to load items', items: [] }
  }
}

/**
 * Create new shopping item
 */
export async function createShoppingItem(data: {
  title: string
  category: 'food' | 'cleaning' | 'other'
  priority: 'high' | 'medium' | 'low'
  description?: string
  quantity?: number
  unit?: string
}) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const item = await payload.create({
      collection: 'shopping-items',
      data: {
        title: data.title,
        category: data.category,
        priority: data.priority,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        status: 'open',
        requestedBy: currentUser.id,
      } as const,
    })

    return { success: true, item, message: 'Artikel hinzugefügt' }
  } catch (error) {
    console.error('Create shopping item error:', error)
    return { success: false, message: 'Fehler beim Hinzufügen' }
  }
}

/**
 * Complete (buy) a shopping item
 */
export async function completeShoppingItem(itemId: string) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const item = await payload.update({
      collection: 'shopping-items',
      id: itemId,
      data: {
        status: 'completed',
        completedBy: currentUser.id,
        completedAt: new Date().toISOString(),
      },
    })

    return { success: true, item, message: 'Artikel als gekauft markiert' }
  } catch (error) {
    console.error('Complete shopping item error:', error)
    return { success: false, message: 'Fehler beim Abschließen' }
  }
}

/**
 * Reopen a completed shopping item
 */
export async function reopenShoppingItem(itemId: string) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const item = await payload.update({
      collection: 'shopping-items',
      id: itemId,
      data: {
        status: 'open',
        completedBy: null,
        completedAt: null,
      },
    })

    return { success: true, item, message: 'Artikel wieder geöffnet' }
  } catch (error) {
    console.error('Reopen shopping item error:', error)
    return { success: false, message: 'Fehler beim Wiederöffnen' }
  }
}

/**
 * Delete shopping item (admin only)
 */
export async function deleteShoppingItem(itemId: string) {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'Admin required' }
    }

    await payload.delete({
      collection: 'shopping-items',
      id: itemId,
    })

    return { success: true, message: 'Artikel gelöscht' }
  } catch (error) {
    console.error('Delete shopping item error:', error)
    return { success: false, message: 'Fehler beim Löschen' }
  }
}

/**
 * Get category counts for filter UI
 */
export async function getCategoryCounts() {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, counts: {} }
    }

    const categories = ['cleaning', 'food', 'other']
    const counts: Record<string, number> = {}

    for (const category of categories) {
      const result = await payload.find({
        collection: 'shopping-items',
        where: {
          category: { equals: category },
          status: { equals: 'open' },
        },
        limit: 0,
      })
      counts[category] = result.totalDocs
    }

    // Get total open count
    const totalResult = await payload.find({
      collection: 'shopping-items',
      where: {
        status: { equals: 'open' },
      },
      limit: 0,
    })
    counts.all = totalResult.totalDocs

    return { success: true, counts }
  } catch (error) {
    console.error('Get category counts error:', error)
    return { success: false, counts: {} }
  }
}
