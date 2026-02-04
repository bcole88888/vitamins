'use client'

interface PeriodSelectorProps {
  value: number
  onChange: (period: number) => void
}

const PERIODS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {PERIODS.map(period => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            value === period.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
