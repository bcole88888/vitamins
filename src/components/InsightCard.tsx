'use client'

import { Insight } from '@/types'

interface InsightCardProps {
  insight: Insight
}

const iconMap: Record<string, string> = {
  warning: '!',
  info: 'i',
  success: '✓',
}

const colorMap: Record<string, string> = {
  warning: 'border-orange-300 bg-orange-50',
  info: 'border-blue-300 bg-blue-50',
  success: 'border-green-300 bg-green-50',
}

const iconColorMap: Record<string, string> = {
  warning: 'bg-orange-500 text-white',
  info: 'bg-blue-500 text-white',
  success: 'bg-green-500 text-white',
}

// Category-specific styling overrides
const categoryColorMap: Record<string, string> = {
  interaction: 'border-purple-300 bg-purple-50',
}

const categoryIconColorMap: Record<string, string> = {
  interaction: 'bg-purple-500 text-white',
}

const categoryIconMap: Record<string, string> = {
  interaction: '↔',
}

export function InsightCard({ insight }: InsightCardProps) {
  // Use category-specific styling for interactions, otherwise use type-based styling
  const bgColor = categoryColorMap[insight.category] || colorMap[insight.type]
  const iconBgColor = categoryIconColorMap[insight.category] || iconColorMap[insight.type]
  const icon = categoryIconMap[insight.category] || iconMap[insight.type]

  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="flex gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${iconBgColor}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{insight.message}</h4>
          {insight.details && (
            <p className="mt-1 text-sm text-gray-600">{insight.details}</p>
          )}
        </div>
      </div>
    </div>
  )
}
