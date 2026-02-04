'use client'

import { useState, useEffect } from 'react'
import { UserSelector } from '@/components/UserSelector'
import { NotificationSettings } from '@/components/NotificationSettings'
import { ExportButton } from '@/components/ExportButton'
import { ImportModal } from '@/components/ImportModal'

interface User {
  id: string
  name: string
}

export default function SettingsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Fetch user details when selected
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUser(null)
      return
    }

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users')
        const users = await res.json()
        const user = users.find((u: User) => u.id === selectedUserId)
        setSelectedUser(user || null)
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    fetchUser()
  }, [selectedUserId])

  const handleImportSuccess = (userId: string) => {
    setSelectedUserId(userId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your notifications and data</p>
        </div>
        <UserSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
      </div>

      {!selectedUserId ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Please select a user to manage settings.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <NotificationSettings userId={selectedUserId} />
          </div>

          {/* Export/Import Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-900 mb-4">Data Management</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Export Data</h4>
                {selectedUser && (
                  <ExportButton userId={selectedUserId} userName={selectedUser.name} />
                )}
              </div>

              {/* Import */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Import Data</h4>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Backup
                </button>
                <p className="text-xs text-gray-500">
                  Restore data from a previously exported backup file.
                </p>
              </div>
            </div>
          </div>

          {/* App Info Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-900 mb-4">About</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Vitamin Tracker</strong> helps you track your daily supplement intake
                and monitor nutrient levels over time.
              </p>
              <p className="text-gray-400 text-xs">
                This application is for informational purposes only and does not constitute medical advice.
              </p>
            </div>
          </div>
        </div>
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
