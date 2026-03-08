'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DaySchedulePicker } from './DaySchedulePicker'
import { ALL_DAYS } from '@/lib/schedule'

interface Product {
  id: string
  name: string
  brand?: string | null
}

interface AddToRegimenModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onAdd: (productId: string, quantity: number, scheduleDays: string, timeOfDay: string) => void
}

export function AddToRegimenModal({
  isOpen,
  onClose,
  products,
  onAdd,
}: AddToRegimenModalProps) {
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [scheduleDays, setScheduleDays] = useState(ALL_DAYS)
  const [timeOfDay, setTimeOfDay] = useState('ANYTIME')

  const modalRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProductId && quantity > 0) {
      onAdd(selectedProductId, quantity, scheduleDays, timeOfDay)
      setSelectedProductId('')
      setQuantity(1)
      setScheduleDays(ALL_DAYS)
      setTimeOfDay('ANYTIME')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Add Product to Regimen">
      <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Add Product to Regimen</h2>

        {products.length === 0 ? (
          <div className="text-gray-500 py-4">
            No products saved yet. Go to Products to add some.
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
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.brand && ` (${product.brand})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time of Day
              </label>
              <select
                value={timeOfDay}
                onChange={e => setTimeOfDay(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="ANYTIME">Anytime</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <DaySchedulePicker
                value={scheduleDays}
                onChange={setScheduleDays}
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

        {products.length === 0 && (
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
