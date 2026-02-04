import { AggregatedNutrient, Insight } from '@/types'
import { getRdiInfo, isAboveUpperLimit, checkInteractions } from './nutrients'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatAmount(amount: number, unit: string): string {
  if (amount >= 1000 && unit === 'mcg') {
    return `${(amount / 1000).toFixed(1)} mg`
  }
  if (amount >= 1000 && unit === 'mg') {
    return `${(amount / 1000).toFixed(1)} g`
  }
  if (amount < 0.01) {
    return `${(amount * 1000).toFixed(1)} ${unit === 'mg' ? 'mcg' : unit}`
  }
  return `${amount.toFixed(amount < 1 ? 2 : 1)} ${unit}`
}

export function generateInsights(nutrients: AggregatedNutrient[]): Insight[] {
  const insights: Insight[] = []

  for (const nutrient of nutrients) {
    const rdi = getRdiInfo(nutrient.name)

    // Check for excess
    if (rdi && nutrient.rdiPercent) {
      if (isAboveUpperLimit(nutrient.name, nutrient.totalAmount, nutrient.unit)) {
        insights.push({
          type: 'warning',
          category: 'excess',
          nutrient: nutrient.name,
          message: `${nutrient.name} exceeds upper intake level`,
          details: `You're getting ${formatAmount(nutrient.totalAmount, nutrient.unit)} (${nutrient.rdiPercent.toFixed(0)}% DV). The tolerable upper limit is ${formatAmount(rdi.upperLimit!, rdi.unit)}.`,
        })
      } else if (nutrient.rdiPercent > 200) {
        insights.push({
          type: 'info',
          category: 'excess',
          nutrient: nutrient.name,
          message: `High ${nutrient.name} intake`,
          details: `You're getting ${nutrient.rdiPercent.toFixed(0)}% of the daily value. While this is within safe limits, you may want to review your sources.`,
        })
      }
    }

    // Check for redundancy (3+ sources)
    if (nutrient.sources.length >= 3) {
      insights.push({
        type: 'info',
        category: 'redundancy',
        nutrient: nutrient.name,
        message: `${nutrient.name} from multiple sources`,
        details: `You're getting ${nutrient.name} from ${nutrient.sources.length} different supplements: ${nutrient.sources.map(s => s.productName).join(', ')}.`,
      })
    }
  }

  // Check for key nutrient deficiencies
  const keyNutrients = ['Vitamin D', 'Vitamin B12', 'Iron', 'Calcium', 'Magnesium', 'Omega-3']
  for (const key of keyNutrients) {
    const found = nutrients.find(n => n.name === key)
    if (!found || (found.rdiPercent && found.rdiPercent < 25)) {
      insights.push({
        type: 'info',
        category: 'deficiency',
        nutrient: key,
        message: found ? `Low ${key} intake` : `No ${key} in your regimen`,
        details: found
          ? `You're only getting ${found.rdiPercent?.toFixed(0)}% of the daily value for ${key}.`
          : `Consider whether you need ${key} supplementation based on your diet and health needs.`,
      })
    }
  }

  // Good status
  const wellCovered = nutrients.filter(n => n.rdiPercent && n.rdiPercent >= 50 && n.rdiPercent <= 150)
  if (wellCovered.length >= 5) {
    insights.push({
      type: 'success',
      category: 'good',
      message: 'Good nutrient coverage',
      details: `You have adequate levels (50-150% DV) of ${wellCovered.length} nutrients including ${wellCovered.slice(0, 3).map(n => n.name).join(', ')}.`,
    })
  }

  // Check for nutrient interactions
  const nutrientNames = nutrients.map(n => n.name)
  const interactions = checkInteractions(nutrientNames)

  for (const interaction of interactions) {
    if (interaction.type === 'inhibits') {
      insights.push({
        type: 'warning',
        category: 'interaction',
        nutrient: `${interaction.nutrient1} + ${interaction.nutrient2}`,
        message: `${interaction.nutrient1} and ${interaction.nutrient2} may interact`,
        details: interaction.description,
      })
    } else if (interaction.type === 'caution') {
      insights.push({
        type: 'warning',
        category: 'interaction',
        nutrient: `${interaction.nutrient1} + ${interaction.nutrient2}`,
        message: `Caution: ${interaction.nutrient1} and ${interaction.nutrient2}`,
        details: interaction.description,
      })
    } else if (interaction.type === 'enhances') {
      insights.push({
        type: 'info',
        category: 'interaction',
        nutrient: `${interaction.nutrient1} + ${interaction.nutrient2}`,
        message: `${interaction.nutrient1} enhances ${interaction.nutrient2}`,
        details: interaction.description,
      })
    }
  }

  return insights
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
