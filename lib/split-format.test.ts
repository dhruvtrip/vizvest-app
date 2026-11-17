import { describe, it, expect } from 'vitest'
import { formatSplitDate, formatSplitSummary, countSplitSecurities, formatSplitPhrase } from './split-format'

describe('formatSplitDate', () => {
  it('formats the UTC date part without shifting the day', () => {
    expect(formatSplitDate('2022-06-06 02:00:00')).toBe('6 Jun 2022')
    expect(formatSplitDate('2024-12-31 23:59:59')).toBe('31 Dec 2024')
    expect(formatSplitDate('2021-01-01 00:00:00')).toBe('1 Jan 2021')
  })

  it('returns the date part unchanged when it cannot be read', () => {
    expect(formatSplitDate('')).toBe('')
    expect(formatSplitDate('not a date')).toBe('not a date')
    expect(formatSplitDate('2022-13-01 00:00:00')).toBe('2022-13-01')
  })
})

describe('formatSplitSummary', () => {
  it('builds "name — ratio, date"', () => {
    expect(formatSplitSummary({ name: 'Amazon', ratioLabel: '20-for-1', cutoff: '2022-06-06 02:00:00' }))
      .toBe('Amazon — 20-for-1, 6 Jun 2022')
  })
})

describe('countSplitSecurities', () => {
  it('counts distinct securities by first ISIN, falling back to name', () => {
    expect(countSplitSecurities([
      { isins: ['US67066G1040'], name: 'Nvidia' },
      { isins: ['US67066G1040'], name: 'Nvidia' },
      { isins: ['US0231351067'], name: 'Amazon' },
      { isins: [], name: 'Unknown Co' },
      { isins: [], name: 'Unknown Co' }
    ])).toBe(3)
  })
})

describe('formatSplitPhrase', () => {
  it('handles one split', () => {
    expect(formatSplitPhrase([{ ratioLabel: '20-for-1', cutoff: '2022-06-06 02:00:00' }]))
      .toBe('the 20-for-1 split on 6 Jun 2022')
  })

  it('joins several splits in date order', () => {
    expect(formatSplitPhrase([
      { ratioLabel: '10-for-1', cutoff: '2024-06-10 02:00:00' },
      { ratioLabel: '4-for-1', cutoff: '2021-07-20 02:00:00' }
    ])).toBe('the 4-for-1 split on 20 Jul 2021 and the 10-for-1 split on 10 Jun 2024')

    expect(formatSplitPhrase([
      { ratioLabel: '3-for-1', cutoff: '2023-01-01 02:00:00' },
      { ratioLabel: '2-for-1', cutoff: '2020-01-01 02:00:00' },
      { ratioLabel: '1-for-10', cutoff: '2025-01-01 02:00:00' }
    ])).toBe('the 2-for-1 split on 1 Jan 2020, the 3-for-1 split on 1 Jan 2023 and the 1-for-10 split on 1 Jan 2025')
  })

  it('returns an empty string for no splits', () => {
    expect(formatSplitPhrase([])).toBe('')
  })
})
