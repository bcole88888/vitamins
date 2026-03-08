import { useState, useCallback } from 'react'
import { formatDate } from '@/lib/utils'

export function useDateNav(initialDate?: string) {
  const [date, setDate] = useState(initialDate || formatDate(new Date()))

  const goToday = useCallback(() => setDate(formatDate(new Date())), [])

  const goPrev = useCallback(() => {
    setDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return formatDate(d)
    })
  }, [])

  const goNext = useCallback(() => {
    setDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return formatDate(d)
    })
  }, [])

  return { date, setDate, goToday, goPrev, goNext }
}
