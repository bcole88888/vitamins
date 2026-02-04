// Schedule utilities for day-of-week scheduling

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export const ALL_DAYS = '0,1,2,3,4,5,6'
export const WEEKDAYS = '1,2,3,4,5'
export const WEEKENDS = '0,6'

export function parseScheduleDays(csv: string): number[] {
  if (!csv || csv.trim() === '') return [0, 1, 2, 3, 4, 5, 6]
  return csv
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n >= 0 && n <= 6)
    .sort((a, b) => a - b)
}

export function formatScheduleDays(days: number[]): string {
  return days
    .filter(d => d >= 0 && d <= 6)
    .sort((a, b) => a - b)
    .join(',')
}

export function isScheduledForDay(scheduleDays: string, day: number): boolean {
  const days = parseScheduleDays(scheduleDays)
  return days.includes(day)
}

export function getScheduleLabel(scheduleDays: string): string {
  const days = parseScheduleDays(scheduleDays)

  // Check for common patterns
  if (days.length === 7) return 'Every day'
  if (days.length === 0) return 'Never'

  const isWeekdays = days.length === 5 &&
    days.every(d => d >= 1 && d <= 5) &&
    [1, 2, 3, 4, 5].every(d => days.includes(d))
  if (isWeekdays) return 'Weekdays'

  const isWeekends = days.length === 2 && days.includes(0) && days.includes(6)
  if (isWeekends) return 'Weekends'

  // Custom selection
  if (days.length <= 3) {
    return days.map(d => DAY_NAMES[d]).join(', ')
  }

  return `${days.length} days/week`
}

export function getTodayDayOfWeek(): number {
  return new Date().getDay()
}

export function getDayOfWeek(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
  return d.getDay()
}
