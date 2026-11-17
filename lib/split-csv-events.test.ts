import { describe, expect, it } from 'vitest'
import type { Trading212Transaction } from '@/types/trading212'
import {
  calendarDaysBetween,
  compareSplitTimes,
  extractCsvSplitEvents,
  formatSplitRatio,
  normalizeIsin,
  normalizeSplitTime,
  parseSplitTimeMs,
  splitTimeDistanceMs
} from './split-csv-events'

// Synthetic, made-up identifiers only.
const ISIN = 'ZZ0000000018'
const ISIN_NEW = 'ZZ0000000026'

function splitRow(
  action: string,
  time: string,
  shares: number | undefined,
  overrides: Partial<Trading212Transaction> = {}
): Trading212Transaction {
  return {
    Action: action,
    Time: time,
    ISIN,
    Ticker: 'ABC',
    Name: 'Example Corp',
    'No. of shares': shares,
    'Price / share': 10,
    'Currency (Price / share)': 'USD',
    Total: (shares ?? 0) * 10,
    'Currency (Total)': 'USD',
    ...overrides
  }
}

const close = (time: string, shares: number | undefined, o: Partial<Trading212Transaction> = {}) =>
  splitRow('Stock split close', time, shares, o)
const open = (time: string, shares: number | undefined, o: Partial<Trading212Transaction> = {}) =>
  splitRow('Stock split open', time, shares, o)

describe('time helpers', () => {
  it('normalizes T separators, fractional seconds and zone suffixes', () => {
    expect(normalizeSplitTime('2025-06-10 05:00:00')).toBe('2025-06-10 05:00:00')
    expect(normalizeSplitTime('2025-06-10T05:00:00')).toBe('2025-06-10 05:00:00')
    expect(normalizeSplitTime('2025-06-10T05:00:00.123Z')).toBe('2025-06-10 05:00:00')
    expect(normalizeSplitTime(' 2025-06-10 05:00:00.5 ')).toBe('2025-06-10 05:00:00')
    expect(normalizeSplitTime(undefined)).toBe('')
  })

  it('compares times as normalized strings', () => {
    expect(compareSplitTimes('2025-06-10T05:00:00.999', '2025-06-10 05:00:00')).toBe(0)
    expect(compareSplitTimes('2025-06-10 01:30:00', '2025-06-10 02:00:00')).toBeLessThan(0)
    expect(compareSplitTimes('2025-06-10', '2025-06-10 02:00:00')).toBeLessThan(0)
  })

  it('parses as UTC without going through new Date(string)', () => {
    expect(parseSplitTimeMs('2025-06-10 05:00:00')).toBe(Date.UTC(2025, 5, 10, 5, 0, 0))
    expect(parseSplitTimeMs('2025-06-10T05:00:00.250Z')).toBe(Date.UTC(2025, 5, 10, 5, 0, 0))
    expect(parseSplitTimeMs('2025-06-10')).toBe(Date.UTC(2025, 5, 10))
    expect(parseSplitTimeMs('2025-02-30 00:00:00')).toBeNull()
    expect(parseSplitTimeMs('2025-06-10 24:00:00')).toBeNull()
    expect(parseSplitTimeMs('10/06/2025 05:00')).toBeNull()
    expect(parseSplitTimeMs(42)).toBeNull()
  })

  it('measures distances and calendar days', () => {
    expect(splitTimeDistanceMs('2025-06-10 05:00:00', '2025-06-10T05:01:00')).toBe(60_000)
    expect(splitTimeDistanceMs('garbage', '2025-06-10 05:00:00')).toBeNull()
    expect(calendarDaysBetween('2025-06-10 23:59:59', '2025-06-17 00:00:01')).toBe(7)
    expect(calendarDaysBetween('2025-03-01 00:00:00', '2025-02-28 12:00:00')).toBe(-1)
    expect(calendarDaysBetween('nope', '2025-02-28')).toBeNull()
  })

  it('normalizes ISINs', () => {
    expect(normalizeIsin(' zz0000000018 ')).toBe(ISIN)
    expect(normalizeIsin(undefined)).toBe('')
  })
})

describe('formatSplitRatio', () => {
  it('snaps to readable labels within 0.5%', () => {
    expect(formatSplitRatio(20)).toBe('20-for-1')
    expect(formatSplitRatio(20.05)).toBe('20-for-1')
    expect(formatSplitRatio(0.1)).toBe('1-for-10')
    expect(formatSplitRatio(1 / 30.1)).toBe('1-for-30')
    expect(formatSplitRatio(1.5)).toBe('3-for-2')
    expect(formatSplitRatio(0.6667)).toBe('2-for-3')
    expect(formatSplitRatio(1.25)).toBe('5-for-4')
  })

  it('prints other ratios to 4 decimals and never labels a non-1 ratio "1-for-1"', () => {
    expect(formatSplitRatio(25 / 26)).toBe('0.9615-for-1')
    expect(formatSplitRatio(1.003)).toBe('1.0030-for-1')
  })
})

