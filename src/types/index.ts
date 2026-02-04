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
  category: 'excess' | 'deficiency' | 'redundancy' | 'good' | 'interaction'
  nutrient?: string
  message: string
  details?: string
}

export interface Regimen {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
  items: RegimenItem[]
}

export interface RegimenItem {
  id: string
  regimenId: string
  productId: string
  quantity: number
  sortOrder: number
  scheduleDays: string // CSV: "0,1,2,3,4,5,6"
  createdAt: string
  product: {
    id: string
    name: string
    brand?: string
    servingUnit?: string
  }
}

export interface RegimenChecklistItem {
  id: string
  productId: string
  productName: string
  productBrand?: string
  servingUnit?: string
  quantity: number
  sortOrder: number
  scheduleDays: string
  isLogged: boolean
  intakeLogId?: string
}

export interface NotificationPreference {
  id: string
  userId: string
  enabled: boolean
  reminderTime: string
  createdAt: string
  updatedAt: string
}

export interface ExportData {
  version: string
  exportedAt: string
  user: {
    id: string
    name: string
  }
  products: ProductData[]
  regimens: {
    id: string
    name: string
    items: {
      productId: string
      quantity: number
      sortOrder: number
      scheduleDays: string
    }[]
  }[]
  intakeLogs: {
    productId: string
    date: string
    quantity: number
  }[]
}

export interface TrendDataPoint {
  date: string
  nutrients: {
    name: string
    amount: number
    unit: string
    rdiPercent?: number
  }[]
}

export interface NutrientInteraction {
  nutrients: [string, string]
  type: 'inhibits' | 'enhances' | 'caution'
  description: string
}
