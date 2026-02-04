'use client'

import { DAY_NAMES, parseScheduleDays, formatScheduleDays, ALL_DAYS, WEEKDAYS } from '@/lib/schedule'

interface DaySchedulePickerProps {
  value: string
  onChange: (scheduleDays: string) => void
  disabled?: boolean
}

export function DaySchedulePicker({ value, onChange, disabled = false }: DaySchedulePickerProps) {
  const selectedDays = parseScheduleDays(value)

  const toggleDay = (day: number) => {
    if (disabled) return
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b)
    onChange(formatScheduleDays(newDays))
  }

  const setAllDays = () => {
    if (disabled) return
    onChange(ALL_DAYS)
  }

  const setWeekdays = () => {
    if (disabled) return
    onChange(WEEKDAYS)
  }

  const isAllDays = selectedDays.length === 7
  const isWeekdays = selectedDays.length === 5 &&
    [1, 2, 3, 4, 5].every(d => selectedDays.includes(d))

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {DAY_NAMES.map((name, index) => (
          <button
            key={index}
            type="button"
            onClick={() => toggleDay(index)}
            disabled={disabled}
            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
              selectedDays.includes(index)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {name.charAt(0)}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={setAllDays}
          disabled={disabled}
          className={`text-xs px-2 py-1 rounded ${
            isAllDays
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Every day
        </button>
        <button
          type="button"
          onClick={setWeekdays}
          disabled={disabled}
          className={`text-xs px-2 py-1 rounded ${
            isWeekdays
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Weekdays
        </button>
      </div>
    </div>
  )
}
