import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 0 && diffDays <= 7) return format(date, 'EEE d')
  return format(date, 'd MMM')
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const date = parseISO(dateStr)
  return isPast(date) && !isToday(date)
}
