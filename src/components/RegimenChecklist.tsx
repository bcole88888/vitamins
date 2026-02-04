'use client'

import { RegimenChecklistItem } from '@/types'
import { getScheduleLabel, ALL_DAYS } from '@/lib/schedule'

interface RegimenChecklistProps {
  items: RegimenChecklistItem[]
  date: string
  userId: string
  onToggle: (productId: string, checked: boolean, quantity: number) => void
  onLogAll: () => void
  loading?: boolean
  showScheduleBadge?: boolean
}

export function RegimenChecklist({
  items,
  onToggle,
  onLogAll,
  loading = false,
  showScheduleBadge = false,
}: RegimenChecklistProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items in your regimen yet. Add products below to get started.
      </div>
    )
  }

  const uncheckedCount = items.filter(item => !item.isLogged).length

  return (
    <div className="space-y-3">
      {items.map(item => (
        <label
          key={item.id}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            item.isLogged
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="checkbox"
            checked={item.isLogged}
            onChange={e => onToggle(item.productId, e.target.checked, item.quantity)}
            disabled={loading}
            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-800">
              {item.productName}
              {item.quantity !== 1 && (
                <span className="text-gray-500 ml-1">x{item.quantity}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.productBrand && (
                <span className="text-sm text-gray-500">{item.productBrand}</span>
              )}
              {showScheduleBadge && item.scheduleDays !== ALL_DAYS && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {getScheduleLabel(item.scheduleDays)}
                </span>
              )}
            </div>
          </div>
          {item.servingUnit && (
            <div className="text-sm text-gray-400">
              {item.quantity} {item.servingUnit}
            </div>
          )}
        </label>
      ))}

      {uncheckedCount > 0 && (
        <button
          onClick={onLogAll}
          disabled={loading}
          className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Log All Unchecked ({uncheckedCount})
        </button>
      )}
    </div>
  )
}
