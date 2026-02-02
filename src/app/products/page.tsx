'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { ProductData, NutrientData } from '@/types'

interface SavedProduct extends ProductData {
  id: string
  nutrients: NutrientData[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<SavedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will also delete all intake records for it.')) {
      return
    }

    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const exportData = () => {
    const csv = [
      ['Name', 'Brand', 'UPC', 'Serving Size', 'Nutrients'].join(','),
      ...products.map(p => [
        `"${p.name}"`,
        `"${p.brand || ''}"`,
        p.upc || '',
        p.servingSize ? `${p.servingSize} ${p.servingUnit || ''}` : '',
        `"${p.nutrients.map(n => `${n.name}: ${n.amount}${n.unit}`).join('; ')}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'supplements.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Saved Products ({products.length})
        </h1>
        <button
          onClick={exportData}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Export CSV
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No products saved yet. Visit the &quot;Add Supplement&quot; page to add products.
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow">
              <div className="p-4">
                <ProductCard
                  product={product}
                  onRemove={handleDelete}
                  showActions
                />
              </div>
              <div className="border-t">
                <button
                  onClick={() =>
                    setExpandedProduct(
                      expandedProduct === product.id ? null : product.id
                    )
                  }
                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                >
                  {expandedProduct === product.id ? '▼' : '▶'} Nutrient Details (
                  {product.nutrients.length})
                </button>
                {expandedProduct === product.id && (
                  <div className="px-4 pb-4">
                    {product.nutrients.length === 0 ? (
                      <p className="text-gray-400 text-sm">No nutrient data</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {product.nutrients.map(nutrient => (
                          <div
                            key={nutrient.name}
                            className="bg-gray-50 rounded p-2 text-sm"
                          >
                            <span className="font-medium">{nutrient.name}</span>
                            <br />
                            <span className="text-gray-600">
                              {nutrient.amount} {nutrient.unit}
                              {nutrient.dailyValuePercent && (
                                <span className="text-gray-400 ml-1">
                                  ({nutrient.dailyValuePercent}% DV)
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
