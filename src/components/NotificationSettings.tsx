'use client'

import { useState, useEffect } from 'react'
import {
  requestNotificationPermission,
  getNotificationPermission,
  formatReminderTime,
  isNotificationSupported,
} from '@/lib/notifications'

interface NotificationSettingsProps {
  userId: string
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [permission, setPermission] = useState<string>('default')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Check browser permission
    setPermission(getNotificationPermission())

    // Fetch user preferences
    const fetchPreferences = async () => {
      try {
        const res = await fetch(`/api/notifications/preferences?userId=${userId}`)
        const data = await res.json()
        setEnabled(data.enabled || false)
        setReminderTime(data.reminderTime || '09:00')
      } catch (error) {
        console.error('Error fetching preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [userId])

  const handlePermissionRequest = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  const handleToggleEnabled = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    await savePreferences(newEnabled, reminderTime)
  }

  const handleTimeChange = async (newTime: string) => {
    setReminderTime(newTime)
    await savePreferences(enabled, newTime)
  }

  const savePreferences = async (newEnabled: boolean, newTime: string) => {
    setSaving(true)
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          enabled: newEnabled,
          reminderTime: newTime,
        }),
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading notification settings...</div>
  }

  const browserSupported = isNotificationSupported()

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Notification Settings</h3>

      {!browserSupported ? (
        <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          Browser notifications are not supported in your browser.
        </div>
      ) : permission === 'denied' ? (
        <div className="p-4 bg-red-50 rounded-lg text-sm text-red-700">
          Notifications are blocked. Please enable them in your browser settings.
        </div>
      ) : permission !== 'granted' ? (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 mb-3">
            Enable browser notifications to receive reminders when it&apos;s time to take your supplements.
          </p>
          <button
            onClick={handlePermissionRequest}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
          >
            Enable Notifications
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Daily Reminder</div>
              <div className="text-sm text-gray-500">
                Get notified when you have supplements to take
              </div>
            </div>
            <button
              onClick={handleToggleEnabled}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-300'
              } ${saving ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="flex items-center gap-4 pl-4 border-l-2 border-blue-200">
              <label className="text-sm text-gray-600">Reminder time:</label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => handleTimeChange(e.target.value)}
                disabled={saving}
                className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">
                ({formatReminderTime(reminderTime)})
              </span>
            </div>
          )}

          <div className="text-xs text-gray-400">
            Note: Reminders work when the app is open in your browser.
          </div>
        </div>
      )}
    </div>
  )
}
