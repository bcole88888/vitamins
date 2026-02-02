'use client'

import { formatDateDisplay } from '@/lib/utils'

interface Intake {
  id: string
  quantity: number
  date: string
  product: {
    id: string
    name: string
    brand?: string | null
  }
  user: {
    id: string
    name: string
  }
}

interface IntakeListProps {
  intakes: Intake[]
  onDelete?: (id: string) => void
  showUser?: boolean
}

export function IntakeList({ intakes, onDelete, showUser = false }: IntakeListProps) {
  if (intakes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No supplements logged for this period.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {intakes.map(intake => (
        <div
          key={intake.id}
          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
        >
          <div>
            <div className="font-medium text-gray-800">
              {intake.product.name}
              {intake.quantity !== 1 && (
                <span className="text-gray-500 ml-1">x{intake.quantity}</span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {intake.product.brand && <span>{intake.product.brand} - </span>}
              {showUser && <span>{intake.user.name} - </span>}
              {formatDateDisplay(intake.date)}
            </div>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(intake.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
