'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NotificationBannerProps {
  userId: string | null
}

interface PendingItem {
  id: string
  productName: string
  productBrand?: string | null
}

export function NotificationBanner({ userId }: NotificationBannerProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setPendingCount(0)
      setPendingItems([])
      setLoading(false)
      return
    }

    const checkPending = async () => {
      try {
        const res = await fetch(`/api/notifications/check?userId=${userId}`)
        const data = await res.json()
        setPendingCount(data.pendingCount || 0)
        setPendingItems(data.pendingItems || [])
      } catch (error) {
        console.error('Error checking pending items:', error)
      } finally {
        setLoading(false)
      }
    }

    checkPending()
    // Reset dismissed state when userId changes
    setDismissed(false)
  }, [userId])

  if (loading || dismissed || !userId || pendingCount === 0) {
    return null
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{pendingCount}</span>
          </div>
          <div>
            <h3 className="font-medium text-amber-900">
              {pendingCount} supplement{pendingCount > 1 ? 's' : ''} to take today
            </h3>
            <p className="text-sm text-amber-700 mt-0.5">
              {pendingItems.slice(0, 3).map(item => item.productName).join(', ')}
              {pendingItems.length > 3 && ` and ${pendingItems.length - 3} more`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/regimen"
            className="text-sm font-medium text-amber-700 hover:text-amber-900 px-3 py-1 rounded bg-amber-100 hover:bg-amber-200 transition-colors"
          >
            Go to Regimen
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-500 hover:text-amber-700 p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
