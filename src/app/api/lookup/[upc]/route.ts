import { NextResponse } from 'next/server'
import { lookupProduct } from '@/lib/openFoodFacts'
import { prisma, productInclude } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { ProductData } from '@/types'

// Try UPCitemdb API (free tier, rate limited)
async function lookupUPCitemdb(upc: string): Promise<ProductData | null> {
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'VitaminTracker/1.0',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (data.code !== 'OK' || !data.items || data.items.length === 0) {
      return null
    }

    const item = data.items[0]

    return {
      upc,
      name: item.title || `Product ${upc}`,
      brand: item.brand,
      imageUrl: item.images?.[0],
      nutrients: [],
    }
  } catch (error) {
    console.error('UPCitemdb lookup error:', error)
    return null
  }
}

// Try Open Food Facts search by brand/name as fallback
async function searchOpenFoodFactsByName(name: string, brand?: string): Promise<ProductData | null> {
  try {
    const query = brand ? `${brand} ${name}` : name
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`,
      {
        headers: {
          'User-Agent': 'VitaminTracker/1.0',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (!data.products || data.products.length === 0) {
      return null
    }

    // Find best match - look for one with nutrients
    for (const product of data.products) {
      if (product.nutriments && Object.keys(product.nutriments).length > 0) {
        // This product has nutrient data - use the full lookup
        if (product.code) {
          const { lookupProduct } = await import('@/lib/openFoodFacts')
          return lookupProduct(product.code)
        }
      }
    }

    return null
  } catch (error) {
    console.error('OpenFoodFacts search error:', error)
    return null
  }
}

// Try Nutritionix (public endpoint for UPC lookup)
async function lookupNutritionix(upc: string): Promise<ProductData | null> {
  try {
    // Nutritionix track endpoint for UPC
    const response = await fetch(
      `https://trackapi.nutritionix.com/v2/search/item?upc=${upc}`,
      {
        headers: {
          'User-Agent': 'VitaminTracker/1.0',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (!data.foods || data.foods.length === 0) {
      return null
    }

    const food = data.foods[0]
    const nutrients: ProductData['nutrients'] = []

    // Map common Nutritionix nutrient fields
    const nutrientMap: Record<string, string> = {
      nf_vitamin_a_dv: 'Vitamin A',
      nf_vitamin_c_dv: 'Vitamin C',
      nf_calcium_dv: 'Calcium',
      nf_iron_dv: 'Iron',
      nf_vitamin_d_mcg: 'Vitamin D',
      nf_potassium: 'Potassium',
    }

    for (const [key, name] of Object.entries(nutrientMap)) {
      if (food[key] && food[key] > 0) {
        nutrients.push({
          name,
          amount: food[key],
          unit: key.includes('_dv') ? '%' : key.includes('mcg') ? 'mcg' : 'mg',
        })
      }
    }

    return {
      upc,
      name: food.food_name || food.brand_name_item_name || `Product ${upc}`,
      brand: food.brand_name,
      servingSize: food.serving_qty,
      servingUnit: food.serving_unit,
      imageUrl: food.photo?.thumb,
      nutrients,
    }
  } catch (error) {
    console.error('Nutritionix lookup error:', error)
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ upc: string }> }
) {
  try {
    const { upc } = await params

    if (!upc) {
      return apiError('UPC is required', 400)
    }

    const cleanUpc = upc.replace(/[-\s]/g, '')

    // 1. First check if we already have this product in the database
    const existing = await prisma.product.findUnique({
      where: { upc: cleanUpc },
      include: productInclude,
    })

    if (existing) {
      return NextResponse.json({
        source: 'database',
        product: existing,
      })
    }

    // 2. Try Open Food Facts
    let product = await lookupProduct(cleanUpc)
    if (product) {
      return NextResponse.json({
        source: 'openfoodfacts',
        product,
      })
    }

    // 3. Try UPCitemdb (gets basic product info)
    product = await lookupUPCitemdb(cleanUpc)
    if (product) {
      // UPCitemdb doesn't have nutrients, try to find them via Open Food Facts name search
      if (product.nutrients.length === 0 && product.name) {
        const enriched = await searchOpenFoodFactsByName(product.name, product.brand)
        if (enriched && enriched.nutrients.length > 0) {
          // Keep original UPC and product info, but add nutrients from matched product
          product.nutrients = enriched.nutrients
          product.servingSize = enriched.servingSize || product.servingSize
          product.servingUnit = enriched.servingUnit || product.servingUnit
        }
      }
      return NextResponse.json({
        source: 'upcitemdb',
        product,
      })
    }

    // 4. Try Nutritionix
    product = await lookupNutritionix(cleanUpc)
    if (product) {
      return NextResponse.json({
        source: 'nutritionix',
        product,
      })
    }

    // No product found in any database
    return apiError('Product not found', 404)
  } catch (error) {
    console.error('Lookup error:', error)
    return apiError('Failed to lookup product', 500)
  }
}

