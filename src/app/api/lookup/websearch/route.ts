import { NextResponse } from 'next/server'
import { ProductData, NutrientData } from '@/types'
import { normalizeNutrientName } from '@/lib/nutrients'
import { fetchWithTimeout } from '@/lib/apiUtils'
import { websearchSchema, parseBody } from '@/lib/validation'

interface WebSearchResult {
  product: ProductData | null
  searchResults: Array<{
    title: string
    url: string
    snippet: string
  }>
  nutrients: NutrientData[]
}

// Fetch and parse a webpage for supplement facts
async function fetchAndParseSupplementFacts(url: string): Promise<NutrientData[]> {
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VitaminTracker/1.0)',
        'Accept': 'text/html',
      },
    })

    if (!response || !response.ok) return []

    const html = await response.text()
    return parseNutrientsFromHtml(html)
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error)
    return []
  }
}

// Clean up nutrient name for display
function cleanNutrientName(name: string): string {
  // Remove parenthetical info like "(as Phytonadione)"
  let cleaned = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim()

  // Capitalize first letter of each word
  cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase())

  // Fix common patterns
  cleaned = cleaned
    .replace(/^K(\d*)$/i, 'Vitamin K$1')
    .replace(/^([ABCDE])(\d*)$/i, 'Vitamin $1$2')
    .replace(/Mk-?(\d)/gi, 'MK-$1')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned
}

// Parse nutrients from HTML content
function parseNutrientsFromHtml(html: string): NutrientData[] {
  const nutrients: NutrientData[] = []
  const seen = new Set<string>()

  // Clean HTML - remove scripts and styles
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')

  // Patterns for supplement facts - these match common label formats
  const patterns: Array<{ pattern: RegExp; nameIndex: number; amountIndex: number; unitIndex: number }> = [
    // "Vitamin K1 100 mcg" or "Vitamin K-1 100mcg"
    { pattern: /vitamin\s+([a-z]-?\d*)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|iu|μg)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
    // "Vitamin K2 (as MK-7) 50 mcg"
    { pattern: /vitamin\s+(k-?\d*)\s*\([^)]+\)\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|iu|μg)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
    // "100 mcg Vitamin K1"
    { pattern: /(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|iu|μg)\s+vitamin\s+([a-z]-?\d*)/gi, nameIndex: 3, amountIndex: 1, unitIndex: 2 },
    // "Vitamin K2 MK-7 50 mcg" or "Vitamin K2 as MK-7 50 mcg"
    { pattern: /vitamin\s+k-?2\s+(?:as\s+)?(mk-?\d+)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|iu|μg)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
    // "MK-7 50 mcg" or "MK-4 400 mcg"
    { pattern: /(mk-?\d+)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|iu|μg)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
    // Minerals: "Calcium 500 mg"
    { pattern: /(calcium|iron|magnesium|zinc|selenium|potassium|iodine|copper|manganese|chromium|molybdenum|phosphorus|sodium)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|μg)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
    // "500 mg Calcium"
    { pattern: /(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|μg)\s+(calcium|iron|magnesium|zinc|selenium|potassium|iodine|copper|manganese|chromium|molybdenum|phosphorus|sodium)/gi, nameIndex: 3, amountIndex: 1, unitIndex: 2 },
    // B vitamins by name
    { pattern: /(thiamin|riboflavin|niacin|folate|folic acid|biotin|pantothenic acid|cobalamin)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*(mcg|mg|μg)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
    // Omega fatty acids
    { pattern: /(omega-?3|epa|dha|fish oil)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|g)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
    // Other supplements
    { pattern: /(coenzyme q10|coq10|melatonin|glucosamine|chondroitin|turmeric|curcumin)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg)/gi, nameIndex: 1, amountIndex: 2, unitIndex: 3 },
  ]

  for (const { pattern, nameIndex, amountIndex, unitIndex } of patterns) {
    let match
    pattern.lastIndex = 0

    while ((match = pattern.exec(cleanHtml)) !== null) {
      const rawName = match[nameIndex]
      const amount = parseFloat(match[amountIndex].replace(/,/g, ''))
      let unit = match[unitIndex].toLowerCase().replace('μg', 'mcg')

      // Clean and normalize the name
      const cleanedName = cleanNutrientName(rawName)
      const normalizedName = normalizeNutrientName(cleanedName)

      // Skip if we've seen this nutrient or amount is invalid
      const key = normalizedName.toLowerCase()
      if (seen.has(key) || amount <= 0) continue

      // Skip overly long/complex names (likely parsing errors)
      if (normalizedName.length > 30) continue

      seen.add(key)
      nutrients.push({
        name: normalizedName,
        amount,
        unit,
      })
    }
  }

  return nutrients
}

