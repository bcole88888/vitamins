// Reference Daily Intakes (RDI) for adults based on FDA guidelines
// https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels

export const NUTRIENT_RDI: Record<string, { amount: number; unit: string; upperLimit?: number }> = {
  // Vitamins
  'Vitamin A': { amount: 900, unit: 'mcg', upperLimit: 3000 },
  'Vitamin C': { amount: 90, unit: 'mg', upperLimit: 2000 },
  'Vitamin D': { amount: 20, unit: 'mcg', upperLimit: 100 },
  'Vitamin E': { amount: 15, unit: 'mg', upperLimit: 1000 },
  'Vitamin K': { amount: 120, unit: 'mcg' },
  'Vitamin B1': { amount: 1.2, unit: 'mg' },
  'Thiamin': { amount: 1.2, unit: 'mg' },
  'Vitamin B2': { amount: 1.3, unit: 'mg' },
  'Riboflavin': { amount: 1.3, unit: 'mg' },
  'Vitamin B3': { amount: 16, unit: 'mg', upperLimit: 35 },
  'Niacin': { amount: 16, unit: 'mg', upperLimit: 35 },
  'Vitamin B5': { amount: 5, unit: 'mg' },
  'Pantothenic Acid': { amount: 5, unit: 'mg' },
  'Vitamin B6': { amount: 1.7, unit: 'mg', upperLimit: 100 },
  'Vitamin B7': { amount: 30, unit: 'mcg' },
  'Biotin': { amount: 30, unit: 'mcg' },
  'Vitamin B9': { amount: 400, unit: 'mcg', upperLimit: 1000 },
  'Folate': { amount: 400, unit: 'mcg', upperLimit: 1000 },
  'Folic Acid': { amount: 400, unit: 'mcg', upperLimit: 1000 },
  'Vitamin B12': { amount: 2.4, unit: 'mcg' },
  'Cobalamin': { amount: 2.4, unit: 'mcg' },
  'Choline': { amount: 550, unit: 'mg', upperLimit: 3500 },

  // Minerals
  'Calcium': { amount: 1000, unit: 'mg', upperLimit: 2500 },
  'Iron': { amount: 18, unit: 'mg', upperLimit: 45 },
  'Magnesium': { amount: 420, unit: 'mg', upperLimit: 350 }, // Upper limit for supplements only
  'Phosphorus': { amount: 1000, unit: 'mg', upperLimit: 4000 },
  'Potassium': { amount: 4700, unit: 'mg' },
  'Sodium': { amount: 2300, unit: 'mg', upperLimit: 2300 },
  'Zinc': { amount: 11, unit: 'mg', upperLimit: 40 },
  'Copper': { amount: 0.9, unit: 'mg', upperLimit: 10 },
  'Manganese': { amount: 2.3, unit: 'mg', upperLimit: 11 },
  'Selenium': { amount: 55, unit: 'mcg', upperLimit: 400 },
  'Chromium': { amount: 35, unit: 'mcg' },
  'Molybdenum': { amount: 45, unit: 'mcg', upperLimit: 2000 },
  'Iodine': { amount: 150, unit: 'mcg', upperLimit: 1100 },

  // Other
  'Omega-3': { amount: 1600, unit: 'mg' },
  'Fiber': { amount: 28, unit: 'g' },
}

