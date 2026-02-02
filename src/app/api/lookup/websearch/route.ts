import { NextResponse } from 'next/server'
import { ProductData, NutrientData } from '@/types'
import { normalizeNutrientName } from '@/lib/nutrients'

interface WebSearchResult {
  product: ProductData | null
  searchResults: Array<{
    title: string
    url: string
    snippet: string
  }>
}

async function searchUPCItemDB(upc: string): Promise<ProductData | null> {
  try {
    // UPCitemdb.com free API (rate limited but no key required for basic lookups)
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`,
      {
        headers: {
          'Accept': 'application/json',
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
      nutrients: [], // UPCitemdb doesn't have nutrient info
    }
  } catch (error) {
    console.error('UPCitemdb lookup error:', error)
    return null
  }
}

async function searchWeb(query: string): Promise<WebSearchResult> {
  try {
    // Use DuckDuckGo instant answer API (free, no key required)
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' supplement vitamin')}&format=json&no_html=1`,
      {
        headers: {
          'User-Agent': 'VitaminTracker/1.0',
        },
      }
    )

    if (!response.ok) {
      return { product: null, searchResults: [] }
    }

    const data = await response.json()

    const searchResults: Array<{ title: string; url: string; snippet: string }> = []

    // Extract related topics as search results
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          searchResults.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
          })
        }
      }
    }

    // Try to extract product info from abstract
    let product: ProductData | null = null
    if (data.Heading && data.Abstract) {
      product = {
        name: data.Heading,
        brand: undefined,
        nutrients: [],
      }
    }

    return { product, searchResults }
  } catch (error) {
    console.error('Web search error:', error)
    return { product: null, searchResults: [] }
  }
}

// Parse nutrient info from text (best effort)
function parseNutrientsFromText(text: string): NutrientData[] {
  const nutrients: NutrientData[] = []

  // Common patterns like "Vitamin D 1000 IU" or "Vitamin D3 25mcg"
  const patterns = [
    /vitamin\s+([a-z]\d*)\s+(\d+(?:\.\d+)?)\s*(iu|mcg|mg|μg)/gi,
    /(\d+(?:\.\d+)?)\s*(iu|mcg|mg|μg)\s+vitamin\s+([a-z]\d*)/gi,
    /(calcium|iron|magnesium|zinc|selenium|potassium)\s+(\d+(?:\.\d+)?)\s*(mg|mcg)/gi,
    /(\d+(?:\.\d+)?)\s*(mg|mcg)\s+(calcium|iron|magnesium|zinc|selenium|potassium)/gi,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      let name: string
      let amount: number
      let unit: string

      if (match[1].match(/^\d/)) {
        // Amount first pattern
        amount = parseFloat(match[1])
        unit = match[2].toLowerCase()
        name = match[3]
      } else {
        // Name first pattern
        name = match[1]
        amount = parseFloat(match[2])
        unit = match[3].toLowerCase()
      }

      // Normalize unit
      unit = unit.replace('μg', 'mcg')

      const normalizedName = normalizeNutrientName(name)

      // Avoid duplicates
      if (!nutrients.find(n => n.name === normalizedName)) {
        nutrients.push({
          name: normalizedName,
          amount,
          unit,
        })
      }
    }
  }

  return nutrients
}

export async function POST(request: Request) {
  try {
    const { upc, query } = await request.json()

    if (!upc && !query) {
      return NextResponse.json(
        { error: 'UPC or query is required' },
        { status: 400 }
      )
    }

    const searchTerm = upc || query
    let product: ProductData | null = null
    let searchResults: Array<{ title: string; url: string; snippet: string }> = []
    let source = 'websearch'

    // First try UPCitemdb if we have a UPC
    if (upc) {
      product = await searchUPCItemDB(upc)
      if (product) {
        source = 'upcitemdb'
      }
    }

    // If still no product, try web search
    if (!product) {
      const webResult = await searchWeb(searchTerm)
      product = webResult.product
      searchResults = webResult.searchResults
    }

    return NextResponse.json({
      source,
      product,
      searchResults,
      query: searchTerm,
    })
  } catch (error) {
    console.error('Web search lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to search for product' },
      { status: 500 }
    )
  }
}
