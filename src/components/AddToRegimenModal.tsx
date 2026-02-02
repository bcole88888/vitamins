'use client'

import { useState } from 'react'

interface Product {
  id: string
  name: string
  brand?: string | null
}

interface AddToRegimenModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  existingProductIds: string[]
  onAdd: (productId: string, quantity: number) => void
}

export function AddToRegimenModal({
  isOpen,
  onClose,
  products,
  existingProductIds,
  onAdd,
}: AddToRegimenModalProps) {
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)

  if (!isOpen) return null

  const availableProducts = products.filter(p => !existingProductIds.includes(p.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProductId && quantity > 0) {
      onAdd(selectedProductId, quantity)
      setSelectedProductId('')
      setQuantity(1)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Add Product to Regimen</h2>

        {availableProducts.length === 0 ? (
          <div className="text-gray-500 py-4">
            All saved products are already in your regimen.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a product...</option>
                {availableProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.brand && ` (${product.brand})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (servings)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(0.25, parseFloat(e.target.value) || 1))}
                min="0.25"
                step="0.25"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedProductId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add to Regimen
              </button>
            </div>
          </form>
        )}

        {availableProducts.length === 0 && (
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}
