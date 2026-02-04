'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { ProductData, NutrientData } from '@/types'

interface SavedProduct extends ProductData {
  id: string
  nutrients: NutrientData[]
}

interface EditableNutrient {
  name: string
  amount: string
  unit: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<SavedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editNutrients, setEditNutrients] = useState<EditableNutrient[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const json = await res.json()
      setProducts(json.data || [])
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

  const startEditing = (product: SavedProduct) => {
    setEditingProduct(product.id)
    setExpandedProduct(product.id)
    setEditNutrients(
      product.nutrients.map(n => ({
        name: n.name,
        amount: String(n.amount),
        unit: n.unit,
      }))
    )
  }

  const cancelEditing = () => {
    setEditingProduct(null)
    setEditNutrients([])
  }

  const addNutrient = () => {
    setEditNutrients([...editNutrients, { name: '', amount: '', unit: 'mg' }])
  }

  const updateNutrient = (index: number, field: string, value: string) => {
    const updated = [...editNutrients]
    updated[index] = { ...updated[index], [field]: value }
    setEditNutrients(updated)
  }

  const removeNutrient = (index: number) => {
    setEditNutrients(editNutrients.filter((_, i) => i !== index))
  }

  const saveNutrients = async (productId: string) => {
    setSaving(true)
    try {
      const nutrients = editNutrients
        .filter(n => n.name.trim() && n.amount.trim())
        .map(n => ({
          name: n.name.trim(),
          amount: parseFloat(n.amount) || 0,
          unit: n.unit,
        }))

      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, nutrients }),
      })

      if (res.ok) {
        const updatedProduct = await res.json()
        setProducts(products.map(p => (p.id === productId ? updatedProduct : p)))
        setEditingProduct(null)
        setEditNutrients([])
      }
    } catch (error) {
      console.error('Error saving nutrients:', error)
    } finally {
      setSaving(false)
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
                <div className="flex items-center justify-between px-4 py-2">
                  <button
                    onClick={() =>
                      setExpandedProduct(
                        expandedProduct === product.id ? null : product.id
                      )
                    }
                    className="text-left text-sm text-gray-600 hover:text-gray-900"
                  >
                    {expandedProduct === product.id ? '▼' : '▶'} Nutrient Details (
                    {product.nutrients.length})
                  </button>
                  {editingProduct !== product.id && (
                    <button
                      onClick={() => startEditing(product)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit Nutrients
                    </button>
                  )}
                </div>
                {expandedProduct === product.id && (
                  <div className="px-4 pb-4">
                    {editingProduct === product.id ? (
                      <div className="space-y-3">
                        {editNutrients.map((nutrient, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={nutrient.name}
                              onChange={e => updateNutrient(index, 'name', e.target.value)}
                              placeholder="Nutrient name"
                              className="flex-1 px-3 py-2 border rounded text-sm"
                            />
                            <input
                              type="number"
                              value={nutrient.amount}
                              onChange={e => updateNutrient(index, 'amount', e.target.value)}
                              placeholder="Amount"
                              className="w-24 px-3 py-2 border rounded text-sm"
                            />
                            <select
                              value={nutrient.unit}
                              onChange={e => updateNutrient(index, 'unit', e.target.value)}
                              className="w-20 px-2 py-2 border rounded text-sm"
                            >
                              <option value="mcg">mcg</option>
                              <option value="mg">mg</option>
                              <option value="g">g</option>
                              <option value="IU">IU</option>
                              <option value="%">%DV</option>
                            </select>
                            <button
                              onClick={() => removeNutrient(index)}
                              className="text-red-500 hover:text-red-700 px-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={addNutrient}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            + Add Nutrient
                          </button>
                          <div className="flex-1" />
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveNutrients(product.id)}
                            disabled={saving}
                            className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : product.nutrients.length === 0 ? (
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
