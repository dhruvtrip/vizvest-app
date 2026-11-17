import { describe, expect, it } from 'vitest'
import type { NormalizedTransaction, SplitEvent, Trading212Transaction } from '@/types/trading212'
import { getAdjustedPricePerShare, getAdjustedShares, isBuyAction } from './transaction-utils'
import { applySplitAdjustments, classifyRowForSplit, resolveSplitEvents } from './split-adjuster'

// Synthetic ISINs that are not in the bundled table
const FAKE_ISIN = 'ZZ0000000018'
const FAKE_ISIN_2 = 'ZZ0000000026'

// Real entries of lib/split-table.ts
const AMAZON = 'US0231351067' // 20-for-1, 2022-06-06
const NVIDIA = 'US67066G1040' // 4-for-1 2021-07-20, 10-for-1 2024-06-10
const LAM_NEW = 'US5128073062' // Lam Research, 10-for-1 2024-10-03, ISIN changed
const LAM_OLD = 'US5128071082'
const COMPASS = 'GB00BD6K4575' // Compass Group, 25-for-26 2017-06-27
const PALO_ALTO = 'US6974351057' // 2-for-1 2024-12-16 (and 3-for-1 2022-09-14)
const APPLE = 'US0378331005' // 4-for-1 2020-08-31

interface TradeOptions {
  ticker?: string
  isin?: string
  currency?: string
  result?: number
}

function trade(
  action: string,
  time: string,
  shares: number,
  price: number,
  { ticker = 'ABC', isin = FAKE_ISIN, currency = 'USD', result }: TradeOptions = {}
): NormalizedTransaction {
  const total = Math.round(shares * price * 100) / 100
  return {
    Action: action,
    Time: time,
    ISIN: isin,
    Ticker: ticker,
    Name: 'Example Corp',
    ID: `${ticker}-${time}-${action}`,
    'No. of shares': shares,
    'Price / share': price,
    'Currency (Price / share)': currency,
    'Exchange rate': 1,
    Result: result,
    Total: total,
    'Currency (Total)': 'USD',
    totalInBaseCurrency: total,
    detectedBaseCurrency: 'USD'
  }
}

const buy = (time: string, shares: number, price: number, o?: TradeOptions) =>
  trade('Market buy', time, shares, price, o)
const sell = (time: string, shares: number, price: number, o?: TradeOptions) =>
  trade('Market sell', time, shares, price, { result: 0, ...o })

function splitRow(
  action: string,
  time: string,
  shares: number,
  { ticker = 'ABC', isin = FAKE_ISIN }: TradeOptions = {}
): NormalizedTransaction {
  return {
    Action: action,
    Time: time,
    ISIN: isin,
    Ticker: ticker,
    Name: 'Example Corp',
    'No. of shares': shares,
    'Price / share': 10,
    'Currency (Price / share)': 'USD',
    Total: shares * 10,
    'Currency (Total)': 'USD',
    totalInBaseCurrency: shares * 10,
    detectedBaseCurrency: 'USD'
  }
}

function event(overrides: Partial<SplitEvent> = {}): SplitEvent {
  const base: SplitEvent = {
    id: '',
    isins: [FAKE_ISIN],
    name: 'Example Corp',
    ratio: 4,
    ratioLabel: '4-for-1',
    cutoff: '2023-03-01 02:00:00',
    source: 'table',
    ...overrides
  }
  return { ...base, id: base.id || `${base.source}:${base.isins[0] ?? base.sourceTickers?.[0]}:${base.cutoff}` }
}

function adjustedBalance(rows: NormalizedTransaction[], ticker?: string): number {
  return rows
    .filter(r => (ticker ? r.Ticker === ticker : true))
    .reduce((sum, r) => {
      if (isBuyAction(r.Action)) return sum + getAdjustedShares(r)
      if (r.Action === 'Market sell') return sum - getAdjustedShares(r)
      return sum
    }, 0)
}

function deepFreeze<T>(rows: T[]): T[] {
  rows.forEach(r => Object.freeze(r))
  return Object.freeze(rows) as T[]
}

/** resolve + apply, the way the store runs them */
function run(rows: NormalizedTransaction[]) {
  const { events, unpaired } = resolveSplitEvents(rows)
  return { ...applySplitAdjustments(rows, events), events, unpaired }
}

