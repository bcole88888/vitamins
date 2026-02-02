'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserSelector } from '@/components/UserSelector'
import { InsightCard } from '@/components/InsightCard'
import { NutrientChart } from '@/components/Charts/NutrientChart'
import { AggregatedNutrient, Insight } from '@/types'
import { generateInsights, formatDate } from '@/lib/utils'

export default function InsightsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [nutrients, setNutrients] = useState<AggregatedNutrient[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Get last 7 days of data
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)

      const userParam = selectedUserId ? `&userId=${selectedUserId}` : ''
      const res = await fetch(
        `/api/nutrients?startDate=${formatDate(start)}&endDate=${formatDate(end)}${userParam}`
      )
      const data = await res.json()

      // Average the nutrients over 7 days
      const avgNutrients: AggregatedNutrient[] = (data.nutrients || []).map(
        (n: AggregatedNutrient) => ({
          ...n,
          totalAmount: n.totalAmount / 7,
          rdiPercent: n.rdiPercent ? n.rdiPercent / 7 : undefined,
        })
      )

      setNutrients(avgNutrients)
      setInsights(generateInsights(avgNutrients))
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedUserId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const warningInsights = insights.filter(i => i.type === 'warning')
  const infoInsights = insights.filter(i => i.type === 'info')
  const successInsights = insights.filter(i => i.type === 'success')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600">Based on your last 7 days average intake</p>
        </div>
        <UserSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Disclaimer:</strong> These insights are for informational purposes only and
          do not constitute medical advice. Nutrient data comes from third-party databases
          and may not be complete or accurate. Always consult with a healthcare provider
          before making changes to your supplement regimen.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Analyzing your data...</div>
      ) : nutrients.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No intake data found for the past 7 days. Start logging supplements to see insights.
        </div>
      ) : (
        <>
          {/* Weekly Average Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">7-Day Average Nutrient Levels</h2>
            <NutrientChart nutrients={nutrients} height={400} />
          </div>

          {/* Warnings */}
          {warningInsights.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-orange-700">
                Attention Needed
              </h2>
              <div className="space-y-3">
                {warningInsights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          {infoInsights.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-blue-700">
                Things to Consider
              </h2>
              <div className="space-y-3">
                {infoInsights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {successInsights.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-green-700">
                Good News
              </h2>
              <div className="space-y-3">
                {successInsights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Nutrient Summary Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Nutrient Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Nutrient</th>
                    <th className="text-right py-2 px-3">Daily Avg</th>
                    <th className="text-right py-2 px-3">% Daily Value</th>
                    <th className="text-left py-2 px-3">Sources</th>
                  </tr>
                </thead>
                <tbody>
                  {nutrients.map(n => (
                    <tr key={n.name} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{n.name}</td>
                      <td className="text-right py-2 px-3">
                        {n.totalAmount.toFixed(1)} {n.unit}
                      </td>
                      <td className="text-right py-2 px-3">
                        {n.rdiPercent !== undefined ? (
                          <span
                            className={
                              n.rdiPercent > 150
                                ? 'text-orange-600'
                                : n.rdiPercent < 25
                                ? 'text-gray-400'
                                : 'text-green-600'
                            }
                          >
                            {n.rdiPercent.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {n.sources.slice(0, 3).map(s => s.productName).join(', ')}
                        {n.sources.length > 3 && ` +${n.sources.length - 3} more`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
