import { NextResponse } from 'next/server'
import { lookupProduct, searchProducts } from '@/lib/openFoodFacts'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ upc: string }> }
) {
  try {
    const { upc } = await params

    if (!upc) {
      return NextResponse.json({ error: 'UPC is required' }, { status: 400 })
    }

    // First check if we already have this product in the database
    const existing = await prisma.product.findUnique({
      where: { upc },
      include: { nutrients: true },
    })

    if (existing) {
      return NextResponse.json({
        source: 'database',
        product: existing,
      })
    }

    // Look up in Open Food Facts
    const product = await lookupProduct(upc)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', upc },
        { status: 404 }
      )
    }

    return NextResponse.json({
      source: 'openfoodfacts',
      product,
    })
  } catch (error) {
    console.error('Error looking up product:', error)
    return NextResponse.json(
      { error: 'Failed to lookup product' },
      { status: 500 }
    )
  }
}

// Search endpoint (query parameter)
export async function POST(request: Request) {
  try {
    const { query, limit = 10 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const products = await searchProducts(query, limit)

    return NextResponse.json({
      source: 'openfoodfacts',
      products,
    })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
