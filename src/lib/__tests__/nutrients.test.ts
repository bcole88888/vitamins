import {
  normalizeNutrientName,
  convertUnit,
  getRdiInfo,
  calculateRdiPercent,
  isAboveUpperLimit,
  checkInteractions,
} from '../nutrients'

describe('normalizeNutrientName', () => {
  it('returns canonical name for exact aliases', () => {
    expect(normalizeNutrientName('Vitamin B1')).toBe('Thiamin')
    expect(normalizeNutrientName('Vitamin B2')).toBe('Riboflavin')
    expect(normalizeNutrientName('Vitamin B3')).toBe('Niacin')
    expect(normalizeNutrientName('Vitamin B5')).toBe('Pantothenic Acid')
    expect(normalizeNutrientName('Vitamin B7')).toBe('Biotin')
    expect(normalizeNutrientName('Vitamin B9')).toBe('Folate')
    expect(normalizeNutrientName('Folic Acid')).toBe('Folate')
    expect(normalizeNutrientName('Cobalamin')).toBe('Vitamin B12')
  })

  it('returns canonical name for lowered/dashed aliases', () => {
    expect(normalizeNutrientName('vitamin-b1')).toBe('Thiamin')
    expect(normalizeNutrientName('thiamine')).toBe('Thiamin')
    expect(normalizeNutrientName('folic-acid')).toBe('Folate')
    expect(normalizeNutrientName('cobalamin')).toBe('Vitamin B12')
    expect(normalizeNutrientName('omega-3-fat')).toBe('Omega-3')
  })

  it('returns canonical names unchanged', () => {
    expect(normalizeNutrientName('Vitamin A')).toBe('Vitamin A')
    expect(normalizeNutrientName('Vitamin D')).toBe('Vitamin D')
    expect(normalizeNutrientName('Calcium')).toBe('Calcium')
    expect(normalizeNutrientName('Iron')).toBe('Iron')
    expect(normalizeNutrientName('Thiamin')).toBe('Thiamin')
  })

  it('returns unknown names unchanged', () => {
    expect(normalizeNutrientName('Lutein')).toBe('Lutein')
    expect(normalizeNutrientName('CoQ10')).toBe('CoQ10')
  })
})

describe('convertUnit', () => {
  it('converts between metric units', () => {
    expect(convertUnit(1000, 'mcg', 'mg')).toEqual({ amount: 1, unit: 'mg' })
    expect(convertUnit(1, 'mg', 'mcg')).toEqual({ amount: 1000, unit: 'mcg' })
    expect(convertUnit(1, 'g', 'mg')).toEqual({ amount: 1000, unit: 'mg' })
  })

  it('converts IU to standard units for known vitamins', () => {
    const vitD = convertUnit(400, 'IU', 'mcg', 'Vitamin D')
    expect(vitD.amount).toBeCloseTo(10)
    expect(vitD.unit).toBe('mcg')

    const vitA = convertUnit(1000, 'IU', 'mcg', 'Vitamin A')
    expect(vitA.amount).toBeCloseTo(300)
    expect(vitA.unit).toBe('mcg')

    const vitE = convertUnit(100, 'IU', 'mg', 'Vitamin E')
    expect(vitE.amount).toBeCloseTo(67)
    expect(vitE.unit).toBe('mg')
  })

  it('returns original when no conversion found', () => {
    expect(convertUnit(5, 'oz', 'mg')).toEqual({ amount: 5, unit: 'oz' })
  })

  it('returns same amount when units match', () => {
    expect(convertUnit(42, 'mg', 'mg')).toEqual({ amount: 42, unit: 'mg' })
  })

  it('handles µg as mcg', () => {
    const result = convertUnit(500, 'µg', 'mg')
    expect(result.amount).toBeCloseTo(0.5)
  })
})

describe('getRdiInfo', () => {
  it('returns RDI for known nutrients', () => {
    const vitD = getRdiInfo('Vitamin D')
    expect(vitD).toEqual({ amount: 20, unit: 'mcg', upperLimit: 100 })
  })

  it('normalizes names before lookup', () => {
    const folate = getRdiInfo('Folic Acid')
    expect(folate).toEqual({ amount: 400, unit: 'mcg', upperLimit: 1000 })
  })

  it('returns null for unknown nutrients', () => {
    expect(getRdiInfo('Lutein')).toBeNull()
  })
})

describe('calculateRdiPercent', () => {
  it('calculates percentage correctly', () => {
    const pct = calculateRdiPercent('Vitamin D', 20, 'mcg')
    expect(pct).toBe(100)
  })

  it('handles unit conversion', () => {
    const pct = calculateRdiPercent('Vitamin D', 20000, 'mcg')
    expect(pct).toBe(100000)
  })

  it('converts IU for vitamins', () => {
    // 400 IU Vitamin D = 10 mcg, RDI is 20 mcg = 50%
    const pct = calculateRdiPercent('Vitamin D', 400, 'IU')
    expect(pct).toBeCloseTo(50)
  })

  it('returns null for unknown nutrients', () => {
    expect(calculateRdiPercent('Lutein', 5, 'mg')).toBeNull()
  })

  it('returns null for incompatible units', () => {
    expect(calculateRdiPercent('Vitamin D', 5, 'oz')).toBeNull()
  })
})

describe('isAboveUpperLimit', () => {
  it('returns true when above upper limit', () => {
    expect(isAboveUpperLimit('Vitamin D', 101, 'mcg')).toBe(true)
  })

  it('returns false when below upper limit', () => {
    expect(isAboveUpperLimit('Vitamin D', 50, 'mcg')).toBe(false)
  })

  it('returns false when nutrient has no upper limit', () => {
    expect(isAboveUpperLimit('Vitamin K', 99999, 'mcg')).toBe(false)
  })

  it('returns false for unknown nutrients', () => {
    expect(isAboveUpperLimit('Lutein', 99999, 'mg')).toBe(false)
  })
})

describe('checkInteractions', () => {
  it('finds inhibiting interactions in same time group', () => {
    const warnings = checkInteractions([
      { names: ['Calcium', 'Iron'], timeOfDay: 'MORNING' },
    ])
    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('inhibits')
    expect(warnings[0].timeOfDay).toBe('MORNING')
  })

  it('finds enhancing interactions', () => {
    const warnings = checkInteractions([
      { names: ['Vitamin C', 'Iron'], timeOfDay: 'MORNING' },
    ])
    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('enhances')
  })

  it('returns empty for non-interacting nutrients', () => {
    const warnings = checkInteractions([
      { names: ['Vitamin A', 'Vitamin C'], timeOfDay: 'MORNING' },
    ])
    expect(warnings).toHaveLength(0)
  })

  it('does not flag interactions across different time groups', () => {
    const warnings = checkInteractions([
      { names: ['Calcium'], timeOfDay: 'MORNING' },
      { names: ['Iron'], timeOfDay: 'EVENING' },
    ])
    expect(warnings).toHaveLength(0)
  })
})
