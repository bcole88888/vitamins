'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserSelector } from '@/components/UserSelector'
import { RegimenChecklist } from '@/components/RegimenChecklist'
import { AddToRegimenModal } from '@/components/AddToRegimenModal'
import { RegimenChecklistItem, RegimenItem } from '@/types'
import { formatDate, formatDateDisplay } from '@/lib/utils'

interface Product {
  id: string
  name: string
  brand?: string | null
}

interface Regimen {
  id: string
  name: string
  items: RegimenItem[]
}

interface IntakeLog {
  id: string
  productId: string
}

export default function RegimenPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [date, setDate] = useState(formatDate(new Date()))
  const [regimen, setRegimen] = useState<Regimen | null>(null)
  const [intakeLogs, setIntakeLogs] = useState<IntakeLog[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<{ id: string; quantity: number } | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedUserId) {
      setRegimen(null)
      setIntakeLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [regimensRes, intakesRes, productsRes] = await Promise.all([
        fetch(`/api/regimen?userId=${selectedUserId}`),
        fetch(`/api/intake?userId=${selectedUserId}&date=${date}`),
        fetch('/api/products'),
      ])

      const regimensData = await regimensRes.json()
      const intakesData = await intakesRes.json()
      const productsData = await productsRes.json()

      setRegimen(regimensData[0] || null)
      setIntakeLogs(intakesData.map((i: { id: string; productId: string }) => ({
        id: i.id,
        productId: i.productId,
      })))
      setProducts(productsData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedUserId, date])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const ensureRegimen = async (): Promise<string | null> => {
    if (regimen) return regimen.id
    if (!selectedUserId) return null

    try {
      const res = await fetch('/api/regimen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })
      const newRegimen = await res.json()
      setRegimen(newRegimen)
      return newRegimen.id
    } catch (error) {
      console.error('Error creating regimen:', error)
      return null
    }
  }

  const handleToggle = async (productId: string, checked: boolean, quantity: number) => {
    if (!selectedUserId) return

    setToggling(true)
    try {
      await fetch('/api/regimen/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          date,
          items: [{ productId, checked, quantity }],
        }),
      })
      await fetchData()
    } catch (error) {
      console.error('Error toggling item:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleLogAll = async () => {
    if (!selectedUserId || !regimen) return

    const uncheckedItems = checklistItems.filter(item => !item.isLogged)
    if (uncheckedItems.length === 0) return

    setToggling(true)
    try {
      await fetch('/api/regimen/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          date,
          items: uncheckedItems.map(item => ({
            productId: item.productId,
            checked: true,
            quantity: item.quantity,
          })),
        }),
      })
      await fetchData()
    } catch (error) {
      console.error('Error logging all:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleAddProduct = async (productId: string, quantity: number) => {
    const regimenId = await ensureRegimen()
    if (!regimenId) return

    try {
      await fetch('/api/regimen/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regimenId, productId, quantity }),
      })
      await fetchData()
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await fetch(`/api/regimen/items?itemId=${itemId}`, { method: 'DELETE' })
      await fetchData()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await fetch('/api/regimen/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      })
      setEditingItem(null)
      await fetchData()
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const goToday = () => setDate(formatDate(new Date()))
  const goPrev = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(formatDate(d))
  }
  const goNext = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(formatDate(d))
  }

  const checklistItems: RegimenChecklistItem[] = regimen?.items.map(item => {
    const intake = intakeLogs.find(log => log.productId === item.productId)
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productBrand: item.product.brand ?? undefined,
      servingUnit: item.product.servingUnit ?? undefined,
      quantity: item.quantity,
      sortOrder: item.sortOrder,
      isLogged: !!intake,
      intakeLogId: intake?.id,
    }
  }) || []

  const existingProductIds = regimen?.items.map(item => item.productId) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Regimen</h1>
          <p className="text-gray-600">{formatDateDisplay(date)}</p>
        </div>
        <UserSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={goPrev}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Prev
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Today
        </button>
        <button
          onClick={goNext}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Next
        </button>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="ml-4 px-3 py-1 border rounded"
        />
      </div>

      {!selectedUserId ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please select a user to view and manage their regimen.
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Check-off */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Check-off</h2>
            <RegimenChecklist
              items={checklistItems}
              date={date}
              userId={selectedUserId}
              onToggle={handleToggle}
              onLogAll={handleLogAll}
              loading={toggling}
            />
          </div>

          {/* Manage Regimen */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Manage Regimen</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
              >
                + Add Product
              </button>
            </div>

            {checklistItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Your regimen is empty. Add products to create your daily routine.
              </div>
            ) : (
              <div className="space-y-2">
                {checklistItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {item.productName}
                      </div>
                      {item.productBrand && (
                        <div className="text-sm text-gray-500">{item.productBrand}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {editingItem?.id === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingItem.quantity}
                            onChange={e => setEditingItem({
                              ...editingItem,
                              quantity: Math.max(0.25, parseFloat(e.target.value) || 1),
                            })}
                            min="0.25"
                            step="0.25"
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.id, editingItem.quantity)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingItem({ id: item.id, quantity: item.quantity })}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            {item.quantity} {item.servingUnit || 'serving'}
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AddToRegimenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        products={products}
        existingProductIds={existingProductIds}
        onAdd={handleAddProduct}
      />
    </div>
  )
}
