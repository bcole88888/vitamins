'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserSelector } from '@/components/UserSelector'
import { PeriodSelector } from '@/components/PeriodSelector'
import { NutrientSelector } from '@/components/NutrientSelector'
import { TrendLineChart } from '@/components/Charts/TrendLineChart'
import { TrendDataPoint } from '@/types'
import { formatAmount } from '@/lib/utils'

interface TrendSummary {
  name: string
  unit: string
  average: number
  min: number
  max: number
  daysWithIntake: number
  averageRdiPercent?: number
}

interface TrendData {
  period: number
  startDate: string
  endDate: string
  data: TrendDataPoint[]
  summary: TrendSummary[]
}

export default function TrendsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [period, setPeriod] = useState(7)
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [selectedNutrients, setSelectedNutrients] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTrends = useCallback(async () => {
    if (!selectedUserId) {
      setTrendData(null)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/trends?userId=${selectedUserId}&period=${period}`)
      const data = await res.json()
      setTrendData(data)

      // Auto-select top nutrients if none selected
      if (selectedNutrients.length === 0 && data.summary?.length > 0) {
        const topNutrients = data.summary
          .filter((s: TrendSummary) => s.daysWithIntake > 0)
          .slice(0, 3)
          .map((s: TrendSummary) => s.name)
        setSelectedNutrients(topNutrients)
      }
    } catch (error) {
      console.error('Error fetching trends:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedUserId, period])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  const availableNutrients = trendData?.summary
    ?.filter(s => s.daysWithIntake > 0)
    ?.map(s => s.name) || []

  const selectedSummaries = trendData?.summary?.filter(s =>
    selectedNutrients.includes(s.name)
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrient Trends</h1>
          <p className="text-gray-600">Track your supplement intake over time</p>
        </div>
        <UserSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
      </div>

      <div className="flex items-center justify-between">
        <PeriodSelector value={period} onChange={setPeriod} />
        {trendData && (
          <div className="text-sm text-gray-500">
            {trendData.startDate} to {trendData.endDate}
          </div>
        )}
      </div>

      {!selectedUserId ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please select a user to view nutrient trends.
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : !trendData || availableNutrients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No supplement data available for the selected period. Log some supplements to see trends.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Value % Over Time</h2>
            <TrendLineChart
              data={trendData.data}
              selectedNutrients={selectedNutrients}
              height={350}
            />
          </div>

          {/* Nutrient Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <NutrientSelector
              availableNutrients={availableNutrients}
              selectedNutrients={selectedNutrients}
              onChange={setSelectedNutrients}
              maxSelection={5}
            />
          </div>

          {/* Summary Stats */}
          {selectedSummaries.length > 0 && (
            <div className="lg:col-span-4 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Summary Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {selectedSummaries.map(summary => (
                  <div key={summary.name} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{summary.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average:</span>
                        <span className="font-medium">
                          {formatAmount(summary.average, summary.unit)}
                          {summary.averageRdiPercent && (
                            <span className="text-gray-400 ml-1">
                              ({summary.averageRdiPercent.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Min:</span>
                        <span>{formatAmount(summary.min, summary.unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max:</span>
                        <span>{formatAmount(summary.max, summary.unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Days taken:</span>
                        <span>{summary.daysWithIntake}/{period}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
