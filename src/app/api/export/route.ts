import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/apiUtils'
import { EXPORT_VERSION } from '@/lib/exportImport'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return apiError('userId is required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    // Get all regimens with items
    const regimens = await prisma.regimen.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Get all products used by this user (from regimens and intakes)
    const productIds = new Set<string>()

    // From regimens
    for (const regimen of regimens) {
      for (const item of regimen.items) {
        productIds.add(item.productId)
      }
    }

    // Get intake logs
    const intakeLogs = await prisma.intakeLog.findMany({
      where: { userId },
      include: {
        product: true,
      },
    })

    // From intakes
    for (const intake of intakeLogs) {
      productIds.add(intake.productId)
    }

    // Get full product data with nutrients
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(productIds) } },
      include: {
        nutrients: true,
      },
    })

    // Build export data
    const exportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
      },
      products: products.map(p => ({
        upc: p.upc || undefined,
        name: p.name,
        brand: p.brand || undefined,
        servingSize: p.servingSize || undefined,
        servingUnit: p.servingUnit || undefined,
        imageUrl: p.imageUrl || undefined,
        nutrients: p.nutrients.map(n => ({
          name: n.name,
          amount: n.amount,
          unit: n.unit,
          dailyValuePercent: n.dailyValuePercent || undefined,
        })),
      })),
      regimens: regimens.map(r => ({
        id: r.id,
        name: r.name,
        items: r.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          sortOrder: item.sortOrder,
          scheduleDays: item.scheduleDays,
        })),
      })),
      intakeLogs: intakeLogs.map(i => ({
        productId: i.productId,
        date: i.date.toISOString(),
        quantity: i.quantity,
      })),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export error:', error)
    return apiError('Failed to export data', 500)
  }
}
