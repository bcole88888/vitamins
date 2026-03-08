'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { UserSelector } from '@/components/UserSelector'
import { NutrientBar } from '@/components/NutrientBar'
import { IntakeList } from '@/components/IntakeList'
import { NutrientChart } from '@/components/Charts/NutrientChart'
import { NotificationBanner } from '@/components/NotificationBanner'
import { AggregatedNutrient } from '@/types'
import { formatDateDisplay } from '@/lib/utils'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { useDateNav } from '@/hooks/useDateNav'

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

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="animate-shimmer h-5 w-32 rounded mb-4" />
      <div className="space-y-3">
        <div className="animate-shimmer h-3 w-full rounded" />
        <div className="animate-shimmer h-3 w-4/5 rounded" />
        <div className="animate-shimmer h-3 w-3/5 rounded" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { date, setDate, goToday, goPrev, goNext } = useDateNav()
  const [nutrients, setNutrients] = useState<AggregatedNutrient[]>([])
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const userParam = selectedUserId ? `&userId=${selectedUserId}` : ''

      const [nutrientsRes, intakesRes] = await Promise.all([
        fetchWithTimeout(`/api/nutrients?date=${date}${userParam}`),
        fetchWithTimeout(`/api/intake?date=${date}${userParam}`),
      ])

      const nutrientsData = await nutrientsRes.json()
      const intakesData = await intakesRes.json()

      setNutrients(nutrientsData.nutrients || [])
      setIntakes(intakesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [date, selectedUserId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteIntake = async (id: string) => {
    try {
      await fetch(`/api/intake?id=${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting intake:', error)
    }
  }

  const stats = useMemo(() => {
    const withRdi = nutrients.filter(n => n.rdiPercent !== undefined)
    const goodCount = withRdi.filter(n => n.rdiPercent! >= 50 && n.rdiPercent! <= 150).length
    return {
      tracked: nutrients.length,
      intakeCount: intakes.length,
      goodCount,
      goodPct: withRdi.length > 0 ? Math.round((goodCount / withRdi.length) * 100) : 0,
    }
  }, [nutrients, intakes])

  return (
    <div className="space-y-8">
      <NotificationBanner userId={selectedUserId} />

      {/* Header */}
      <div className="animate-fade-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Daily Summary
            </h1>
            <p className="mt-1 text-lg" style={{ color: 'var(--accent)' }}>
              {formatDateDisplay(date)}
            </p>
          </div>
          <UserSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
        </div>
      </div>

      {/* Date Navigation */}
      <div className="animate-fade-slide-up delay-1 flex items-center gap-2">
        <button
          onClick={goPrev}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-warm)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-warm-strong)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-warm)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          Prev
        </button>
        <button
          onClick={goToday}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
          }}
        >
          Today
        </button>
        <button
          onClick={goNext}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-warm)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-warm-strong)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-warm)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          Next
        </button>
        <label className="sr-only" htmlFor="dashboard-date">Select date</label>
        <input
          id="dashboard-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="ml-3 px-4 py-2 rounded-full text-sm font-medium focus:outline-none focus:ring-1"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-warm)',
          }}
        />
      </div>

      {loading ? (
        /* Skeleton loading */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SkeletonCard className="xl:col-span-2" />
          <SkeletonCard />
          <SkeletonCard className="xl:col-span-3" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {nutrients.length > 0 && (
            <div className="animate-fade-slide-up delay-2 grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <div className="font-display text-2xl" style={{ color: 'var(--accent)' }}>
                  {stats.tracked}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Nutrients Tracked
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="font-display text-2xl" style={{ color: 'var(--accent)' }}>
                  {stats.intakeCount}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Supplements Taken
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="font-display text-2xl" style={{ color: 'var(--nutrient-good)' }}>
                  {stats.goodPct}%
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  At Optimal Levels
                </div>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Nutrient Chart */}
            <div className="animate-fade-slide-up delay-3 card p-6 xl:col-span-2">
              <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
                Nutrient Levels
              </h2>
              {nutrients.length > 0 ? (
                <NutrientChart nutrients={nutrients} height={380} />
              ) : (
                <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-center">
                    No nutrient data for this day.
                    <br />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Log a supplement to see your levels.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Intake List */}
            <div className="animate-fade-slide-up delay-4 card p-6">
              <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
                Supplements
                {intakes.length > 0 && (
                  <span
                    className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-body font-medium"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                  >
                    {intakes.length}
                  </span>
                )}
              </h2>
              <IntakeList
                intakes={intakes}
                onDelete={handleDeleteIntake}
                showUser={selectedUserId === null}
              />
            </div>

            {/* Detailed Nutrients */}
            <div className="animate-fade-slide-up delay-5 card p-6 xl:col-span-3">
              <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
                Nutrient Details
              </h2>
              {nutrients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {nutrients.map(nutrient => (
                    <NutrientBar
                      key={nutrient.name}
                      nutrient={nutrient}
                      showSources
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-center">
                    No supplements logged for this day.
                    <br />
                    <span className="text-sm">
                      Visit &ldquo;Add Supplement&rdquo; to log your first supplement.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
