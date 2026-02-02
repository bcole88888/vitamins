'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { AggregatedNutrient } from '@/types'

interface NutrientChartProps {
  nutrients: AggregatedNutrient[]
  height?: number
}

export function NutrientChart({ nutrients, height = 300 }: NutrientChartProps) {
  // Only show nutrients with RDI data
  const chartData = nutrients
    .filter(n => n.rdiPercent !== undefined)
    .map(n => ({
      name: n.name.replace('Vitamin ', 'Vit '),
      percent: Math.min(n.rdiPercent!, 200),
      actualPercent: n.rdiPercent!,
    }))
    .sort((a, b) => b.actualPercent - a.actualPercent)
    .slice(0, 12)

  const getBarColor = (percent: number) => {
    if (percent > 150) return '#f97316' // orange
    if (percent < 25) return '#9ca3af' // gray
    if (percent >= 50 && percent <= 150) return '#22c55e' // green
    return '#3b82f6' // blue
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 20 }}>
          <XAxis
            type="number"
            domain={[0, 200]}
            tickFormatter={v => `${v}%`}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, _name, props) => {
              const payload = props?.payload as { actualPercent?: number } | undefined
              const percent = payload?.actualPercent ?? value
              return [`${Number(percent).toFixed(0)}%`, 'Daily Value']
            }}
          />
          <ReferenceLine x={100} stroke="#666" strokeDasharray="3 3" />
          <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.actualPercent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