describe('applySplitAdjustments', () => {
  it('buy 1 at 200 before a 4-for-1, sell 4 at 50 after: balance 0, buy price 50, totals unchanged', () => {
    const rows = [buy('2023-01-10 15:00:00', 1, 200), sell('2023-06-10 15:00:00', 4, 50)]
    const { transactions, applied } = applySplitAdjustments(rows, [event()])

    expect(adjustedBalance(transactions)).toBe(0)
    expect(transactions[0]).toMatchObject({
      adjustedShares: 4,
      adjustedPricePerShare: 50,
      splitFactor: 4,
      'No. of shares': 1,
      'Price / share': 200,
      Total: 200,
      totalInBaseCurrency: 200
    })
    // Post-split row: no annotation at all, same object
    expect(transactions[1]).toBe(rows[1])
    expect(transactions[1]).not.toHaveProperty('splitFactor')
    expect(transactions[1]).not.toHaveProperty('adjustedShares')

    expect(applied).toEqual([{ ...event(), tickers: ['ABC'], rowsAdjusted: 1 }])
  })

  it('compounds two splits (4-for-1 then 10-for-1 gives 40 for the earliest rows)', () => {
    const e1 = event({ ratio: 4, cutoff: '2021-07-20 02:00:00' })
    const e2 = event({ ratio: 10, ratioLabel: '10-for-1', cutoff: '2024-06-10 02:00:00' })
    const rows = [
      buy('2021-01-05 15:00:00', 1, 500),
      buy('2022-01-05 15:00:00', 1, 250),
      buy('2025-01-05 15:00:00', 1, 140)
    ]
    const { transactions, applied } = applySplitAdjustments(rows, [e2, e1])
    expect(transactions.map(t => t.splitFactor)).toEqual([40, 10, undefined])
    expect(transactions.map(getAdjustedShares)).toEqual([40, 10, 1])
    expect(transactions.map(getAdjustedPricePerShare)).toEqual([12.5, 25, 140])
    expect(applied.map(a => [a.cutoff, a.rowsAdjusted])).toEqual([
      ['2021-07-20 02:00:00', 1],
      ['2024-06-10 02:00:00', 2]
    ])
  })

  it('handles a reverse split (ratio 0.1)', () => {
    const e = event({ ratio: 0.1, ratioLabel: '1-for-10' })
    const rows = [buy('2023-01-10 15:00:00', 100, 1), sell('2023-06-10 15:00:00', 10, 10)]
    const { transactions } = applySplitAdjustments(rows, [e])
    expect(transactions[0]).toMatchObject({ adjustedShares: 10, adjustedPricePerShare: 10, splitFactor: 0.1 })
    expect(adjustedBalance(transactions)).toBe(0)
  })

  it('adjusts one ISIN under two tickers, each by its own rows', () => {
    const rows = [
      buy('2022-05-02 15:00:00', 1, 2400, { ticker: 'AMZN', isin: AMAZON }),
      buy('2022-05-03 09:00:00', 2, 2200, { ticker: 'AMZ', isin: AMAZON, currency: 'EUR' }),
      sell('2022-07-01 09:00:00', 40, 105, { ticker: 'AMZ', isin: AMAZON, currency: 'EUR' })
    ]
    const { transactions, applied } = run(rows)
    expect(transactions.map(t => t.splitFactor)).toEqual([20, 20, undefined])
    expect(adjustedBalance(transactions, 'AMZN')).toBe(20)
    expect(adjustedBalance(transactions, 'AMZ')).toBe(0)
    expect(applied).toHaveLength(1)
    expect(applied[0]).toMatchObject({
      id: `table:${AMAZON}:2022-06-06 02:00:00`,
      name: 'Amazon',
      ratio: 20,
      ratioLabel: '20-for-1',
      source: 'table',
      tickers: ['AMZN', 'AMZ'],
      rowsAdjusted: 2
    })
  })

  it('decides per ticker: a listing closed before the split is left alone while another is adjusted', () => {
    const rows = [
      buy('2022-05-02 15:00:00', 1, 2400, { ticker: 'AMZN', isin: AMAZON }),
      buy('2022-05-03 09:00:00', 2, 2200, { ticker: 'AMZ', isin: AMAZON, currency: 'EUR' }),
      sell('2022-05-20 09:00:00', 2, 2000, { ticker: 'AMZ', isin: AMAZON, currency: 'EUR' })
    ]
    const { transactions, applied } = run(rows)
    expect(transactions.map(t => t.splitFactor)).toEqual([20, undefined, undefined])
    expect(applied[0].tickers).toEqual(['AMZN'])
  })

  it('leaves a position closed before the split with no later trades unadjusted', () => {
    const rows = [buy('2023-01-10 15:00:00', 2, 200), sell('2023-02-10 15:00:00', 2, 210)]
    const { transactions, applied } = applySplitAdjustments(rows, [event()])
    expect(transactions).toEqual(rows)
    expect(transactions[0]).toBe(rows[0])
    expect(applied).toEqual([])
  })

  it('leaves a sells-only history (negative balance) with no later trades unadjusted', () => {
    const rows = [sell('2023-01-10 15:00:00', 3, 200), sell('2023-02-10 15:00:00', 1, 210)]
    const { transactions, applied } = applySplitAdjustments(rows, [event()])
    expect(transactions.every(t => t.splitFactor === undefined)).toBe(true)
    expect(applied).toEqual([])
  })

  it('adjusts a position still held with no trades after the split', () => {
    const rows = [buy('2023-01-10 15:00:00', 2, 200), sell('2023-02-10 15:00:00', 1, 210)]
    const { transactions, applied } = applySplitAdjustments(rows, [event()])
    expect(transactions.map(t => t.splitFactor)).toEqual([4, 4])
    expect(adjustedBalance(transactions)).toBe(4)
    expect(applied[0].rowsAdjusted).toBe(2)
  })

  it('does not adjust when every trade is after the split', () => {
    const rows = [buy('2023-04-10 15:00:00', 2, 50)]
    expect(applySplitAdjustments(rows, [event()]).applied).toEqual([])
  })

  it('uses the balance adjusted for earlier splits to decide whether a later split applies', () => {
    // 1 share, then 2-for-1 (2 shares), sell 1.5 -> still holding 0.5 at the second split.
    // Unadjusted, the balance would be 1 - 1.5 < 0 and the second split would be skipped.
    const e1 = event({ ratio: 2, ratioLabel: '2-for-1', cutoff: '2022-01-10 02:00:00' })
    const e2 = event({ ratio: 3, ratioLabel: '3-for-1', cutoff: '2023-01-10 02:00:00' })
    const rows = [buy('2021-06-01 15:00:00', 1, 100), sell('2022-06-01 15:00:00', 1.5, 60)]
    const { transactions, applied } = applySplitAdjustments(rows, [e1, e2])
    expect(transactions.map(t => t.splitFactor)).toEqual([6, 3])
    expect(adjustedBalance(transactions)).toBeCloseTo(1.5)
    expect(applied).toHaveLength(2)
  })

  it('adjusts rows carrying either the old or the new ISIN of a security whose ISIN changed', () => {
    const rows = [
      buy('2024-03-01 15:00:00', 1, 900, { ticker: 'LRCX', isin: LAM_OLD }),
      buy('2024-05-01 15:00:00', 1, 950, { ticker: 'LRCX', isin: LAM_NEW }),
      buy('2024-05-02 15:00:00', 1, 940, { ticker: 'LRCXx', isin: LAM_OLD })
    ]
    const { transactions, events } = run(rows)
    expect(events).toHaveLength(1)
    expect(events[0].isins).toEqual([LAM_NEW, LAM_OLD])
    expect(transactions.map(t => t.splitFactor)).toEqual([10, 10, 10])
  })

  it('treats a row at 01:30 on the effective date as pre-split and one at 07:00 as post-split', () => {
    const rows = [
      buy('2022-06-06 01:30:00', 1, 2400, { ticker: 'AMZN', isin: AMAZON }),
      sell('2022-06-06 07:00:00', 20, 122, { ticker: 'AMZN', isin: AMAZON })
    ]
    const { transactions } = run(rows)
    expect(transactions.map(t => t.splitFactor)).toEqual([20, undefined])
    expect(adjustedBalance(transactions)).toBe(0)
  })

  it('reads T-separated and fractional-second times correctly', () => {
    const rows = [
      buy('2022-06-06T01:30:00.000Z', 1, 2400, { ticker: 'AMZN', isin: AMAZON }),
      sell('2022-06-06T07:00:00.5', 20, 122, { ticker: 'AMZN', isin: AMAZON })
    ]
    expect(run(rows).transactions.map(t => t.splitFactor)).toEqual([20, undefined])
  })

  it('divides the price in each listing’s own currency (EUR and GBX) and leaves totals alone', () => {
    const rows = [
      buy('2023-01-10 09:00:00', 2, 180, { ticker: 'ABCe', currency: 'EUR' }),
      buy('2023-01-11 09:00:00', 3, 15000, { ticker: 'ABCl', currency: 'GBX' })
    ]
    const before = structuredClone(rows)
    const { transactions } = applySplitAdjustments(rows, [event()])
    expect(transactions[0]).toMatchObject({
      adjustedPricePerShare: 45,
      adjustedShares: 8,
      'Currency (Price / share)': 'EUR',
      Total: before[0].Total,
      totalInBaseCurrency: before[0].totalInBaseCurrency
    })
    expect(transactions[1]).toMatchObject({
      adjustedPricePerShare: 3750,
      adjustedShares: 12,
      'Currency (Price / share)': 'GBX',
      Total: before[1].Total,
      totalInBaseCurrency: before[1].totalInBaseCurrency
    })
  })

  it('never mutates inputs, leaves dividend and split rows untouched and keeps row order', () => {
    const rows = deepFreeze([
      buy('2023-01-10 15:00:00', 1, 200),
      {
        ...trade('Dividend (Dividend)', '2023-02-01 12:00:00', 1, 0.5),
        Result: undefined
      },
      sell('2023-02-10 15:00:00', 0.5, 210, { result: 5 }),
      splitRow('Stock split close', '2023-03-01 01:00:00', 0.5),
      splitRow('Stock split open', '2023-03-01 01:00:00', 2),
      sell('2023-06-10 15:00:00', 2, 50, { result: -2 })
    ])
    const snapshot = structuredClone([...rows])
    const { transactions } = applySplitAdjustments(rows, [event()])

    expect([...rows]).toEqual(snapshot)
    expect(transactions.map(t => t.Action)).toEqual(snapshot.map(t => t.Action))
    expect(transactions[1]).toBe(rows[1])
    expect(transactions[3]).toBe(rows[3])
    expect(transactions[4]).toBe(rows[4])
    transactions.forEach((t, i) => {
      expect(t['No. of shares']).toBe(snapshot[i]['No. of shares'])
      expect(t['Price / share']).toBe(snapshot[i]['Price / share'])
      expect(t.Total).toBe(snapshot[i].Total)
      expect(t.totalInBaseCurrency).toBe(snapshot[i].totalInBaseCurrency)
      expect(t.Result).toBe(snapshot[i].Result)
    })
    expect(transactions[0].splitFactor).toBe(4)
    expect(transactions[2].splitFactor).toBe(4)
  })

  it('matches an event without ISINs by sourceTickers only', () => {
    const e = event({ isins: [], sourceTickers: ['ABC'], source: 'csv', cutoff: '2025-06-10 05:00:00' })
    const rows = [
      buy('2025-01-10 15:00:00', 1, 100, { ticker: 'ABC', isin: FAKE_ISIN }),
      buy('2025-01-10 15:00:00', 1, 100, { ticker: 'XYZ', isin: FAKE_ISIN })
    ]
    const { transactions, applied } = applySplitAdjustments(rows, [e])
    expect(transactions.map(t => t.splitFactor)).toEqual([4, undefined])
    expect(applied[0].tickers).toEqual(['ABC'])
  })

  it('lets a row without an ISIN follow the rest of its ticker', () => {
    const rows = [
      buy('2023-01-10 15:00:00', 1, 200, { isin: '' }),
      buy('2023-01-11 15:00:00', 1, 200)
    ]
    const { transactions } = applySplitAdjustments(rows, [event()])
    expect(transactions.map(t => t.splitFactor)).toEqual([4, 4])
  })

  it('does not adjust rows of a ticker whose ISIN does not match the event', () => {
    const rows = [buy('2023-01-10 15:00:00', 1, 200, { isin: FAKE_ISIN_2 })]
    expect(applySplitAdjustments(rows, [event()]).transactions[0]).toBe(rows[0])
  })

  it('uses the same classification for relevance and the factor (boundary guard)', () => {
    // EUR line of Amazon: a sell timed one day after the cut-off at the
    // pre-split price closes the position before the split. Nothing is
    // adjusted; with the plain date rule the buy would have been x20.
    const opts = { ticker: 'AMZ', isin: AMAZON, currency: 'EUR' }
    const rows = [buy('2022-05-02 09:00:00', 1, 2200, opts), sell('2022-06-07 09:00:00', 1, 2150, opts)]
    const { transactions, applied } = run(rows)
    expect(transactions.every(t => t.splitFactor === undefined)).toBe(true)
    expect(applied).toEqual([])
  })

  it('applies the boundary guard end to end for a lagging EUR listing', () => {
    const opts = { ticker: 'AMZ', isin: AMAZON, currency: 'EUR' }
    const rows = [
      buy('2022-05-02 09:00:00', 1, 2200, opts),
      buy('2022-06-07 09:00:00', 1, 2150, opts), // venue not yet adjusted
      buy('2022-06-08 09:00:00', 10, 110, opts), // adjusted price
      sell('2022-08-01 09:00:00', 50, 125, opts)
    ]
    const { transactions } = run(rows)
    expect(transactions.map(t => t.splitFactor)).toEqual([20, 20, undefined, undefined])
    expect(adjustedBalance(transactions)).toBe(0)
  })
})

