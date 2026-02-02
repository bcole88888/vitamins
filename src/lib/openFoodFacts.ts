import { ProductData, NutrientData } from '@/types'
import { normalizeNutrientName } from './nutrients'

const API_BASE = 'https://world.openfoodfacts.org/api/v0/product'

// Mapping of Open Food Facts nutrient keys to readable names
const NUTRIENT_KEY_MAP: Record<string, string> = {
  'vitamin-a': 'Vitamin A',
  'vitamin-a_value': 'Vitamin A',
  'vitamin-c': 'Vitamin C',
  'vitamin-c_value': 'Vitamin C',
  'vitamin-d': 'Vitamin D',
  'vitamin-d_value': 'Vitamin D',
  'vitamin-e': 'Vitamin E',
  'vitamin-e_value': 'Vitamin E',
  'vitamin-k': 'Vitamin K',
  'vitamin-k_value': 'Vitamin K',
  'vitamin-b1': 'Vitamin B1',
  'vitamin-b2': 'Vitamin B2',
  'vitamin-b3': 'Vitamin B3',
  'vitamin-b5': 'Vitamin B5',
  'vitamin-b6': 'Vitamin B6',
  'vitamin-b7': 'Vitamin B7',
  'vitamin-b9': 'Vitamin B9',
  'vitamin-b12': 'Vitamin B12',
  'thiamin': 'Thiamin',
  'riboflavin': 'Riboflavin',
  'niacin': 'Niacin',
  'pantothenic-acid': 'Pantothenic Acid',
  'biotin': 'Biotin',
  'folates': 'Folate',
  'folic-acid': 'Folic Acid',
  'calcium': 'Calcium',
  'iron': 'Iron',
  'magnesium': 'Magnesium',
  'phosphorus': 'Phosphorus',
  'potassium': 'Potassium',
  'sodium': 'Sodium',
  'zinc': 'Zinc',
  'copper': 'Copper',
  'manganese': 'Manganese',
  'selenium': 'Selenium',
  'chromium': 'Chromium',
  'molybdenum': 'Molybdenum',
  'iodine': 'Iodine',
  'fiber': 'Fiber',
  'omega-3-fat': 'Omega-3',
}

interface OpenFoodFactsResponse {
  status: number
  status_verbose: string
  product?: {
    product_name?: string
    brands?: string
    image_url?: string
    serving_size?: string
    serving_quantity?: number
    nutriments?: Record<string, number | string>
  }
}

export async function lookupProduct(upc: string): Promise<ProductData | null> {
  try {
    // Clean the UPC (remove dashes, spaces)
    const cleanUpc = upc.replace(/[-\s]/g, '')

    const response = await fetch(`${API_BASE}/${cleanUpc}.json`, {
      headers: {
        'User-Agent': 'VitaminTracker/1.0 - Personal supplement tracking app',
      },
    })

    if (!response.ok) {
      console.error('Open Food Facts API error:', response.status)
      return null
    }

    const data: OpenFoodFactsResponse = await response.json()

    if (data.status !== 1 || !data.product) {
      return null
    }

    const product = data.product
    const nutrients: NutrientData[] = []

    // Extract nutrients from the nutriments object
    if (product.nutriments) {
      const nutriments = product.nutriments

      // Look for vitamin and mineral values
      for (const [key, value] of Object.entries(nutriments)) {
        // Skip non-value entries and zero values
        if (typeof value !== 'number' || value === 0) continue

        // Skip entries that end in _unit, _serving, _100g, etc. (we want the base value)
        if (key.endsWith('_unit') || key.endsWith('_serving') || key.endsWith('_label')) continue

        // Only process if we have a mapping or it looks like a vitamin/mineral
        let nutrientName = NUTRIENT_KEY_MAP[key]

        // If not in our map, try to extract from keys like "vitamin-a_100g"
        if (!nutrientName) {
          const baseKey = key.replace(/_100g$|_serving$|_value$/g, '')
          nutrientName = NUTRIENT_KEY_MAP[baseKey]
        }

        // Skip if we still don't have a name
        if (!nutrientName) continue

        // Get the unit
        const unitKey = `${key.replace(/_100g$|_serving$|_value$/g, '')}_unit`
        let unit = (nutriments[unitKey] as string) || 'mg'

        // Normalize units
        unit = unit.replace('µg', 'mcg').toLowerCase()

        // Check if we already have this nutrient (avoid duplicates)
        const existing = nutrients.find(n => n.name === nutrientName)
        if (existing) continue

        nutrients.push({
          name: normalizeNutrientName(nutrientName),
          amount: value,
          unit: unit,
        })
      }
    }

    // Parse serving size
    let servingSize: number | undefined
    let servingUnit: string | undefined
    if (product.serving_quantity) {
      servingSize = product.serving_quantity
      servingUnit = 'g'
    } else if (product.serving_size) {
      const match = product.serving_size.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz|tablet|capsule|softgel)?/i)
      if (match) {
        servingSize = parseFloat(match[1])
        servingUnit = match[2]?.toLowerCase() || 'serving'
      }
    }

    return {
      upc: cleanUpc,
      name: product.product_name || `Product ${cleanUpc}`,
      brand: product.brands,
      servingSize,
      servingUnit,
      imageUrl: product.image_url,
      nutrients,
    }
  } catch (error) {
    console.error('Error looking up product:', error)
    return null
  }
}

// Search products by name (fallback when UPC not found)
export async function searchProducts(query: string, limit: number = 10): Promise<ProductData[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`,
      {
        headers: {
          'User-Agent': 'VitaminTracker/1.0 - Personal supplement tracking app',
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    if (!data.products || !Array.isArray(data.products)) {
      return []
    }

    // Convert to our format (simplified - just basic info for search results)
    return data.products.slice(0, limit).map((p: Record<string, unknown>) => ({
      upc: p.code as string,
      name: (p.product_name as string) || `Product ${p.code}`,
      brand: p.brands as string | undefined,
      imageUrl: p.image_url as string | undefined,
      nutrients: [], // Full lookup needed for nutrients
    }))
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}
