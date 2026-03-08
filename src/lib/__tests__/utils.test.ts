import {
  formatDate,
  utcDayRange,
  utcDateRange,
  utcToday,
  formatDateDisplay,
  formatAmount,
  generateInsights,
} from '../utils'
import { AggregatedNutrient } from '@/types'

describe('formatDate', () => {
  it('formats Date to YYYY-MM-DD', () => {
    const d = new Date('2025-03-15T12:00:00Z')
    expect(formatDate(d)).toBe('2025-03-15')
  })

  it('formats date string to YYYY-MM-DD', () => {
    expect(formatDate('2025-06-01T00:00:00Z')).toBe('2025-06-01')
  })
})

describe('utcDayRange', () => {
  it('returns start and end of day in UTC', () => {
    const { gte, lte } = utcDayRange('2025-01-15')
    expect(gte.toISOString()).toBe('2025-01-15T00:00:00.000Z')
    expect(lte.toISOString()).toBe('2025-01-15T23:59:59.999Z')
  })
})

describe('utcDateRange', () => {
  it('returns range across multiple days', () => {
    const { gte, lte } = utcDateRange('2025-01-10', '2025-01-15')
    expect(gte.toISOString()).toBe('2025-01-10T00:00:00.000Z')
    expect(lte.toISOString()).toBe('2025-01-15T23:59:59.999Z')
  })
})

describe('utcToday', () => {
  it('returns YYYY-MM-DD format', () => {
    const today = utcToday()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatDateDisplay', () => {
  it('formats to readable date', () => {
    const result = formatDateDisplay('2025-01-15T12:00:00Z')
    expect(result).toContain('Jan')
    expect(result).toContain('15')
  })
})

describe('formatAmount', () => {
  it('converts large mcg to mg', () => {
    expect(formatAmount(1000, 'mcg')).toBe('1.0 mg')
    expect(formatAmount(2500, 'mcg')).toBe('2.5 mg')
  })

  it('converts large mg to g', () => {
    expect(formatAmount(1000, 'mg')).toBe('1.0 g')
  })

  it('converts tiny amounts down', () => {
    expect(formatAmount(0.005, 'mg')).toBe('5.0 mcg')
  })

  it('shows normal amounts with appropriate precision', () => {
    expect(formatAmount(0.5, 'mg')).toBe('0.50 mg')
    expect(formatAmount(25, 'mg')).toBe('25.0 mg')
  })
})

describe('generateInsights', () => {
  const makeNutrient = (
    name: string,
    totalAmount: number,
    unit: string,
    rdiPercent?: number,
    sources: { productName: string; amount: number }[] = [{ productName: 'Test', amount: totalAmount }]
  ): AggregatedNutrient => ({
    name,
    totalAmount,
    unit,
    rdiPercent,
    sources,
  })

  it('flags nutrients above upper limit', () => {
    const nutrients = [makeNutrient('Vitamin D', 150, 'mcg', 750)]
    const insights = generateInsights(nutrients)
    const warnings = insights.filter(i => i.type === 'warning' && i.category === 'excess')
    expect(warnings.length).toBeGreaterThanOrEqual(1)
    expect(warnings[0].nutrient).toBe('Vitamin D')
  })

  it('flags missing key nutrients', () => {
    const nutrients: AggregatedNutrient[] = []
    const insights = generateInsights(nutrients)
    const deficiencies = insights.filter(i => i.category === 'deficiency')
    expect(deficiencies.length).toBeGreaterThan(0)
    const names = deficiencies.map(d => d.nutrient)
    expect(names).toContain('Vitamin D')
    expect(names).toContain('Vitamin B12')
  })

  it('flags redundancy for 3+ sources', () => {
    const nutrients = [
      makeNutrient('Vitamin C', 90, 'mg', 100, [
        { productName: 'A', amount: 30 },
        { productName: 'B', amount: 30 },
        { productName: 'C', amount: 30 },
      ]),
    ]
    const insights = generateInsights(nutrients)
    const redundancy = insights.filter(i => i.category === 'redundancy')
    expect(redundancy.length).toBe(1)
  })

  it('reports good coverage when 5+ nutrients are in range', () => {
    const nutrients = [
      makeNutrient('Vitamin A', 900, 'mcg', 100),
      makeNutrient('Vitamin C', 90, 'mg', 100),
      makeNutrient('Vitamin D', 20, 'mcg', 100),
      makeNutrient('Vitamin E', 15, 'mg', 100),
      makeNutrient('Iron', 18, 'mg', 100),
      makeNutrient('Calcium', 1000, 'mg', 100),
      makeNutrient('Magnesium', 420, 'mg', 100),
    ]
    const insights = generateInsights(nutrients)
    const good = insights.filter(i => i.category === 'good')
    expect(good.length).toBe(1)
  })

  it('checks interactions per time of day', () => {
    const nutrients = [
      makeNutrient('Calcium', 1000, 'mg', 100),
      makeNutrient('Iron', 18, 'mg', 100),
    ]
    const timeOfDayNutrients = [
      { timeOfDay: 'MORNING', nutrients: ['Calcium', 'Iron'] },
    ]
    const insights = generateInsights(nutrients, timeOfDayNutrients)
    const interactions = insights.filter(i => i.category === 'interaction')
    expect(interactions.length).toBeGreaterThanOrEqual(1)
    expect(interactions[0].timeOfDay).toBe('MORNING')
  })
})