// Search using DuckDuckGo HTML search
async function searchDuckDuckGo(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const response = await fetchWithTimeout(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VitaminTracker/1.0)',
          'Accept': 'text/html',
        },
      }
    )

    if (!response || !response.ok) return []

    const html = await response.text()
    const results: Array<{ title: string; url: string; snippet: string }> = []

    // Parse search results from DuckDuckGo HTML
    // Results are in <a class="result__a"> tags
    const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi

    let match
    while ((match = resultPattern.exec(html)) !== null && results.length < 8) {
      let url = match[1]
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      const snippet = match[3].replace(/<[^>]+>/g, '').trim()

      // DuckDuckGo uses redirect URLs, extract the actual URL
      const urlMatch = url.match(/uddg=([^&]+)/)
      if (urlMatch) {
        url = decodeURIComponent(urlMatch[1])
      }

      // Filter to likely useful sources
      if (url.includes('amazon.com') ||
          url.includes('walmart.com') ||
          url.includes('iherb.com') ||
          url.includes('vitaminshoppe.com') ||
          url.includes('vitacost.com') ||
          url.includes('cvs.com') ||
          url.includes('walgreens.com') ||
          url.match(/\.(com|net|org)\/.*vitamin/i) ||
          title.toLowerCase().includes('supplement')) {
        results.push({ title, url, snippet })
      }
    }

    // If no filtered results, try a simpler pattern
    if (results.length === 0) {
      const simplePattern = /<a[^>]*class="result__url"[^>]*href="([^"]+)"[^>]*>/gi
      while ((match = simplePattern.exec(html)) !== null && results.length < 5) {
        let url = match[1]
        const urlMatch = url.match(/uddg=([^&]+)/)
        if (urlMatch) {
          url = decodeURIComponent(urlMatch[1])
        }
        results.push({ title: url, url, snippet: '' })
      }
    }

    return results
  } catch (error) {
    console.error('DuckDuckGo search error:', error)
    return []
  }
}

// Alternative: Use Bing search
async function searchBing(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const response = await fetchWithTimeout(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
      }
    )

    if (!response || !response.ok) return []

    const html = await response.text()
    const results: Array<{ title: string; url: string; snippet: string }> = []

    // Parse Bing results - look for <li class="b_algo"> elements
    const resultPattern = /<li class="b_algo"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+(?:<[^>]*>[^<]*)*)<\/a>[\s\S]*?<p[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/p>/gi

    let match
    while ((match = resultPattern.exec(html)) !== null && results.length < 8) {
      const url = match[1]
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      const snippet = match[3].replace(/<[^>]+>/g, '').trim()

      if (!url.includes('bing.com') && !url.includes('microsoft.com')) {
        results.push({ title, url, snippet })
      }
    }

    return results
  } catch (error) {
    console.error('Bing search error:', error)
    return []
  }
}

// Extract expected nutrients from product name (e.g., "Vitamin D3 5000 IU" -> D3, 5000, IU)
function extractExpectedNutrients(productName: string): Array<{ name: string; amount: number; unit: string }> {
  const expected: Array<{ name: string; amount: number; unit: string }> = []

  // Patterns to extract from product names like "Vitamin D3 5000 IU" or "Vitamin K2 MK-7 100 mcg"
  const patterns = [
    /vitamin\s+([a-z]-?\d*(?:\s+mk-?\d+)?)\s+(\d+(?:,\d+)?)\s*(iu|mcg|mg)/gi,
    /(\d+(?:,\d+)?)\s*(iu|mcg|mg)\s+vitamin\s+([a-z]-?\d*)/gi,
    /(calcium|magnesium|zinc|iron|selenium)\s+(\d+(?:,\d+)?)\s*(mg|mcg)/gi,
    /(omega-?3|fish oil|epa|dha)\s+(\d+(?:,\d+)?)\s*(mg|g)/gi,
  ]

  for (const pattern of patterns) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(productName)) !== null) {
      let name: string, amount: number, unit: string

      if (/^\d/.test(match[1])) {
        amount = parseFloat(match[1].replace(/,/g, ''))
        unit = match[2].toLowerCase()
        name = match[3]
      } else {
        name = match[1]
        amount = parseFloat(match[2].replace(/,/g, ''))
        unit = match[3].toLowerCase()
      }

      expected.push({
        name: cleanNutrientName(name),
        amount,
        unit: unit.replace('μg', 'mcg'),
      })
    }
  }

  return expected
}

