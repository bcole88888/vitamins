'use client'

import { AggregatedNutrient } from '@/types'
import { formatAmount } from '@/lib/utils'

interface NutrientBarProps {
  nutrient: AggregatedNutrient
  showSources?: boolean
}

export function NutrientBar({ nutrient, showSources = false }: NutrientBarProps) {
  const percent = nutrient.rdiPercent ?? 0
  const isHigh = percent > 150
  const isLow = percent < 25 && nutrient.rdiAmount
  const isGood = percent >= 50 && percent <= 150

  const barColor = isHigh
    ? 'bg-orange-500'
    : isLow
    ? 'bg-gray-300'
    : isGood
    ? 'bg-green-500'
    : 'bg-blue-500'

  const barWidth = Math.min(percent, 200)

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-800">{nutrient.name}</span>
        <span className="text-sm text-gray-600">
          {formatAmount(nutrient.totalAmount, nutrient.unit)}
          {nutrient.rdiPercent !== undefined && (
            <span className={`ml-2 ${isHigh ? 'text-orange-600' : isLow ? 'text-gray-500' : 'text-green-600'}`}>
              ({percent.toFixed(0)}% DV)
            </span>
          )}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${barWidth / 2}%` }}
        />
      </div>
      {showSources && nutrient.sources.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          From: {nutrient.sources.map(s => `${s.productName} (${formatAmount(s.amount, nutrient.unit)})`).join(', ')}
        </div>
      )}
    </div>
  )
}
