import { z } from 'zod'

export const idSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ID')

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  eventType: z.enum(['wg-meeting', 'party', 'cleaning', 'other']).optional(),
})

export const updateEventSchema = createEventSchema.partial()

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
