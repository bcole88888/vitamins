'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { UserSelector } from '@/components/UserSelector'
import { ProductData } from '@/types'
import { useRouter } from 'next/navigation'

interface SavedProduct extends ProductData {
  id: string
}

export default function AddSupplementPage() {
  const router = useRouter()
  const [upc, setUpc] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [lookupResult, setLookupResult] = useState<ProductData | null>(null)
  const [searchResults, setSearchResults] = useState<ProductData[]>([])
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load saved products
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setSavedProducts)
      .catch(console.error)
  }, [])

  // Set default user
  useEffect(() => {
    if (!selectedUserId) {
      fetch('/api/users')
        .then(res => res.json())
        .then(users => {
          if (users.length > 0) {
            setSelectedUserId(users[0].id)
          }
        })
        .catch(console.error)
    }
  }, [selectedUserId])

  const handleLookup = async () => {
    if (!upc.trim()) return

    setLoading(true)
    setError('')
    setLookupResult(null)

    try {
      const res = await fetch(`/api/lookup/${encodeURIComponent(upc.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Product not found')
        return
      }

      setLookupResult(data.product)
    } catch (err) {
      setError('Failed to lookup product')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    setSearchResults([])

    try {
      const res = await fetch(`/api/lookup/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Search failed')
        return
      }

      setSearchResults(data.products || [])
    } catch (err) {
      setError('Failed to search products')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async (product: ProductData) => {
    if (!selectedUserId) {
      setError('Please select a user')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // First, save the product to our database
      const productRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      const savedProduct = await productRes.json()

      if (!productRes.ok) {
        setError(savedProduct.error || 'Failed to save product')
        return
      }

      // Then log the intake
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          productId: savedProduct.id,
          quantity,
        }),
      })

      if (!intakeRes.ok) {
        const intakeData = await intakeRes.json()
        setError(intakeData.error || 'Failed to log intake')
        return
      }

      setSuccess(`Logged ${quantity}x ${product.name}`)
      setLookupResult(null)
      setUpc('')
      setQuantity(1)

      // Refresh saved products
      const productsRes = await fetch('/api/products')
      setSavedProducts(await productsRes.json())
    } catch (err) {
      setError('Failed to add product')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogSavedProduct = async (productId: string, qty: number) => {
    if (!selectedUserId) {
      setError('Please select a user')
      return
    }

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          productId,
          quantity: qty,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to log intake')
        return
      }

      const product = savedProducts.find(p => p.id === productId)
      setSuccess(`Logged ${qty}x ${product?.name || 'product'}`)
    } catch (err) {
      setError('Failed to log intake')
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Add Supplement</h1>
        <UserSelector
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
          showAll={false}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
          <button
            onClick={() => router.push('/')}
            className="ml-4 underline"
          >
            View Dashboard
          </button>
        </div>
      )}

      {/* UPC Lookup */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Lookup by UPC / Barcode</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={upc}
            onChange={e => setUpc(e.target.value)}
            placeholder="Enter UPC (e.g., 0071421910118)"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>

        {lookupResult && (
          <div className="mt-4 space-y-4">
            <ProductCard product={lookupResult} showActions={false} />
            {lookupResult.nutrients.length === 0 && (
              <p className="text-orange-600 text-sm">
                Note: No nutrient data found for this product. You can still add it, but nutrient tracking won&apos;t work.
              </p>
            )}
            <div className="flex items-center gap-4">
              <label className="font-medium">Quantity:</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-20 px-3 py-2 border rounded"
              />
              <button
                onClick={() => handleAddProduct(lookupResult)}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Add & Log Intake
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Search by Name</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for vitamins, supplements..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((product, i) => (
              <div
                key={product.upc || i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => product.upc && setUpc(product.upc)}
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  {product.brand && (
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  )}
                </div>
                <span className="text-blue-600 text-sm">Click to lookup →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previously Added Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Quick Add from Saved Products
        </h2>
        {savedProducts.length === 0 ? (
          <p className="text-gray-500">
            No saved products yet. Add a product using UPC lookup above.
          </p>
        ) : (
          <div className="space-y-3">
            {savedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleLogSavedProduct}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
