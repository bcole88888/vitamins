// Browser notification utilities

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

export function getNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionStatus
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission as NotificationPermissionStatus
  } catch {
    return 'denied'
  }
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) {
    return null
  }

  if (Notification.permission !== 'granted') {
    return null
  }

  try {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })
  } catch {
    return null
  }
}

export function formatReminderTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
