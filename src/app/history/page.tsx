'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserSelector } from '@/components/UserSelector'
import { IntakeList } from '@/components/IntakeList'
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

interface GroupedIntakes {
  [date: string]: Intake[]
}

export default function HistoryPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return formatDate(d)
  })
  const [endDate, setEndDate] = useState(formatDate(new Date()))
  const [groupedIntakes, setGroupedIntakes] = useState<GroupedIntakes>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const userParam = selectedUserId ? `&userId=${selectedUserId}` : ''
      const res = await fetch(
        `/api/intake?startDate=${startDate}&endDate=${endDate}${userParam}`
      )
      const intakes: Intake[] = await res.json()

      // Group by date
      const grouped: GroupedIntakes = {}
      for (const intake of intakes) {
        const date = formatDate(intake.date)
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(intake)
      }

      setGroupedIntakes(grouped)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedUserId])

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

  const setPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(formatDate(start))
    setEndDate(formatDate(end))
  }

  const sortedDates = Object.keys(groupedIntakes).sort((a, b) =>
    b.localeCompare(a)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <UserSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPreset(7)}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
            >
              7 days
            </button>
            <button
              onClick={() => setPreset(14)}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
            >
              14 days
            </button>
            <button
              onClick={() => setPreset(30)}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
            >
              30 days
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1 border rounded"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1 border rounded"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No intake records found for this period.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                {formatDateDisplay(date)}
                <span className="text-gray-400 font-normal ml-2">
                  ({groupedIntakes[date].length} items)
                </span>
              </h2>
              <IntakeList
                intakes={groupedIntakes[date]}
                onDelete={handleDeleteIntake}
                showUser={selectedUserId === null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
