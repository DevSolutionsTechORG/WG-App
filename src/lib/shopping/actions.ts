'use server'

import type { ShoppingItem, User } from '@/payload-types'

import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { createShoppingItemSchema, idSchema } from '@/lib/schemas'

interface PayloadWhere {
  [key: string]: { equals: string } | PayloadWhere[] | undefined
  status?: { equals: string }
  category?: { equals: string }
  and?: PayloadWhere[]
}

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

    const where: PayloadWhere = {}

    if (status !== 'all') {
      where.status = { equals: status }
    }

    if (category && category !== 'all') {
      where.category = { equals: category }
    }

    const result = await payload.find({
      collection: 'shopping-items',
      where: where as any,
      sort: '-priority',
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

export async function createShoppingItem(input: unknown) {
  const parsed = createShoppingItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, message: 'Ungültige Eingabe' }
  }

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
        ...parsed.data,
        status: 'open',
        requestedBy: currentUser.id,
      },
    })

    return { success: true, item, message: 'Artikel hinzugefügt' }
  } catch (error) {
    console.error('Create shopping item error:', error)
    return { success: false, message: 'Fehler beim Hinzufügen' }
  }
}

export async function completeShoppingItem(itemId: unknown) {
  const idResult = idSchema.safeParse(itemId)
  if (!idResult.success) return { success: false, message: 'Ungültige Eingabe' }

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
      id: idResult.data,
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

export async function reopenShoppingItem(itemId: unknown) {
  const idResult = idSchema.safeParse(itemId)
  if (!idResult.success) return { success: false, message: 'Ungültige Eingabe' }

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
      id: idResult.data,
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

export async function deleteShoppingItem(itemId: unknown) {
  const idResult = idSchema.safeParse(itemId)
  if (!idResult.success) return { success: false, message: 'Ungültige Eingabe' }

  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: currentUser } = await payload.auth({ headers })
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const item = (await payload.findByID({
      collection: 'shopping-items',
      id: idResult.data,
      overrideAccess: true,
      depth: 0,
    })) as ShoppingItem | null

    if (!item) return { success: false, message: 'Artikel nicht gefunden' }

    const requesterId =
      typeof item.requestedBy === 'string' ? item.requestedBy : (item.requestedBy as User).id

    if (currentUser.role !== 'admin' && requesterId !== currentUser.id) {
      return { success: false, message: 'Nicht berechtigt' }
    }

    await payload.delete({
      collection: 'shopping-items',
      id: idResult.data,
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
