'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserSelector } from '@/components/UserSelector'
import { NutrientBar } from '@/components/NutrientBar'
import { IntakeList } from '@/components/IntakeList'
import { NutrientChart } from '@/components/Charts/NutrientChart'
import { AggregatedNutrient } from '@/types'
import { formatDate, formatDateDisplay } from '@/lib/utils'

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

export default function Dashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [date, setDate] = useState(formatDate(new Date()))
  const [nutrients, setNutrients] = useState<AggregatedNutrient[]>([])
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const userParam = selectedUserId ? `&userId=${selectedUserId}` : ''

      const [nutrientsRes, intakesRes] = await Promise.all([
        fetch(`/api/nutrients?date=${date}${userParam}`),
        fetch(`/api/intake?date=${date}${userParam}`),
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

  const goToday = () => setDate(formatDate(new Date()))
  const goPrev = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(formatDate(d))
  }
  const goNext = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(formatDate(d))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Summary</h1>
          <p className="text-gray-600">{formatDateDisplay(date)}</p>
        </div>
        <UserSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={goPrev}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          ← Prev
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Today
        </button>
        <button
          onClick={goNext}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Next →
        </button>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="ml-4 px-3 py-1 border rounded"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nutrient Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Nutrient Levels</h2>
            {nutrients.length > 0 ? (
              <NutrientChart nutrients={nutrients} height={350} />
            ) : (
              <p className="text-gray-500 text-center py-8">
                No nutrient data for this day.
              </p>
            )}
          </div>

          {/* Intake List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Supplements Taken ({intakes.length})
            </h2>
            <IntakeList
              intakes={intakes}
              onDelete={handleDeleteIntake}
              showUser={selectedUserId === null}
            />
          </div>

          {/* Detailed Nutrients */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Nutrient Details</h2>
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
              <p className="text-gray-500 text-center py-8">
                No supplements logged for this day. Visit the &quot;Add Supplement&quot; page to log your first supplement.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
