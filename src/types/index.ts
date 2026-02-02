export interface NutrientData {
  name: string
  amount: number
  unit: string
  dailyValuePercent?: number
}

export interface ProductData {
  upc?: string
  name: string
  brand?: string
  servingSize?: number
  servingUnit?: string
  imageUrl?: string
  nutrients: NutrientData[]
}

export interface AggregatedNutrient {
  name: string
  totalAmount: number
  unit: string
  rdiAmount?: number
  rdiPercent?: number
  sources: { productName: string; amount: number }[]
}

export interface DailySummary {
  date: string
  userId: string
  userName: string
  nutrients: AggregatedNutrient[]
  intakes: IntakeWithProduct[]
}

export interface IntakeWithProduct {
  id: string
  productId: string
  productName: string
  productBrand?: string
  quantity: number
  date: string
}

export interface Insight {
  type: 'warning' | 'info' | 'success'
  category: 'excess' | 'deficiency' | 'redundancy' | 'good'
  nutrient?: string
  message: string
  details?: string
}