// Map various nutrient names to standardized names
const NUTRIENT_ALIASES: Record<string, string> = {
  'vitamin-a': 'Vitamin A',
  'vitamin-c': 'Vitamin C',
  'vitamin-d': 'Vitamin D',
  'vitamin-e': 'Vitamin E',
  'vitamin-k': 'Vitamin K',
  'vitamin-b1': 'Vitamin B1',
  'vitamin-b2': 'Vitamin B2',
  'vitamin-b3': 'Vitamin B3',
  'vitamin-b5': 'Vitamin B5',
  'vitamin-b6': 'Vitamin B6',
  'vitamin-b7': 'Vitamin B7',
  'vitamin-b9': 'Vitamin B9',
  'vitamin-b12': 'Vitamin B12',
  'thiamine': 'Thiamin',
  'riboflavine': 'Riboflavin',
  'niacine': 'Niacin',
  'pantothenic-acid': 'Pantothenic Acid',
  'biotine': 'Biotin',
  'folates': 'Folate',
  'folic-acid': 'Folic Acid',
  'cobalamine': 'Cobalamin',
  'calcium': 'Calcium',
  'iron': 'Iron',
  'magnesium': 'Magnesium',
  'phosphorus': 'Phosphorus',
  'potassium': 'Potassium',
  'sodium': 'Sodium',
  'zinc': 'Zinc',
  'copper': 'Copper',
  'manganese': 'Manganese',
  'selenium': 'Selenium',
  'chromium': 'Chromium',
  'molybdenum': 'Molybdenum',
  'iodine': 'Iodine',
  'fiber': 'Fiber',
  'omega-3-fat': 'Omega-3',
}

// Unit conversion factors to base units (mcg for vitamins, mg for minerals)
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  mcg: { mcg: 1, mg: 1000, g: 1000000, iu: 1 },
  mg: { mg: 1, g: 1000, mcg: 0.001 },
  g: { g: 1, mg: 0.001, mcg: 0.000001 },
}

// IU to mcg/mg conversions for specific vitamins
const IU_CONVERSIONS: Record<string, { factor: number; unit: string }> = {
  'Vitamin A': { factor: 0.3, unit: 'mcg' }, // 1 IU = 0.3 mcg retinol
  'Vitamin D': { factor: 0.025, unit: 'mcg' }, // 1 IU = 0.025 mcg
  'Vitamin E': { factor: 0.67, unit: 'mg' }, // 1 IU = 0.67 mg d-alpha-tocopherol
}

export function normalizeNutrientName(name: string): string {
  const lowered = name.toLowerCase().replace(/\s+/g, '-')
  return NUTRIENT_ALIASES[lowered] || name
}

export function convertUnit(
  amount: number,
  fromUnit: string,
  toUnit: string,
  nutrientName?: string
): { amount: number; unit: string } {
  const fromLower = fromUnit.toLowerCase().replace('µg', 'mcg')
  const toLower = toUnit.toLowerCase().replace('µg', 'mcg')

  // Handle IU conversions for specific vitamins
  if (fromLower === 'iu' && nutrientName && IU_CONVERSIONS[nutrientName]) {
    const conv = IU_CONVERSIONS[nutrientName]
    return { amount: amount * conv.factor, unit: conv.unit }
  }

  // Direct conversion
  if (fromLower === toLower) {
    return { amount, unit: toUnit }
  }

  // Try to find conversion
  if (UNIT_CONVERSIONS[toLower] && UNIT_CONVERSIONS[toLower][fromLower]) {
    return {
      amount: amount * UNIT_CONVERSIONS[toLower][fromLower],
      unit: toUnit,
    }
  }

  // Return original if no conversion found
  return { amount, unit: fromUnit }
}

export function getRdiInfo(nutrientName: string): { amount: number; unit: string; upperLimit?: number } | null {
  const normalized = normalizeNutrientName(nutrientName)
  return NUTRIENT_RDI[normalized] || null
}

export function calculateRdiPercent(nutrientName: string, amount: number, unit: string): number | null {
  const rdi = getRdiInfo(nutrientName)
  if (!rdi) return null

  // Convert to same unit as RDI
  const converted = convertUnit(amount, unit, rdi.unit, normalizeNutrientName(nutrientName))
  if (converted.unit.toLowerCase() !== rdi.unit.toLowerCase()) {
    return null // Units incompatible
  }

  return (converted.amount / rdi.amount) * 100
}

export function isAboveUpperLimit(nutrientName: string, amount: number, unit: string): boolean {
  const rdi = getRdiInfo(nutrientName)
  if (!rdi || !rdi.upperLimit) return false

  const converted = convertUnit(amount, unit, rdi.unit, normalizeNutrientName(nutrientName))
  return converted.amount > rdi.upperLimit
}
