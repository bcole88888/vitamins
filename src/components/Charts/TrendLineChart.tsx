'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { TrendDataPoint } from '@/types'

interface TrendLineChartProps {
  data: TrendDataPoint[]
  selectedNutrients: string[]
  height?: number
  showRdiLine?: boolean
}

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
]

export function TrendLineChart({
  data,
  selectedNutrients,
  height = 300,
  showRdiLine = true,
}: TrendLineChartProps) {
  // Transform data for Recharts
  const chartData = data.map(point => {
    const entry: Record<string, string | number | undefined> = {
      date: point.date,
      dateLabel: new Date(point.date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }

    for (const nutrient of point.nutrients) {
      if (selectedNutrients.includes(nutrient.name)) {
        entry[nutrient.name] = nutrient.rdiPercent ?? 0
      }
    }

    return entry
  })

  // Fill in missing data points with 0
  for (const entry of chartData) {
    for (const nutrient of selectedNutrients) {
      if (entry[nutrient] === undefined) {
        entry[nutrient] = 0
      }
    }
  }

  if (selectedNutrients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select nutrients to view trends
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={v => `${v}%`}
            domain={[0, 'auto']}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(0)}%`, 'Daily Value']}
            labelFormatter={(label) => String(label)}
          />
          <Legend />
          {showRdiLine && (
            <ReferenceLine
              y={100}
              stroke="#666"
              strokeDasharray="3 3"
              label={{ value: '100% RDI', position: 'right', fontSize: 10 }}
            />
          )}
          {selectedNutrients.map((nutrient, index) => (
            <Line
              key={nutrient}
              type="monotone"
              dataKey={nutrient}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
