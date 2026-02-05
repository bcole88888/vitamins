import { z } from 'zod'
import { NextResponse } from 'next/server'

// --- Reusable primitives ---

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
const cuid = z.string().min(1)
const positiveFloat = z.number().positive()
const nonNegativeFloat = z.number().min(0)

// Schedule days: CSV of day numbers 0-6
const scheduleDays = z.string().regex(
  /^[0-6](,[0-6])*$/,
  'Must be comma-separated day numbers 0-6'
)

// --- Route schemas ---

export const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export const nutrientSchema = z.object({
  name: z.string().min(1),
  amount: z.number(),
  unit: z.string().min(1),
  dailyValuePercent: z.number().optional(),
})

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(500),
  upc: z.string().max(50).optional(),
  brand: z.string().max(200).optional(),
  servingSize: z.number().positive().optional(),
  servingUnit: z.string().max(50).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).or(z.literal(undefined)),
  nutrients: z.array(nutrientSchema).optional(),
})

export const productUpdateSchema = z.object({
  id: cuid,
  nutrients: z.array(nutrientSchema),
})

export const intakeCreateSchema = z.object({
  userId: cuid,
  productId: cuid,
  quantity: positiveFloat.default(1),
  date: dateStr.optional(),
})

export const regimenCreateSchema = z.object({
  userId: cuid,
})

export const regimenItemCreateSchema = z.object({
  regimenId: cuid,
  productId: cuid,
  quantity: positiveFloat.default(1),
  scheduleDays: scheduleDays.default('0,1,2,3,4,5,6'),
})

export const regimenItemUpdateSchema = z.object({
  itemId: cuid,
  quantity: positiveFloat.optional(),
  sortOrder: nonNegativeFloat.int().optional(),
  scheduleDays: scheduleDays.optional(),
})

export const regimenLogSchema = z.object({
  userId: cuid,
  date: dateStr,
  items: z.array(z.object({
    productId: cuid,
    checked: z.boolean(),
    quantity: positiveFloat,
  })).min(1),
})

export const notificationPrefSchema = z.object({
  userId: cuid,
  enabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format').optional(),
})

export const lookupSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500),
  limit: z.number().int().min(1).max(50).default(10),
})

export const websearchSchema = z.object({
  upc: z.string().max(50).optional(),
  query: z.string().max(500).optional(),
  productName: z.string().max(500).optional(),
  brand: z.string().max(200).optional(),
}).refine(
  data => data.upc || data.query || data.productName,
  { message: 'At least one of upc, query, or productName is required' }
)

// --- Helper: parse body and return 400 on failure ---

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  return {
    success: false,
    response: NextResponse.json(
      { error: 'Validation failed', details: messages },
      { status: 400 }
    ),
  }
}
