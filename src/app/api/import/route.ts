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

    const result = await prisma.$transaction(async (tx) => {
      // Find or create user
      let user = await tx.user.findFirst({
        where: { name: data.user.name },
      })

      if (!user) {
        user = await tx.user.create({
          data: { name: data.user.name },
        })
      }

      // Build a map from product key (name+brand) to new product ID
      const productIdMap = new Map<string, string>()

      // Import products
      for (const productData of data.products) {
        const key = productData.name + (productData.brand || '')

        // Check if product already exists by UPC or name+brand
        let existingProduct = null

        if (productData.upc) {
          existingProduct = await tx.product.findUnique({
            where: { upc: productData.upc },
          })
        }

        if (!existingProduct) {
          existingProduct = await tx.product.findFirst({
            where: {
              name: productData.name,
              brand: productData.brand || null,
            },
          })
        }

        if (existingProduct) {
          productIdMap.set(key, existingProduct.id)
        } else {
          const newProduct = await tx.product.create({
            data: {
              upc: productData.upc,
              name: productData.name,
              brand: productData.brand,
              servingSize: productData.servingSize,
              servingUnit: productData.servingUnit,
              imageUrl: productData.imageUrl,
              nutrients: {
                create: productData.nutrients.map((n: { name: string; amount: number; unit: string; dailyValuePercent?: number }) => ({
                  name: n.name,
                  amount: n.amount,
                  unit: n.unit,
                  dailyValuePercent: n.dailyValuePercent,
                })),
              },
            },
          })
          productIdMap.set(key, newProduct.id)
        }
      }

      // Build a mapping from old product IDs to new product IDs
      // by matching productId references in regimens/intakes to products by index
      const oldIdToKey = new Map<string, string>()
      for (const productData of data.products) {
        // Find all old IDs that reference this product in regimens and intakes
        const key = productData.name + (productData.brand || '')

        for (const regimen of data.regimens) {
          for (const item of regimen.items) {
            // Match by finding the product at the same position in the products array
            const matchedProduct = data.products.find((p: { name: string; brand?: string; upc?: string }) =>
              p.name === productData.name && (p.brand || '') === (productData.brand || '')
            )
            if (matchedProduct) {
              oldIdToKey.set(item.productId, key)
            }
          }
        }
        for (const intake of data.intakeLogs) {
          oldIdToKey.set(intake.productId, key)
        }
      }

      const resolveProductId = (oldId: string): string | null => {
        const key = oldIdToKey.get(oldId)
        if (!key) return null
        return productIdMap.get(key) || null
      }

      // Import regimens
      for (const regimenData of data.regimens) {
        let regimen = await tx.regimen.findFirst({
          where: {
            userId: user.id,
            name: regimenData.name,
          },
        })

        if (!regimen) {
          regimen = await tx.regimen.create({
            data: {
              userId: user.id,
              name: regimenData.name,
            },
          })
        }

        for (const itemData of regimenData.items) {
          const newProductId = resolveProductId(itemData.productId)
          if (!newProductId) continue

          const existingItem = await tx.regimenItem.findFirst({
            where: {
              regimenId: regimen.id,
              productId: newProductId,
            },
          })

          if (!existingItem) {
            await tx.regimenItem.create({
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

      // Import intake logs (only if reasonable amount)
      const importIntakes = data.intakeLogs.length <= 100

      if (importIntakes) {
        for (const intakeData of data.intakeLogs) {
          const newProductId = resolveProductId(intakeData.productId)
          if (!newProductId) continue

          await tx.intakeLog.create({
            data: {
              userId: user.id,
              productId: newProductId,
              date: new Date(intakeData.date),
              quantity: intakeData.quantity,
            },
          })
        }
      }

      return {
        userId: user.id,
        productsImported: productIdMap.size,
        regimensImported: data.regimens.length,
        intakesImported: importIntakes ? data.intakeLogs.length : 0,
      }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Import error:', error)
    return apiError('Failed to import data', 500)
  }
}