describe('extractCsvSplitEvents', () => {
  it('pairs close-then-open rows', () => {
    const rows = [close('2025-06-10 05:00:00', 3), open('2025-06-10 05:00:01', 12)]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events).toEqual([
      {
        id: `csv:${ISIN}:2025-06-10 05:00:01`,
        isins: [ISIN],
        name: 'Example Corp',
        ratio: 4,
        ratioLabel: '4-for-1',
        cutoff: '2025-06-10 05:00:01',
        source: 'csv',
        sourceTickers: ['ABC']
      }
    ])
  })

  it('pairs open-then-close rows', () => {
    const rows = [open('2025-06-10 05:00:00', 12), close('2025-06-10 05:00:01', 3)]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events).toHaveLength(1)
    expect(events[0].ratio).toBe(4)
    expect(events[0].cutoff).toBe('2025-06-10 05:00:01')
  })

  it('handles a reverse split with a different ISIN on each half', () => {
    const rows = [
      close('2025-03-03 06:00:00', 100, { ISIN }),
      open('2025-03-03 06:00:00', 10, { ISIN: ISIN_NEW })
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events).toHaveLength(1)
    expect(events[0].ratio).toBeCloseTo(0.1)
    expect(events[0].ratioLabel).toBe('1-for-10')
    expect(events[0].isins).toEqual([ISIN_NEW, ISIN])
    expect(events[0].id).toBe(`csv:${ISIN_NEW}:2025-03-03 06:00:00`)
  })

  it('never pairs halves of two different tickers, even with a shared ISIN', () => {
    // Also covers a ticker change at the split: reported as unpaired rather
    // than risking a cross-listing pair.
    const rows = [
      close('2025-03-03 06:00:00', 30, { Ticker: 'OLD' }),
      open('2025-03-03 06:00:00', 1, { Ticker: 'NEW' })
    ]
    expect(extractCsvSplitEvents(rows)).toEqual({ events: [], unpaired: rows })
  })

  it('pairs by ISIN when one half has no ticker', () => {
    const rows = [
      close('2025-03-03 06:00:00', 30, { Ticker: '' }),
      open('2025-03-03 06:00:00', 1, { Ticker: 'NEW' })
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events.map(e => [e.ratioLabel, e.sourceTickers])).toEqual([['1-for-30', ['NEW']]])
  })

  it.each([
    ['ABC close, ABCe close, ABCe open', [0, 1, 2]],
    ['ABCe open, ABCe close, ABC close', [2, 1, 0]]
  ])('does not pair a close with another listing’s open (%s)', (_label, order) => {
    const abcClose = close('2025-06-10 05:00:00', 2, { Ticker: 'ABC' })
    const abceClose = close('2025-06-10 05:00:00', 3, { Ticker: 'ABCe' })
    const abceOpen = open('2025-06-10 05:00:00', 60, { Ticker: 'ABCe' })
    const base = [abcClose, abceClose, abceOpen]
    const rows = order.map(i => base[i])
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ ratio: 20, sourceTickers: ['ABCe'] })
    expect(unpaired).toEqual([abcClose])
  })

  it('does not pair halves that share neither ticker nor ISIN', () => {
    const rows = [
      close('2025-03-03 06:00:00', 30, { Ticker: 'OLD', ISIN }),
      open('2025-03-03 06:00:00', 1, { Ticker: 'NEW', ISIN: ISIN_NEW })
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(events).toEqual([])
    expect(unpaired).toEqual(rows)
  })

  it('keeps two splits of the same ISIN apart', () => {
    const rows = [
      close('2025-01-15 06:00:00', 1),
      open('2025-01-15 06:00:01', 2),
      close('2026-02-20 06:00:00', 2),
      open('2026-02-20 06:00:00', 20)
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events.map(e => [e.ratio, e.cutoff])).toEqual([
      [2, '2025-01-15 06:00:01'],
      [10, '2026-02-20 06:00:00']
    ])
  })

  it('reports a half without its partner as unpaired', () => {
    const lonely = open('2025-06-10 05:00:01', 12)
    const other = splitRow('Market buy', '2025-06-11 15:00:00', 1)
    const { events, unpaired } = extractCsvSplitEvents([other, lonely])
    expect(events).toEqual([])
    expect(unpaired).toEqual([lonely])
  })

  it('discards pairs with a zero or missing share count', () => {
    const zero = [close('2025-06-10 05:00:00', 0), open('2025-06-10 05:00:00', 12)]
    expect(extractCsvSplitEvents(zero)).toEqual({ events: [], unpaired: zero })

    const missing = [close('2025-06-10 05:00:00', 3), open('2025-06-10 05:00:00', undefined)]
    expect(extractCsvSplitEvents(missing)).toEqual({ events: [], unpaired: missing })
  })

  it('discards a pair whose ratio is 1', () => {
    const rows = [close('2025-06-10 05:00:00', 5), open('2025-06-10 05:00:00', 5)]
    expect(extractCsvSplitEvents(rows)).toEqual({ events: [], unpaired: rows })
  })

  it('reports the legacy single "Stock Split" row as unpaired', () => {
    const legacy = splitRow('Stock Split', '2023-05-01 06:00:00', 10)
    expect(extractCsvSplitEvents([legacy])).toEqual({ events: [], unpaired: [legacy] })
  })

  it('pairs halves up to 60 seconds apart but not further', () => {
    const atLimit = [close('2025-06-10 05:00:00', 1), open('2025-06-10 05:01:00', 3)]
    expect(extractCsvSplitEvents(atLimit).events).toHaveLength(1)

    const tooFar = [close('2025-06-10 05:00:00', 1), open('2025-06-10 05:01:01', 3)]
    const result = extractCsvSplitEvents(tooFar)
    expect(result.events).toEqual([])
    expect(result.unpaired).toEqual(tooFar)
  })

  it('pairs rows with unparseable times only when the time strings are identical', () => {
    const same = [close('10/06/2025 05:00', 1), open('10/06/2025 05:00', 2)]
    expect(extractCsvSplitEvents(same).events.map(e => e.ratio)).toEqual([2])

    const different = [close('10/06/2025 05:00', 1), open('10/06/2025 05:01', 2)]
    expect(extractCsvSplitEvents(different)).toEqual({ events: [], unpaired: different })
  })

  it('pairs each close with the nearest open', () => {
    const rows = [
      close('2025-06-10 05:00:30', 2),
      open('2025-06-10 05:00:00', 99),
      open('2025-06-10 05:00:31', 6)
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(events.map(e => e.ratio)).toEqual([3])
    expect(unpaired).toEqual([rows[1]])
  })

  it('accepts T-separated times and fractional seconds', () => {
    const rows = [close('2025-06-10T05:00:00.123Z', 3), open('2025-06-10 05:00:01.900', 12)]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events).toHaveLength(1)
    expect(events[0].cutoff).toBe('2025-06-10 05:00:01')
  })

  it('pairs two listings of one ISIN in the same second without cross-pairing, as one event', () => {
    // USD and EUR listings of the same security, all four rows in the same
    // second, interleaved so that ISIN-only pairing would cross them.
    const rows = [
      close('2025-06-10 05:00:00', 2, { Ticker: 'ABC', 'Currency (Price / share)': 'USD' }),
      open('2025-06-10 05:00:00', 60, { Ticker: 'ABCe', 'Currency (Price / share)': 'EUR' }),
      close('2025-06-10 05:00:00', 3, { Ticker: 'ABCe', 'Currency (Price / share)': 'EUR' }),
      open('2025-06-10 05:00:00', 40, { Ticker: 'ABC', 'Currency (Price / share)': 'USD' })
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events).toHaveLength(1)
    expect(events[0].ratio).toBe(20)
    expect(events[0].isins).toEqual([ISIN])
  })

  it('merges same-ISIN events whose cut-offs are within 60 seconds, unioning ISINs', () => {
    const rows = [
      close('2025-06-10 05:00:00', 2, { Ticker: 'ABC' }),
      open('2025-06-10 05:00:00', 40, { Ticker: 'ABC' }),
      close('2025-06-10 05:00:30', 3, { Ticker: 'ABCe', ISIN }),
      open('2025-06-10 05:00:31', 60, { Ticker: 'ABCe', ISIN: ISIN_NEW })
    ]
    const { events } = extractCsvSplitEvents(rows)
    expect(events).toHaveLength(1)
    expect(events[0].ratio).toBe(20)
    expect(events[0].isins.sort()).toEqual([ISIN, ISIN_NEW].sort())
    expect(events[0].cutoff).toBe('2025-06-10 05:00:31')
  })

  it('keeps per-listing events further than 60 seconds apart, each with its own source ticker', () => {
    // Each listing keeps its own cut-off; lib/split-adjuster.ts makes every
    // ticker use only one of them (see its "one split recorded per listing" tests).
    const rows = [
      close('2025-06-10 05:00:00', 2, { Ticker: 'ABC' }),
      open('2025-06-10 05:00:00', 40, { Ticker: 'ABC' }),
      close('2025-06-10 05:02:00', 3, { Ticker: 'ABCe' }),
      open('2025-06-10 05:02:00', 60, { Ticker: 'ABCe' })
    ]
    const { events } = extractCsvSplitEvents(rows)
    expect(events.map(e => [e.cutoff, e.sourceTickers])).toEqual([
      ['2025-06-10 05:00:00', ['ABC']],
      ['2025-06-10 05:02:00', ['ABCe']]
    ])
  })

  it('carries the union of source tickers on a merged same-second event', () => {
    const rows = [
      close('2025-06-10 05:00:00', 2, { Ticker: 'ABC' }),
      open('2025-06-10 05:00:00', 40, { Ticker: 'ABC' }),
      close('2025-06-10 05:00:00', 3, { Ticker: 'ABCe' }),
      open('2025-06-10 05:00:00', 60, { Ticker: 'ABCe' })
    ]
    const { events } = extractCsvSplitEvents(rows)
    expect(events).toHaveLength(1)
    expect(events[0].sourceTickers).toEqual(['ABC', 'ABCe'])
  })

  it('falls back to the ticker when no row of that ticker carries an ISIN', () => {
    const rows = [
      close('2025-06-10 05:00:00', 1, { ISIN: '' }),
      open('2025-06-10 05:00:00', 5, { ISIN: undefined }),
      splitRow('Market buy', '2025-01-10 15:00:00', 1, { ISIN: '' }),
      splitRow('Market buy', '2025-01-10 15:00:00', 1, { Ticker: 'XYZ' }) // other ticker's ISIN is not borrowed
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events).toEqual([
      {
        id: 'csv:ABC:2025-06-10 05:00:00',
        isins: [],
        name: 'Example Corp',
        ratio: 5,
        ratioLabel: '5-for-1',
        cutoff: '2025-06-10 05:00:00',
        source: 'csv',
        sourceTickers: ['ABC']
      }
    ])
  })

  it('fills in the ISIN from other rows of the same ticker when the split rows carry none', () => {
    const rows = [
      splitRow('Dividend (Dividend)', '2025-01-10 12:00:00', 1, { ISIN: ' zz0000000018 ' }),
      close('2025-06-10 05:00:00', 1, { ISIN: '' }),
      open('2025-06-10 05:00:00', 5, { ISIN: '' })
    ]
    const { events } = extractCsvSplitEvents(rows)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ id: `csv:${ISIN}:2025-06-10 05:00:00`, isins: [ISIN], sourceTickers: ['ABC'] })
  })

  it('merges an ISIN-less pair with another listing’s same-second pair once its ISIN is filled in', () => {
    const rows = [
      splitRow('Market buy', '2025-01-10 15:00:00', 1, { Ticker: 'ABC' }),
      close('2025-06-10 05:00:00', 1, { Ticker: 'ABC', ISIN: '' }),
      open('2025-06-10 05:00:00', 4, { Ticker: 'ABC', ISIN: '' }),
      close('2025-06-10 05:00:00', 2, { Ticker: 'ABCe' }),
      open('2025-06-10 05:00:00', 8, { Ticker: 'ABCe' })
    ]
    const { events } = extractCsvSplitEvents(rows)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ isins: [ISIN], ratio: 4, sourceTickers: ['ABC', 'ABCe'] })
  })

  it('compares ISINs trimmed and case-insensitively and falls back to the ticker for the name', () => {
    const rows = [
      close('2025-06-10 05:00:00', 1, { ISIN: ' zz0000000018', Ticker: undefined, Name: '' }),
      open('2025-06-10 05:00:00', 2, { ISIN: 'ZZ0000000018 ', Ticker: 'A2', Name: undefined })
    ]
    const { events } = extractCsvSplitEvents(rows)
    expect(events).toHaveLength(1)
    expect(events[0].isins).toEqual([ISIN])
    expect(events[0].name).toBe('A2')
  })

  it('accepts split actions case-insensitively and ignores other rows', () => {
    const rows = [
      splitRow('Market buy', '2025-06-09 15:00:00', 1),
      splitRow('stock split CLOSE', '2025-06-10 05:00:00', 1),
      splitRow(' Stock split open ', '2025-06-10 05:00:00', 2),
      splitRow('Dividend (Dividend)', '2025-06-11 15:00:00', 1)
    ]
    const { events, unpaired } = extractCsvSplitEvents(rows)
    expect(events.map(e => e.ratio)).toEqual([2])
    expect(unpaired).toEqual([])
  })
})
