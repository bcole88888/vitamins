import { NextResponse } from 'next/server'
import { searchProducts } from '@/lib/openFoodFacts'
import { apiError } from '@/lib/apiUtils'
import { lookupSearchSchema, parseBody } from '@/lib/validation'

// Search endpoint (query parameter)
export async function POST(request: Request) {
  try {
    const parsed = parseBody(lookupSearchSchema, await request.json())
    if (!parsed.success) return parsed.response

    const { query, limit } = parsed.data

    const products = await searchProducts(query, limit)

    return NextResponse.json({
      source: 'openfoodfacts',
      products,
    })
  } catch (error) {
    return apiError('Failed to search products', 500)
  }
}