describe('classifyRowForSplit', () => {
  const amazon = event({ isins: [AMAZON], ratio: 20, ratioLabel: '20-for-1', cutoff: '2022-06-06 02:00:00' })
  const eur = { ticker: 'AMZ', isin: AMAZON, currency: 'EUR' }
  const reference = buy('2022-05-20 09:00:00', 1, 2100, eur)

  it('applies the date rule outside the guard window', () => {
    const row = buy('2022-05-01 09:00:00', 1, 105, eur)
    expect(classifyRowForSplit(row, amazon, [reference, row], [amazon])).toBe('pre')
  })

  it('treats a trade one day after the cut-off at the pre-split price as pre-split', () => {
    const row = buy('2022-06-07 09:00:00', 1, 2120, eur)
    expect(classifyRowForSplit(row, amazon, [reference, row], [amazon])).toBe('pre')
  })

  it('treats a trade one day after the cut-off at the post-split price as post-split', () => {
    const row = buy('2022-06-07 09:00:00', 1, 106, eur)
    expect(classifyRowForSplit(row, amazon, [reference, row], [amazon])).toBe('post')
  })

  it('uses a post-split reference too', () => {
    const later = buy('2022-07-01 09:00:00', 1, 110, eur)
    const pre = buy('2022-06-05 15:00:00', 1, 2150, eur) // one day before, pre-split price
    const post = buy('2022-06-05 15:00:00', 1, 110, eur) // one day before, post-split price
    expect(classifyRowForSplit(pre, amazon, [later, pre], [amazon])).toBe('pre')
    expect(classifyRowForSplit(post, amazon, [later, post], [amazon])).toBe('post')
  })

  it('falls back to the date rule without a reference trade', () => {
    const row = buy('2022-06-07 09:00:00', 1, 2120, eur)
    const inWindow = buy('2022-06-08 09:00:00', 1, 2100, eur)
    expect(classifyRowForSplit(row, amazon, [row, inWindow], [amazon])).toBe('post')
  })

  it('only takes references in the same price currency', () => {
    const usd = buy('2022-05-20 15:00:00', 1, 2200, { ticker: 'AMZ', isin: AMAZON, currency: 'USD' })
    const row = buy('2022-06-07 09:00:00', 1, 2120, eur)
    expect(classifyRowForSplit(row, amazon, [usd, row], [amazon])).toBe('post')
  })

  it('never uses the guard for CSV events', () => {
    const csv = { ...amazon, source: 'csv' as const, id: 'csv:x' }
    const row = buy('2022-06-07 09:00:00', 1, 2120, eur)
    expect(classifyRowForSplit(row, csv, [reference, row], [csv])).toBe('post')
  })

  it('never uses the guard for a 25-for-26 consolidation', () => {
    const rows = [
      buy('2017-06-01 09:00:00', 10, 1600, { ticker: 'CPG', isin: COMPASS, currency: 'GBX' }),
      buy('2017-06-28 09:00:00', 1, 1600, { ticker: 'CPG', isin: COMPASS, currency: 'GBX' })
    ]
    const { events } = resolveSplitEvents(rows)
    expect(events).toHaveLength(1)
    expect(events[0].ratio).toBeCloseTo(25 / 26)
    expect(events[0].ratioLabel).toBe('25-for-26')
    // Same price as the pre-split reference, yet post-split by date.
    expect(classifyRowForSplit(rows[1], events[0], rows, events)).toBe('post')
  })

  it('ignores a reference with another split of the ticker between it and the cut-off', () => {
    const e1 = event({ ratio: 2, ratioLabel: '2-for-1', cutoff: '2024-05-01 02:00:00' })
    const e2 = event({ ratio: 2, ratioLabel: '2-for-1', cutoff: '2024-06-10 02:00:00' })
    // Price levels: 400 before e1, 200 between, 100 after e2.
    const beforeE1 = buy('2024-04-25 15:00:00', 1, 400) // nearest, but e1 is in between
    const afterE2 = buy('2024-08-01 15:00:00', 1, 100)
    const lagging = buy('2024-06-11 15:00:00', 1, 200) // venue not yet adjusted for e2

    // Without knowing about e1, the old reference would wrongly say "post".
    expect(classifyRowForSplit(lagging, e2, [beforeE1, lagging], [e2])).toBe('post')
    // Knowing about e1, that reference is rejected; with no other reference the date rule applies.
    expect(classifyRowForSplit(lagging, e2, [beforeE1, lagging], [e1, e2])).toBe('post')
    // With another usable reference, it is used instead.
    expect(classifyRowForSplit(lagging, e2, [beforeE1, afterE2, lagging], [e1, e2])).toBe('pre')
    // And the intervening-split rejection is what made the difference.
    expect(classifyRowForSplit(lagging, e2, [beforeE1, afterE2, lagging], [e2])).toBe('post')
  })

  it('keeps the guard window from 1 day before to 7 days after the cut-off', () => {
    const justOutsideBefore = buy('2022-06-05 01:59:59', 1, 110, eur)
    const justOutsideAfter = buy('2022-06-13 02:00:01', 1, 2120, eur)
    expect(classifyRowForSplit(justOutsideBefore, amazon, [reference, justOutsideBefore], [amazon])).toBe('pre')
    expect(classifyRowForSplit(justOutsideAfter, amazon, [reference, justOutsideAfter], [amazon])).toBe('post')
  })
})

