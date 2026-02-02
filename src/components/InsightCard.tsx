'use client'

import { Insight } from '@/types'

interface InsightCardProps {
  insight: Insight
}

const iconMap = {
  warning: '!',
  info: 'i',
  success: '✓',
}

const colorMap = {
  warning: 'border-orange-300 bg-orange-50',
  info: 'border-blue-300 bg-blue-50',
  success: 'border-green-300 bg-green-50',
}

const iconColorMap = {
  warning: 'bg-orange-500 text-white',
  info: 'bg-blue-500 text-white',
  success: 'bg-green-500 text-white',
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${colorMap[insight.type]}`}>
      <div className="flex gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${iconColorMap[insight.type]}`}>
          {iconMap[insight.type]}
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