// Filter parsed nutrients based on expected nutrients from product name
function filterNutrientsByExpected(
  parsed: NutrientData[],
  expected: Array<{ name: string; amount: number; unit: string }>
): NutrientData[] {
  if (expected.length === 0) {
    // No expected nutrients, return all parsed (but limit to reasonable set)
    return parsed.slice(0, 10)
  }

  // For single-ingredient supplements, be strict
  if (expected.length === 1) {
    const exp = expected[0]
    // Find the nutrient that best matches the expected
    const matching = parsed.filter(n => {
      const nameMatch = n.name.toLowerCase().includes(exp.name.toLowerCase()) ||
                        exp.name.toLowerCase().includes(n.name.toLowerCase())
      const amountClose = Math.abs(n.amount - exp.amount) / exp.amount < 0.1 // Within 10%
      const unitMatch = n.unit.toLowerCase() === exp.unit.toLowerCase()
      return nameMatch && unitMatch && (amountClose || n.amount === exp.amount)
    })

    if (matching.length > 0) {
      return matching
    }

    // If no exact match, return the expected nutrient itself
    return [{
      name: normalizeNutrientName(exp.name),
      amount: exp.amount,
      unit: exp.unit,
    }]
  }

  // For multi-ingredient supplements, return parsed nutrients that seem reasonable
  return parsed.slice(0, 10)
}

// Look up product info from UPCitemdb
async function lookupUPCitemdb(upc: string): Promise<{ name: string; brand?: string; imageUrl?: string } | null> {
  try {
    const response = await fetchWithTimeout(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'VitaminTracker/1.0',
        },
      }
    )

    if (!response || !response.ok) return null

    const data = await response.json()

    if (data.code !== 'OK' || !data.items || data.items.length === 0) {
      return null
    }

    const item = data.items[0]
    return {
      name: item.title || `Product ${upc}`,
      brand: item.brand,
      imageUrl: item.images?.[0],
    }
  } catch (error) {
    console.error('UPCitemdb lookup error:', error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseBody(websearchSchema, await request.json())
    if (!parsed.success) return parsed.response

    let { upc, query, productName, brand } = parsed.data

    // If we have a UPC but generic/missing product name, look it up
    let imageUrl: string | undefined
    if (upc && (!productName || productName.startsWith('Product ') || !brand)) {
      const upcInfo = await lookupUPCitemdb(upc)
      if (upcInfo) {
        productName = upcInfo.name
        brand = upcInfo.brand || brand
        imageUrl = upcInfo.imageUrl
      }
    }

    // Extract expected nutrients from product name
    const expectedNutrients = productName ? extractExpectedNutrients(productName) : []

    // Build search query for supplement facts
    let searchQuery = ''
    if (productName) {
      searchQuery = `${brand ? brand + ' ' : ''}${productName} supplement facts ingredients`
    } else if (query) {
      searchQuery = `${query} supplement facts`
    } else {
      searchQuery = `UPC ${upc} supplement vitamin facts`
    }

    // Search for the product
    let searchResults = await searchDuckDuckGo(searchQuery)

    // If DuckDuckGo didn't return good results, try Bing
    if (searchResults.length === 0) {
      searchResults = await searchBing(searchQuery)
    }

    // Try to fetch and parse supplement facts from top results
    let allNutrients: NutrientData[] = []
    const checkedUrls: string[] = []

    for (const result of searchResults.slice(0, 4)) {
      if (checkedUrls.includes(result.url)) continue
      checkedUrls.push(result.url)

      const nutrients = await fetchAndParseSupplementFacts(result.url)
      if (nutrients.length > allNutrients.length) {
        allNutrients = nutrients
      }

      // If we found good nutrient data, stop searching
      if (allNutrients.length >= 3) {
        break
      }
    }

    // Filter nutrients based on expected values from product name
    const filteredNutrients = filterNutrientsByExpected(allNutrients, expectedNutrients)

    // If we have expected nutrients but couldn't find them, use the expected values
    if (filteredNutrients.length === 0 && expectedNutrients.length > 0) {
      for (const exp of expectedNutrients) {
        filteredNutrients.push({
          name: normalizeNutrientName(exp.name),
          amount: exp.amount,
          unit: exp.unit,
        })
      }
    }

    // Build product if we have info
    let product: ProductData | null = null
    if (productName || filteredNutrients.length > 0) {
      product = {
        upc: upc || undefined,
        name: productName || query || `Product ${upc}`,
        brand: brand,
        imageUrl: imageUrl,
        nutrients: filteredNutrients,
      }
    }

    return NextResponse.json({
      source: 'websearch',
      product,
      searchResults,
      nutrients: filteredNutrients,
      query: searchQuery,
    })
  } catch (error) {
    console.error('Web search lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to search for product' },
      { status: 500 }
    )
  }
}
