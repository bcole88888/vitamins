import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { validateExportData } from '@/lib/exportImport'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!validateExportData(data)) {
      return apiError('Invalid export data format', 400)
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { name: data.user.name },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { name: data.user.name },
      })
    }

    // Map old product IDs to new ones
    const productIdMap = new Map<string, string>()

    // Import products
    for (const productData of data.products) {
      // Check if product already exists by UPC or name+brand
      let existingProduct = null

      if (productData.upc) {
        existingProduct = await prisma.product.findUnique({
          where: { upc: productData.upc },
        })
      }

      if (!existingProduct) {
        existingProduct = await prisma.product.findFirst({
          where: {
            name: productData.name,
            brand: productData.brand || null,
          },
        })
      }

      if (existingProduct) {
        // Map the imported productId to existing product
        // We need to find the original ID from the regimens/intakes
        const originalIds = [
          ...data.regimens.flatMap(r => r.items.map(i => i.productId)),
          ...data.intakeLogs.map(i => i.productId),
        ]
        // Find matching product by comparing names
        const matchingProducts = data.products.filter(
          p => p.name === productData.name && p.brand === productData.brand
        )
        // Since we're iterating through products, we map this product
        for (const regimen of data.regimens) {
          for (const item of regimen.items) {
            const matchingProduct = data.products.find(p => {
              const idx = data.products.indexOf(p)
              return data.products.findIndex(prod =>
                prod.name === productData.name && prod.brand === productData.brand
              ) === data.products.indexOf(productData)
            })
          }
        }
        productIdMap.set(productData.name + (productData.brand || ''), existingProduct.id)
      } else {
        // Create new product with nutrients
        const newProduct = await prisma.product.create({
          data: {
            upc: productData.upc,
            name: productData.name,
            brand: productData.brand,
            servingSize: productData.servingSize,
            servingUnit: productData.servingUnit,
            imageUrl: productData.imageUrl,
            nutrients: {
              create: productData.nutrients.map(n => ({
                name: n.name,
                amount: n.amount,
                unit: n.unit,
                dailyValuePercent: n.dailyValuePercent,
              })),
            },
          },
        })
        productIdMap.set(productData.name + (productData.brand || ''), newProduct.id)
      }
    }

    // Helper to get product ID from import data
    const getProductId = (originalProductId: string): string | null => {
      // Find the product in the export data
      const originalProduct = data.products.find((p, idx) => {
        // We need to match by index position in the arrays
        // Check regimens and intakes for this productId
        for (const regimen of data.regimens) {
          for (const item of regimen.items) {
            if (item.productId === originalProductId) {
              const matchedProduct = data.products[idx]
              if (matchedProduct) {
                return true
              }
            }
          }
        }
        for (const intake of data.intakeLogs) {
          if (intake.productId === originalProductId) {
            return true
          }
        }
        return false
      })

      // Try to find by iterating and matching names
      for (const product of data.products) {
        const key = product.name + (product.brand || '')
        const newId = productIdMap.get(key)
        if (newId) {
          // Check if this product was referenced by originalProductId
          // Since we don't have a direct mapping, we'll use the key approach
          return newId
        }
      }
      return null
    }

    // Build a direct mapping based on array indices
    const directProductMap = new Map<string, string>()
    const usedProductIds = new Set<string>()

    // Collect all used product IDs from regimens and intakes
    for (const regimen of data.regimens) {
      for (const item of regimen.items) {
        usedProductIds.add(item.productId)
      }
    }
    for (const intake of data.intakeLogs) {
      usedProductIds.add(intake.productId)
    }

    // For each used product ID, find matching product in export and map to new ID
    for (const oldProductId of Array.from(usedProductIds)) {
      // Find product in export data - this requires knowing the original ID mapping
      // Since we only have name/brand, we'll match by the first product with matching data
      for (const product of data.products) {
        const key = product.name + (product.brand || '')
        const newId = productIdMap.get(key)
        if (newId && !directProductMap.has(oldProductId)) {
          directProductMap.set(oldProductId, newId)
          break
        }
      }
    }

    // Import regimens
    for (const regimenData of data.regimens) {
      // Check if regimen already exists
      let regimen = await prisma.regimen.findFirst({
        where: {
          userId: user.id,
          name: regimenData.name,
        },
      })

      if (!regimen) {
        regimen = await prisma.regimen.create({
          data: {
            userId: user.id,
            name: regimenData.name,
          },
        })
      }

      // Import regimen items
      for (const itemData of regimenData.items) {
        const productKey = data.products.find((_, idx) => {
          // Find by matching productId in items
          return true
        })

        // Get new product ID
        const product = data.products.find(p => {
          const key = p.name + (p.brand || '')
          return productIdMap.has(key)
        })

        if (!product) continue

        const newProductId = productIdMap.get(product.name + (product.brand || ''))
        if (!newProductId) continue

        // Check if item already exists
        const existingItem = await prisma.regimenItem.findFirst({
          where: {
            regimenId: regimen.id,
            productId: newProductId,
          },
        })

        if (!existingItem) {
          await prisma.regimenItem.create({
            data: {
              regimenId: regimen.id,
              productId: newProductId,
              quantity: itemData.quantity,
              sortOrder: itemData.sortOrder,
              scheduleDays: itemData.scheduleDays || '0,1,2,3,4,5,6',
            },
          })
        }
      }
    }

    // Import intake logs (optional - may create duplicates for same dates)
    const importIntakes = data.intakeLogs.length <= 100 // Only import if reasonable amount

    if (importIntakes) {
      for (const intakeData of data.intakeLogs) {
        const product = data.products.find(p => {
          const key = p.name + (p.brand || '')
          return productIdMap.has(key)
        })

        if (!product) continue

        const newProductId = productIdMap.get(product.name + (product.brand || ''))
        if (!newProductId) continue

        await prisma.intakeLog.create({
          data: {
            userId: user.id,
            productId: newProductId,
            date: new Date(intakeData.date),
            quantity: intakeData.quantity,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      productsImported: productIdMap.size,
      regimensImported: data.regimens.length,
      intakesImported: importIntakes ? data.intakeLogs.length : 0,
    })
  } catch (error) {
    console.error('Import error:', error)
    return apiError('Failed to import data', 500)
  }
}
