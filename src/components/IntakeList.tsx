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
      <div className="flex items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
        No supplements logged for this period.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {intakes.map(intake => (
        <div
          key={intake.id}
          className="group flex items-center justify-between rounded-lg p-3 transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-warm)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {intake.product.name}
              </span>
              {intake.quantity !== 1 && (
                <span
                  className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                >
                  x{intake.quantity}
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {intake.product.brand && <span>{intake.product.brand} &middot; </span>}
              {showUser && <span>{intake.user.name} &middot; </span>}
              {formatDateDisplay(intake.date)}
            </div>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(intake.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-xs px-2 py-1 rounded"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-muted)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              aria-label={`Remove ${intake.product.name}`}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
