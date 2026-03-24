import { describe, it, expect } from 'vitest'
import { formatDueDate, isOverdue } from '@/lib/utils'

// Pin tests to a fixed "today" by constructing dates relative to now
// We use date strings rather than Date objects to match the function signature

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function offsetDateStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

describe('formatDueDate', () => {
  it('returns null for null input', () => {
    expect(formatDueDate(null)).toBeNull()
  })

  it('returns "Today" for today\'s date', () => {
    expect(formatDueDate(todayStr())).toBe('Today')
  })

  it('returns "Tomorrow" for tomorrow\'s date', () => {
    expect(formatDueDate(offsetDateStr(1))).toBe('Tomorrow')
  })

  it('returns short weekday + date format for a date within 7 days', () => {
    // Use +3 days — safely in range, not today or tomorrow
    const dateStr = offsetDateStr(3)
    const result = formatDueDate(dateStr)
    // Should match pattern like "Wed 27" or "Thu 28"
    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/)
  })

  it('returns "d MMM" format for a date more than 7 days away', () => {
    const dateStr = offsetDateStr(10)
    const result = formatDueDate(dateStr)
    // Should match pattern like "3 Apr" or "15 Apr"
    expect(result).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/)
  })

  it('returns "d MMM" format for a past date', () => {
    const dateStr = offsetDateStr(-10)
    const result = formatDueDate(dateStr)
    expect(result).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/)
  })

  it('handles a specific known future date correctly', () => {
    // 2099-12-31 is always more than 7 days away
    const result = formatDueDate('2099-12-31')
    expect(result).toBe('31 Dec')
  })
})

describe('isOverdue', () => {
  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false)
  })

  it('returns false for today', () => {
    expect(isOverdue(todayStr())).toBe(false)
  })

  it('returns true for yesterday', () => {
    expect(isOverdue(offsetDateStr(-1))).toBe(true)
  })

  it('returns true for a date well in the past', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
  })

  it('returns false for a future date', () => {
    expect(isOverdue(offsetDateStr(5))).toBe(false)
  })

  it('returns false for tomorrow', () => {
    expect(isOverdue(offsetDateStr(1))).toBe(false)
  })
})