describe('resolveSplitEvents', () => {
  it('builds table events for every split of a matched security, sorted by cut-off', () => {
    const rows = [buy('2020-01-10 15:00:00', 1, 250, { ticker: 'NVDA', isin: NVIDIA.toLowerCase() })]
    const { events, unpaired } = resolveSplitEvents(rows)
    expect(unpaired).toEqual([])
    expect(events).toEqual([
      {
        id: `table:${NVIDIA}:2021-07-20 02:00:00`,
        isins: [NVIDIA],
        name: 'Nvidia',
        ratio: 4,
        ratioLabel: '4-for-1',
        cutoff: '2021-07-20 02:00:00',
        source: 'table'
      },
      {
        id: `table:${NVIDIA}:2024-06-10 02:00:00`,
        isins: [NVIDIA],
        name: 'Nvidia',
        ratio: 10,
        ratioLabel: '10-for-1',
        cutoff: '2024-06-10 02:00:00',
        source: 'table'
      }
    ])
  })

  it('compounds both Nvidia splits for a share bought before the first', () => {
    const opts = { ticker: 'NVDA', isin: NVIDIA }
    const rows = [buy('2021-01-10 15:00:00', 1, 520, opts), sell('2025-02-10 15:00:00', 40, 130, opts)]
    const { transactions } = run(rows)
    expect(transactions[0].splitFactor).toBe(40)
    expect(adjustedBalance(transactions)).toBe(0)
  })

  it('ignores ISINs on non-trade rows and unknown ISINs', () => {
    const dividend = { ...trade('Dividend (Dividend)', '2023-01-01 12:00:00', 1, 1, { isin: AMAZON }) }
    const rows = [dividend, buy('2023-01-10 15:00:00', 1, 10)]
    expect(resolveSplitEvents(rows).events).toEqual([])
  })

  it('returns unpaired split rows', () => {
    const lonely = splitRow('Stock split open', '2025-06-10 05:00:00', 4)
    const legacy = splitRow('Stock Split', '2025-06-11 05:00:00', 4)
    expect(resolveSplitEvents([lonely, legacy]).unpaired).toEqual([lonely, legacy])
  })

  it('applies a split described by both a CSV pair and the table once, as the CSV event', () => {
    const opts = { ticker: 'PANW', isin: PALO_ALTO }
    const rows = [
      buy('2024-10-01 15:00:00', 3, 360, opts),
      splitRow('Stock split close', '2024-12-14 07:30:00', 3, opts),
      splitRow('Stock split open', '2024-12-14 07:30:01', 6, opts),
      sell('2025-01-10 15:00:00', 6, 185, opts)
    ]
    const { transactions, applied, events } = run(rows)
    // The 2022 table split stays (no CSV event near it); the 2024 one is replaced.
    expect(events.map(e => [e.source, e.cutoff])).toEqual([
      ['table', '2022-09-14 02:00:00'],
      ['csv', '2024-12-14 07:30:01']
    ])
    expect(transactions[0].splitFactor).toBe(2)
    expect(adjustedBalance(transactions)).toBe(0)
    expect(applied).toHaveLength(1)
    expect(applied[0]).toMatchObject({ source: 'csv', ratio: 2, tickers: ['PANW'], rowsAdjusted: 1 })
  })

  it('lets CSV events win only within 7 calendar days', () => {
    const opts = { ticker: 'PANW', isin: PALO_ALTO }
    const pair = (date: string) => [
      splitRow('Stock split close', `${date} 07:30:00`, 3, opts),
      splitRow('Stock split open', `${date} 07:30:00`, 6, opts)
    ]
    const trades = [buy('2024-10-01 15:00:00', 3, 360, opts)]

    const within = resolveSplitEvents([...trades, ...pair('2024-12-23')]).events
    expect(within.filter(e => e.cutoff.startsWith('2024-12')).map(e => e.source)).toEqual(['csv'])

    const outside = resolveSplitEvents([...trades, ...pair('2024-12-24')]).events
    expect(outside.filter(e => e.cutoff.startsWith('2024-12')).map(e => e.source)).toEqual(['table', 'csv'])
  })

  it('lets a CSV pair without ISINs win over the table once its ISIN is filled in from the trades', () => {
    const rows = [
      buy('2024-10-01 15:00:00', 3, 360, { ticker: 'PANW', isin: PALO_ALTO }),
      splitRow('Stock split close', '2024-12-16 07:30:00', 3, { ticker: 'PANW', isin: '' }),
      splitRow('Stock split open', '2024-12-16 07:30:00', 6, { ticker: 'PANW', isin: '' })
    ]
    const { events, transactions } = run(rows)
    expect(events.filter(e => e.cutoff.startsWith('2024-12')).map(e => e.source)).toEqual(['csv'])
    expect(transactions[0].splitFactor).toBe(2)
  })

  it('applies one CSV split once to two listings that both carry split rows', () => {
    const usd = { ticker: 'ABC', isin: FAKE_ISIN }
    const eur = { ticker: 'ABCe', isin: FAKE_ISIN }
    const rows = [
      buy('2025-01-10 15:00:00', 1, 400, usd),
      buy('2025-01-10 09:00:00', 2, 380, { ...eur, currency: 'EUR' }),
      splitRow('Stock split close', '2025-06-10 05:00:00', 1, usd),
      splitRow('Stock split close', '2025-06-10 05:00:00', 2, eur),
      splitRow('Stock split open', '2025-06-10 05:00:00', 8, eur),
      splitRow('Stock split open', '2025-06-10 05:00:00', 4, usd)
    ]
    const { transactions, applied } = run(rows)
    expect(transactions[0].adjustedShares).toBe(4)
    expect(transactions[1].adjustedShares).toBe(8)
    expect(applied).toHaveLength(1)
    expect(applied[0].tickers).toEqual(['ABC', 'ABCe'])
  })
})

