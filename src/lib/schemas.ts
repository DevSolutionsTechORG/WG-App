import { z } from 'zod'

export const idSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ID')

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  eventType: z.enum(['wg-meeting', 'party', 'cleaning', 'waste-collection', 'other']).optional(),
})

export const updateEventSchema = createEventSchema.partial()

export const eventRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const MAX_ICS_IMPORT = 500

// .catch: unbekannte Filterwerte (auch Arrays/Objekte aus der URL) fallen auf den Default zurück.
export const shoppingFilterSchema = z.object({
  category: z.enum(['all', 'food', 'cleaning', 'other']).catch('all'),
  status: z.enum(['open', 'completed', 'rejected', 'all']).catch('open'),
})

// Nur echte Push-Dienste: der Server schickt später Requests an diese URL (kein SSRF).
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  '.push.apple.com',
  '.notify.windows.com',
]
export const isPushEndpoint = (value: string): boolean => {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      PUSH_HOSTS.some((h) => (h.startsWith('.') ? url.hostname.endsWith(h) : url.hostname === h))
    )
  } catch {
    return false
  }
}

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().max(2000).refine(isPushEndpoint, 'Unbekannter Push-Dienst'),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
})

export const createShoppingItemSchema = z.object({
  title: z.string().trim().min(1).max(100),
  category: z.enum(['food', 'cleaning', 'other']),
  priority: z.enum(['high', 'medium', 'low']),
  description: z.string().max(500).optional(),
  quantity: z.number().int().nonnegative().max(9999).optional(),
  unit: z.string().max(20).optional(),
})

export const completeTaskSchema = z.object({
  assignmentId: idSchema,
  notes: z.string().max(2000).optional(),
  selectedOption: z.string().max(200).optional(),
})

export const passwordSchema = z.string().min(8).max(200)

export const requestPasswordResetSchema = z.object({
  email: z.string().email().max(200),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(500),
  password: passwordSchema,
})

export const createUserSchema = z.object({
  email: z.string().email().max(200),
  password: passwordSchema,
  name: z.string().trim().min(1).max(100),
  role: z.enum(['member', 'admin']).optional(),
})
