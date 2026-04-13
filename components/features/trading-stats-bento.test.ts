import { describe, expect, it } from 'vitest'
import type { NormalizedTransaction } from '@/types/trading212'
import {
  longestStreak,
  busiestDay,
  favoriteDay,
  mostActiveMonth,
  tradesPerActiveDay,
  computeStats,
} from './trading-stats-bento'

function trade(time: string): NormalizedTransaction {
  return {
    Action: 'Market buy',
    Time: time,
    Total: 100,
    'Currency (Total)': 'USD',
    totalInBaseCurrency: 100,
    detectedBaseCurrency: 'USD',
  } as NormalizedTransaction
}

describe('longestStreak', () => {
  it('returns null for empty input', () => {
    expect(longestStreak([])).toBeNull()
  })

  it('returns 1 day for a single trade', () => {
    const result = longestStreak([trade('2025-03-03T10:00:00')])
    expect(result?.days).toBe(1)
  })

  it('finds the longest consecutive-day run', () => {
    const trades = [
      trade('2025-03-01T09:00:00'),
      trade('2025-03-02T09:00:00'),
      trade('2025-03-03T09:00:00'),
      trade('2025-03-10T09:00:00'),
      trade('2025-03-11T09:00:00'),
    ]
    const result = longestStreak(trades)
    expect(result?.days).toBe(3)
    expect(result?.startDate.toISOString().slice(0, 10)).toBe('2025-03-01')
    expect(result?.endDate.toISOString().slice(0, 10)).toBe('2025-03-03')
  })

  it('treats multiple trades on same day as one streak day', () => {
    const trades = [
      trade('2025-03-01T09:00:00'),
      trade('2025-03-01T15:00:00'),
      trade('2025-03-02T09:00:00'),
    ]
    expect(longestStreak(trades)?.days).toBe(2)
  })

  it('ignores non-trade actions', () => {
    const deposit = { ...trade('2025-03-01T09:00:00'), Action: 'Deposit' } as NormalizedTransaction
    expect(longestStreak([deposit])).toBeNull()
  })
})

describe('busiestDay', () => {
  it('returns null for empty input', () => {
    expect(busiestDay([])).toBeNull()
  })

  it('returns the day with the most trades', () => {
    const trades = [
      trade('2025-03-01T09:00:00'),
      trade('2025-03-03T09:00:00'),
      trade('2025-03-03T10:00:00'),
      trade('2025-03-03T11:00:00'),
    ]
    const result = busiestDay(trades)
    expect(result?.count).toBe(3)
    expect(result?.date.toISOString().slice(0, 10)).toBe('2025-03-03')
  })

  it('breaks ties by earliest date', () => {
    const trades = [
      trade('2025-03-01T09:00:00'),
      trade('2025-03-02T09:00:00'),
    ]
    expect(busiestDay(trades)?.date.toISOString().slice(0, 10)).toBe('2025-03-01')
  })
})

describe('favoriteDay', () => {
  it('returns null for empty input', () => {
    expect(favoriteDay([])).toBeNull()
  })

  it('returns the weekday that appears most', () => {
    // 2025-03-04 is Tuesday; 2025-03-11 is Tuesday; 2025-03-05 is Wednesday
    const trades = [
      trade('2025-03-04T09:00:00'),
      trade('2025-03-11T09:00:00'),
      trade('2025-03-05T09:00:00'),
    ]
    const result = favoriteDay(trades)
    expect(result?.day).toBe('Tuesday')
    expect(result?.percentage).toBe(67)
  })
})

describe('mostActiveMonth', () => {
  it('returns null for empty input', () => {
    expect(mostActiveMonth([])).toBeNull()
  })

  it('distinguishes the same month across different years', () => {
    const trades = [
      trade('2024-03-01T09:00:00'),
      trade('2025-03-01T09:00:00'),
      trade('2025-03-02T09:00:00'),
    ]
    const result = mostActiveMonth(trades)
    expect(result?.label).toBe('March 2025')
    expect(result?.count).toBe(2)
  })
})

describe('tradesPerActiveDay', () => {
  it('returns 0 for empty input', () => {
    expect(tradesPerActiveDay([])).toBe(0)
  })

  it('divides total trades by unique active days, rounded to 1 decimal', () => {
    const trades = [
      trade('2025-03-01T09:00:00'),
      trade('2025-03-01T10:00:00'),
      trade('2025-03-01T11:00:00'),
      trade('2025-03-02T09:00:00'),
    ]
    expect(tradesPerActiveDay(trades)).toBe(2)
  })

  it('rounds correctly', () => {
    const trades = [
      trade('2025-03-01T09:00:00'),
      trade('2025-03-01T10:00:00'),
      trade('2025-03-02T09:00:00'),
    ]
    expect(tradesPerActiveDay(trades)).toBe(1.5)
  })
})

describe('computeStats', () => {
  it('returns null for empty input', () => {
    expect(computeStats([])).toBeNull()
  })

  it('returns an object with all five fields populated', () => {
    const trades = [
      trade('2025-03-04T09:00:00'),
      trade('2025-03-05T09:00:00'),
    ]
    const result = computeStats(trades)
    expect(result?.longestStreak?.days).toBe(2)
    expect(result?.busiestDay?.count).toBe(1)
    expect(result?.favoriteDay?.day).toBeDefined()
    expect(result?.mostActiveMonth?.label).toBe('March 2025')
    expect(result?.tradesPerActiveDay).toBe(1)
  })
})