describe('one split recorded once per listing', () => {
  const usd = { ticker: 'ABC', isin: FAKE_ISIN }
  const eur = { ticker: 'ABCe', isin: FAKE_ISIN, currency: 'EUR' }
  const gbx = { ticker: 'ABCx', isin: FAKE_ISIN, currency: 'GBX' }

  it.each([
    ['a day apart', '2025-06-11 05:00:00', '2025-06-10 15:00:00'],
    ['two minutes apart', '2025-06-10 05:02:00', '2025-06-10 05:01:00']
  ])('lets each listing follow its own event when the pairs are %s', (_label, eurCutoff, between) => {
    const rows = [
      buy('2025-01-10 15:00:00', 1, 400, usd),
      buy('2025-01-10 09:00:00', 2, 380, eur),
      splitRow('Stock split close', '2025-06-10 05:00:00', 1, usd),
      splitRow('Stock split open', '2025-06-10 05:00:00', 4, usd),
      splitRow('Stock split close', eurCutoff, 2, eur),
      splitRow('Stock split open', eurCutoff, 8, eur),
      // Between the two cut-offs: post-split on the USD line, pre-split on the EUR line
      buy(between, 1, 100, usd),
      buy(between, 1, 380, eur)
    ]
    const { transactions, applied, events } = run(rows)
    expect(events).toHaveLength(2)

    expect(transactions[0]).toMatchObject({ splitFactor: 4, adjustedShares: 4 })
    expect(transactions[1]).toMatchObject({ splitFactor: 4, adjustedShares: 8 })
    expect(transactions[6].splitFactor).toBeUndefined()
    expect(transactions[7]).toMatchObject({ splitFactor: 4, adjustedShares: 4 })

    expect(applied.map(a => [a.cutoff, a.tickers, a.rowsAdjusted])).toEqual([
      ['2025-06-10 05:00:00', ['ABC'], 1],
      [eurCutoff, ['ABCe'], 2]
    ])
  })

  it('makes a listing without split rows of its own follow the earliest event, once', () => {
    const rows = [
      buy('2025-01-10 15:00:00', 1, 400, usd),
      buy('2025-01-10 09:00:00', 2, 380, eur),
      buy('2025-01-10 09:00:00', 3, 30000, gbx),
      splitRow('Stock split close', '2025-06-10 05:00:00', 1, usd),
      splitRow('Stock split open', '2025-06-10 05:00:00', 4, usd),
      splitRow('Stock split close', '2025-06-11 05:00:00', 2, eur),
      splitRow('Stock split open', '2025-06-11 05:00:00', 8, eur),
      buy('2025-06-10 15:00:00', 1, 7500, gbx) // after the earliest cut-off
    ]
    const { transactions, applied } = run(rows)
    expect(transactions[2]).toMatchObject({ splitFactor: 4, adjustedShares: 12, adjustedPricePerShare: 7500 })
    expect(transactions[7].splitFactor).toBeUndefined()
    expect(applied.map(a => a.tickers)).toEqual([['ABC', 'ABCx'], ['ABCe']])
  })

  it('does not treat CSV events with different ratios as duplicates', () => {
    const rows = [
      buy('2025-01-10 15:00:00', 1, 400, usd),
      splitRow('Stock split close', '2025-06-10 05:00:00', 1, usd),
      splitRow('Stock split open', '2025-06-10 05:00:00', 2, usd),
      splitRow('Stock split close', '2025-06-12 05:00:00', 2, usd),
      splitRow('Stock split open', '2025-06-12 05:00:00', 6, usd)
    ]
    const { transactions, applied } = run(rows)
    expect(transactions[0].splitFactor).toBe(6)
    expect(applied).toHaveLength(2)
  })

  it('applies a same-second split once when one listing’s split rows lack the ISIN', () => {
    const rows = [
      buy('2025-01-10 15:00:00', 1, 400, usd),
      buy('2025-01-10 09:00:00', 2, 380, eur),
      splitRow('Stock split close', '2025-06-10 05:00:00', 1, { ticker: 'ABC', isin: '' }),
      splitRow('Stock split open', '2025-06-10 05:00:00', 4, { ticker: 'ABC', isin: '' }),
      splitRow('Stock split close', '2025-06-10 05:00:00', 2, eur),
      splitRow('Stock split open', '2025-06-10 05:00:00', 8, eur)
    ]
    const { transactions, applied } = run(rows)
    expect(transactions.slice(0, 2).map(t => t.splitFactor)).toEqual([4, 4])
    expect(applied).toHaveLength(1)
    expect(applied[0].tickers).toEqual(['ABC', 'ABCe'])
  })

  it('adjusts every listing exactly once when an ISIN-less CSV pair replaces a table split', () => {
    const panw = { ticker: 'PANW', isin: PALO_ALTO }
    const panwe = { ticker: 'PANWe', isin: PALO_ALTO, currency: 'EUR' }
    const rows = [
      buy('2024-10-01 15:00:00', 3, 360, panw),
      buy('2024-10-02 09:00:00', 1, 330, panwe),
      splitRow('Stock split close', '2024-12-16 07:30:00', 3, { ticker: 'PANW', isin: '' }),
      splitRow('Stock split open', '2024-12-16 07:30:00', 6, { ticker: 'PANW', isin: '' }),
      sell('2025-01-10 15:00:00', 6, 185, panw),
      sell('2025-01-10 09:00:00', 2, 170, panwe)
    ]
    const { transactions, applied, events } = run(rows)
    expect(events.filter(e => e.cutoff.startsWith('2024-12')).map(e => e.source)).toEqual(['csv'])
    expect(transactions[0]).toMatchObject({ splitFactor: 2, adjustedShares: 6 })
    expect(transactions[1]).toMatchObject({ splitFactor: 2, adjustedShares: 2 })
    expect(adjustedBalance(transactions, 'PANW')).toBe(0)
    expect(adjustedBalance(transactions, 'PANWe')).toBe(0)
    expect(applied).toHaveLength(1)
    expect(applied[0]).toMatchObject({ source: 'csv', tickers: ['PANW', 'PANWe'] })
  })

  it('treats a trade at exactly a CSV event’s cut-off as post-split', () => {
    const rows = [
      buy('2025-01-10 15:00:00', 1, 400, usd),
      splitRow('Stock split close', '2025-06-10 05:00:00', 1, usd),
      splitRow('Stock split open', '2025-06-10 05:00:01', 4, usd),
      buy('2025-06-10 05:00:01', 1, 100, usd)
    ]
    const { transactions } = run(rows)
    expect(transactions[0].splitFactor).toBe(4)
    expect(transactions[3].splitFactor).toBeUndefined()
  })
})

