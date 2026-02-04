'use client'

import { useState } from 'react'
import { downloadJson, createExportFilename } from '@/lib/exportImport'
import { ExportData } from '@/types'

interface ExportButtonProps {
  userId: string
  userName: string
}

export function ExportButton({ userId, userName }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)

    try {
      const res = await fetch(`/api/export?userId=${userId}`)

      if (!res.ok) {
        throw new Error('Failed to export data')
      }

      const data: ExportData = await res.json()
      const filename = createExportFilename(userName)
      downloadJson(data, filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Backup
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Downloads a JSON file with all your products, regimens, and intake history.
      </p>
    </div>
  )
}
