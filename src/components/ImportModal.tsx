'use client'

import { useState, useRef } from 'react'
import { readJsonFile, validateExportData } from '@/lib/exportImport'
import { ExportData } from '@/types'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userId: string) => void
}

type ImportStep = 'select' | 'preview' | 'importing' | 'complete' | 'error'

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('select')
  const [data, setData] = useState<ExportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    userId: string
    productsImported: number
    regimensImported: number
    intakesImported: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setStep('select')
    setData(null)
    setError(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const jsonData = await readJsonFile(file)

      if (!validateExportData(jsonData)) {
        setError('Invalid backup file format. Please select a valid Vitamin Tracker backup file.')
        setStep('error')
        return
      }

      setData(jsonData as ExportData)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
      setStep('error')
    }
  }

  const handleImport = async () => {
    if (!data) return

    setStep('importing')
    setError(null)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Import failed')
      }

      const importResult = await res.json()
      setResult(importResult)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setStep('error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Import Backup</h2>

        {step === 'select' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Select a Vitamin Tracker backup file (JSON) to restore your data.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'preview' && data && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">User:</span>
                <span className="font-medium">{data.user.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Products:</span>
                <span className="font-medium">{data.products.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Regimens:</span>
                <span className="font-medium">{data.regimens.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Intake Logs:</span>
                <span className="font-medium">{data.intakeLogs.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Export Date:</span>
                <span className="font-medium">
                  {new Date(data.exportedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              This will import the data into your account. Existing products with the same name will be reused.
            </p>

            <div className="flex gap-3">
              <button
                onClick={resetState}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-gray-600">Importing data...</p>
          </div>
        )}

        {step === 'complete' && result && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-3 font-medium text-gray-900">Import Complete!</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Products:</span>
                <span className="font-medium">{result.productsImported}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Regimens:</span>
                <span className="font-medium">{result.regimensImported}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Intake Logs:</span>
                <span className="font-medium">{result.intakesImported}</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleClose()
                onSuccess(result.userId)
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-3 font-medium text-gray-900">Import Failed</h3>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetState}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