describe('boundary guard details', () => {
  const cutoff = '2023-03-01 02:00:00'

  it.each([
    ['pre-split', buy('2023-02-01 15:00:00', 100, 1)],
    ['post-split', buy('2023-04-01 15:00:00', 10, 10)]
  ])('handles a reverse split (ratio 0.1) with a %s reference', (_label, reference) => {
    const e = event({ ratio: 0.1, ratioLabel: '1-for-10', cutoff })
    const lagging = buy('2023-03-02 15:00:00', 100, 1.05)
    const adjusted = buy('2023-03-02 15:00:00', 10, 9.8)
    const early = buy('2023-02-28 15:00:00', 10, 9.9)
    expect(classifyRowForSplit(lagging, e, [reference, lagging], [e])).toBe('pre')
    expect(classifyRowForSplit(adjusted, e, [reference, adjusted], [e])).toBe('post')
    expect(classifyRowForSplit(early, e, [reference, early], [e])).toBe('post')
  })

  it.each([1.5, 0.67])('uses the guard at exactly ratio %s', ratio => {
    const e = event({ ratio, cutoff })
    const reference = buy('2023-02-01 15:00:00', 1, 100)
    const row = buy('2023-03-02 15:00:00', 1, 100) // pre-split price, post by date
    expect(classifyRowForSplit(row, e, [reference, row], [e])).toBe('pre')
  })

  it.each([1.49, 0.68])('does not use the guard at ratio %s', ratio => {
    const e = event({ ratio, cutoff })
    const reference = buy('2023-02-01 15:00:00', 1, 100)
    const row = buy('2023-03-02 15:00:00', 1, 100)
    expect(classifyRowForSplit(row, e, [reference, row], [e])).toBe('post')
  })

  it('includes both window end points (-1 day and +7 days)', () => {
    const e = event({ ratio: 4, cutoff })
    const reference = buy('2023-01-15 15:00:00', 1, 200)
    const atStart = buy('2023-02-28 02:00:00', 1, 50) // post-split price, pre by date
    const atEnd = buy('2023-03-08 02:00:00', 1, 200) // pre-split price, post by date
    expect(classifyRowForSplit(atStart, e, [reference, atStart], [e])).toBe('post')
    expect(classifyRowForSplit(atEnd, e, [reference, atEnd], [e])).toBe('pre')
  })
})

describe('store-like pipeline smoke test', () => {
  it('leaves an upload with no matching splits unchanged', () => {
    const rows: Trading212Transaction[] = [buy('2023-01-10 15:00:00', 1, 10)]
    const { events } = resolveSplitEvents(rows)
    const result = applySplitAdjustments(rows as NormalizedTransaction[], events)
    expect(result.transactions).toBe(rows)
    expect(result.applied).toEqual([])
  })

  it('keeps an Apple 4-for-1 buy/sell history balanced', () => {
    const opts = { ticker: 'AAPL', isin: APPLE }
    const rows = [buy('2020-08-03 15:00:00', 1, 430, opts), sell('2020-09-15 15:00:00', 4, 115, opts)]
    const { transactions } = run(rows)
    expect(adjustedBalance(transactions)).toBe(0)
    expect(transactions[0].adjustedPricePerShare).toBe(107.5)
  })
})
