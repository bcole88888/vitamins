// Export/Import utilities

import { ExportData, ProductData } from '@/types'

export const EXPORT_VERSION = '1.0'

export function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false

  const d = data as Record<string, unknown>

  // Check version
  if (typeof d.version !== 'string') return false

  // Check user
  if (!d.user || typeof d.user !== 'object') return false
  const user = d.user as Record<string, unknown>
  if (typeof user.id !== 'string' || typeof user.name !== 'string') return false

  // Check products array
  if (!Array.isArray(d.products)) return false

  // Check regimens array
  if (!Array.isArray(d.regimens)) return false

  // Check intakeLogs array
  if (!Array.isArray(d.intakeLogs)) return false

  return true
}

export function createExportFilename(userName: string): string {
  const date = new Date().toISOString().split('T')[0]
  const safeName = userName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return `vitamins-backup-${safeName}-${date}.json`
}

export function downloadJson(data: ExportData, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        resolve(data)
      } catch (e) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
