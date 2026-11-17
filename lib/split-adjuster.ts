import type {
  AppliedSplit,
  NormalizedTransaction,
  SplitEvent,
  Trading212Transaction
} from '@/types/trading212'
import { isBuyAction, isSellAction } from './transaction-utils'
import {
  calendarDaysBetween,
  compareSplitTimes,
  extractCsvSplitEvents,
  normalizeIsin,
  normalizeSplitTime,
  parseSplitTimeMs
} from './split-csv-events'
import { knownSplitsForIsin, TABLE_SPLIT_CUTOFF_TIME, type KnownSplitSecurity } from './split-table'

/**
 * Stock split adjustment.
 *
 * resolveSplitEvents collects the split events that apply to an upload (CSV
 * split rows + the bundled table, CSV winning when both describe one split).
 * applySplitAdjustments then annotates buy/sell rows with share and price
 * values in today's share terms (`adjustedShares`, `adjustedPricePerShare`,
 * `splitFactor`). Raw values (`No. of shares`, `Price / share`, `Total`,
 * `totalInBaseCurrency`, `Result`) are never modified, and inputs are never
 * mutated.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** A table event within this many calendar days of a CSV event for the same ISIN is the same split */
const CSV_WINS_WINDOW_DAYS = 7

/** Boundary guard: only splits that move the price this much are told apart by price */
const GUARD_MIN_FORWARD_RATIO = 1.5
const GUARD_MAX_REVERSE_RATIO = 0.67
/** Boundary guard window around a table cut-off */
const GUARD_WINDOW_BEFORE_MS = 1 * DAY_MS
const GUARD_WINDOW_AFTER_MS = 7 * DAY_MS

/** Running balance above this counts as "still holding" */
const HOLDING_EPSILON = 0.0001

function isTradeRow(row: Trading212Transaction | null | undefined): row is Trading212Transaction {
  return (
    !!row &&
    typeof row.Action === 'string' &&
    (isBuyAction(row.Action) || isSellAction(row.Action))
  )
}

function positivePrice(row: Trading212Transaction): number | null {
  const price = row['Price / share']
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : null
}

function priceCurrency(row: Trading212Transaction): string {
  const currency = row['Currency (Price / share)']
  return typeof currency === 'string' ? currency.trim().toUpperCase() : ''
}

function sharesOf(row: Trading212Transaction): number {
  const shares = row['No. of shares']
  return typeof shares === 'number' && Number.isFinite(shares) ? shares : 0
}

/** Removes floating-point noise such as 0.30000000000000004 */
function tidy(value: number): number {
  return Number(value.toPrecision(12))
}

function byCutoff(a: SplitEvent, b: SplitEvent): number {
  return compareSplitTimes(a.cutoff, b.cutoff)
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

function tableEvents(security: KnownSplitSecurity): SplitEvent[] {
  const isins = security.isins.map(normalizeIsin).filter(isin => isin !== '')
  return security.splits.map(split => {
    const cutoff = `${split.effectiveDate} ${TABLE_SPLIT_CUTOFF_TIME}`
    return {
      id: `table:${isins[0]}:${cutoff}`,
      isins,
      name: security.name,
      ratio: split.newShares / split.oldShares,
      ratioLabel: `${split.newShares}-for-${split.oldShares}`,
      cutoff,
      source: 'table' as const
    }
  })
}

function withinCalendarDays(a: string, b: string, days: number): boolean {
  const between = calendarDaysBetween(a, b)
  if (between !== null) return Math.abs(between) <= days
  // Unparseable: only the same date string counts.
  return normalizeSplitTime(a).slice(0, 10) === normalizeSplitTime(b).slice(0, 10)
}

/**
 * Collects the split events that apply to this upload.
 *
 * 1. CSV split pairs (lib/split-csv-events.ts).
 * 2. Bundled-table splits of every security whose ISIN appears on a buy/sell row.
 * 3. CSV wins: a table event is dropped when a CSV event shares an ISIN with
 *    it and their cut-off dates are within 7 calendar days.
 * 4. The union, sorted by cut-off.
 */
export function resolveSplitEvents(
  transactions: Trading212Transaction[]
): { events: SplitEvent[]; unpaired: Trading212Transaction[] } {
  const csv = extractCsvSplitEvents(transactions)

  const tradeIsins: string[] = []
  for (const row of transactions) {
    if (!isTradeRow(row)) continue
    const isin = normalizeIsin(row.ISIN)
    if (isin !== '' && !tradeIsins.includes(isin)) tradeIsins.push(isin)
  }

  const securities: KnownSplitSecurity[] = []
  for (const isin of tradeIsins) {
    const security = knownSplitsForIsin(isin)
    if (security && !securities.includes(security)) securities.push(security)
  }

  // A CSV event is ISIN-less only when its ticker has no ISIN anywhere in the
  // upload (lib/split-csv-events.ts fills it in otherwise), so such an event
  // can never describe a table security and is ignored here.
  const table = securities.flatMap(tableEvents).filter(
    tableEvent =>
      !csv.events.some(
        csvEvent =>
          csvEvent.isins.some(isin => tableEvent.isins.includes(isin)) &&
          withinCalendarDays(csvEvent.cutoff, tableEvent.cutoff, CSV_WINS_WINDOW_DAYS)
      )
  )

  // Array.prototype.sort is stable: on equal cut-offs CSV events stay first.
  const events = [...csv.events, ...table].sort(byCutoff)
  return { events, unpaired: csv.unpaired }
}

// ---------------------------------------------------------------------------
// Classify
// ---------------------------------------------------------------------------

export type SplitSide = 'pre' | 'post'

function usesBoundaryGuard(event: SplitEvent): boolean {
  return (
    event.source === 'table' &&
    (event.ratio >= GUARD_MIN_FORWARD_RATIO || event.ratio <= GUARD_MAX_REVERSE_RATIO)
  )
}

/** True when another event's cut-off lies between the reference trade and this event's cut-off */
function hasInterveningSplit(
  referenceTime: string,
  event: SplitEvent,
  tickerEvents: SplitEvent[]
): boolean {
  return tickerEvents.some(
    other =>
      other !== event &&
      other.id !== event.id &&
      compareSplitTimes(referenceTime, other.cutoff) < 0 !==
        compareSplitTimes(event.cutoff, other.cutoff) < 0
  )
}

/**
 * Decides whether a buy/sell row is before (`pre`) or after (`post`) a split.
 * This is the single source of truth used by both the relevance rule and the
 * split factor.
 *
 * Date rule: `pre` when the row's Time is before the event's cut-off.
 *
 * Boundary guard (table events with ratio >= 1.5 or <= 0.67 only; CSV events
 * carry an exact timestamp): a trade on a secondary listing may have executed
 * on a venue that adjusted a day or more after the home market. For a row
 * timed from 1 day before to 7 days after the cut-off, the nearest trade of
 * the same ticker in the same price currency outside that window is taken as
 * a reference. A reference is ignored when another split of the ticker has
 * its cut-off between the reference and this cut-off. The row goes on the
 * reference's side when its price is closer (on a log scale) to the
 * reference's price than to that price moved by the ratio, otherwise on the
 * other side. Without a usable reference the date rule applies.
 *
 * @param tickerRows buy/sell rows of the same ticker that this event applies to
 * @param tickerEvents every split event that applies to the ticker
 */
export function classifyRowForSplit(
  row: Trading212Transaction,
  event: SplitEvent,
  tickerRows: Trading212Transaction[],
  tickerEvents: SplitEvent[]
): SplitSide {
  const byDate: SplitSide = compareSplitTimes(row.Time, event.cutoff) < 0 ? 'pre' : 'post'
  if (!usesBoundaryGuard(event)) return byDate

  const rowMs = parseSplitTimeMs(row.Time)
  const cutoffMs = parseSplitTimeMs(event.cutoff)
  const price = positivePrice(row)
  if (rowMs === null || cutoffMs === null || price === null) return byDate

  const windowStart = cutoffMs - GUARD_WINDOW_BEFORE_MS
  const windowEnd = cutoffMs + GUARD_WINDOW_AFTER_MS
  if (rowMs < windowStart || rowMs > windowEnd) return byDate

  const currency = priceCurrency(row)
  let reference: { row: Trading212Transaction; price: number; distance: number } | null = null
  for (const candidate of tickerRows) {
    if (candidate === row || !isTradeRow(candidate)) continue
    if (candidate.Ticker !== row.Ticker || priceCurrency(candidate) !== currency) continue
    const candidatePrice = positivePrice(candidate)
    const candidateMs = parseSplitTimeMs(candidate.Time)
    if (candidatePrice === null || candidateMs === null) continue
    if (candidateMs >= windowStart && candidateMs <= windowEnd) continue
    if (hasInterveningSplit(candidate.Time, event, tickerEvents)) continue
    const distance = Math.abs(candidateMs - rowMs)
    if (reference === null || distance < reference.distance) {
      reference = { row: candidate, price: candidatePrice, distance }
    }
  }
  if (reference === null) return byDate

  const referenceSide: SplitSide =
    compareSplitTimes(reference.row.Time, event.cutoff) < 0 ? 'pre' : 'post'
  const otherSide: SplitSide = referenceSide === 'pre' ? 'post' : 'pre'
  const otherLevel =
    referenceSide === 'pre' ? reference.price / event.ratio : reference.price * event.ratio

  const logPrice = Math.log(price)
  const toReference = Math.abs(logPrice - Math.log(reference.price))
  const toOther = Math.abs(logPrice - Math.log(otherLevel))
  return toReference < toOther ? referenceSide : otherSide
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function rowMatchesEvent(
  row: Trading212Transaction,
  event: SplitEvent,
  ticker: string,
  groupMatchesByIsin: boolean
): boolean {
  if (event.isins.length === 0) {
    return (event.sourceTickers ?? []).includes(ticker)
  }
  const isin = normalizeIsin(row.ISIN)
  // A row without an ISIN follows the rest of its ticker.
  if (isin === '') return groupMatchesByIsin
  return event.isins.some(eventIsin => normalizeIsin(eventIsin) === isin)
}

/** Relative tolerance within which two CSV events have "the same" ratio */
const DUPLICATE_RATIO_TOLERANCE = 0.005

/**
 * Whether two CSV events describe the same split recorded on different
 * listings: same security (a shared ISIN, or both ISIN-less with a shared
 * source ticker), ratios within 0.5% and cut-offs within 7 calendar days.
 */
function isDuplicateCsvEvent(a: SplitEvent, b: SplitEvent): boolean {
  if (a.source !== 'csv' || b.source !== 'csv') return false
  const sameSecurity =
    a.isins.length > 0 || b.isins.length > 0
      ? a.isins.some(isin => b.isins.includes(isin))
      : (a.sourceTickers ?? []).some(ticker => (b.sourceTickers ?? []).includes(ticker))
  return (
    sameSecurity &&
    Math.abs(a.ratio / b.ratio - 1) <= DUPLICATE_RATIO_TOLERANCE &&
    withinCalendarDays(a.cutoff, b.cutoff, CSV_WINS_WINDOW_DAYS)
  )
}

/**
 * When one split is recorded once per listing (two CSV events of one
 * security, cut-offs a day or so apart), a ticker must use exactly one of
 * them: the one read from its own split rows, or else the earliest. The
 * others are dropped for this ticker entirely: they take no part in its
 * relevance, factor, boundary guard or `applied` bookkeeping.
 */
function selectEventsForTicker(events: SplitEvent[], ticker: string): SplitEvent[] {
  // Connected components of the duplicate relation among the CSV events
  let sets: SplitEvent[][] = []
  for (const event of events) {
    if (event.source !== 'csv') continue
    const linked = sets.filter(set => set.some(other => isDuplicateCsvEvent(event, other)))
    sets = [...sets.filter(set => !linked.includes(set)), [event, ...linked.flat()]]
  }

  const dropped = new Set<SplitEvent>()
  for (const set of sets) {
    if (set.length < 2) continue
    const ordered = [...set].sort(byCutoff)
    const keep = ordered.find(event => (event.sourceTickers ?? []).includes(ticker)) ?? ordered[0]
    for (const event of set) if (event !== keep) dropped.add(event)
  }
  return events.filter(event => !dropped.has(event))
}

function groupMatchesEventByIsin(rows: Trading212Transaction[], event: SplitEvent): boolean {
  if (event.isins.length === 0) return false
  const isins = event.isins.map(normalizeIsin)
  return rows.some(row => {
    const isin = normalizeIsin(row.ISIN)
    return isin !== '' && isins.includes(isin)
  })
}

/**
 * Annotates buy/sell rows with split-adjusted values.
 *
 * Works per ticker group, in chronological event order. An event is applied to
 * a ticker when the ticker has a buy/sell row before the split and either has
 * one after it or was still holding (running balance just before the split,
 * already adjusted for earlier applied splits, above 0.0001). "Before" and
 * "after" always come from classifyRowForSplit.
 *
 * When one split appears as several CSV events (one per listing, cut-offs
 * apart), each ticker uses only one of them (selectEventsForTicker).
 *
 * `splitFactor` of a row = product of the ratios of the applied events the
 * row is before. `adjustedShares` / `adjustedPricePerShare` / `splitFactor`
 * are set only when the factor is not 1. Dividend and split rows pass through
 * untouched. Row order is preserved.
 */
export function applySplitAdjustments(
  transactions: NormalizedTransaction[],
  events: SplitEvent[]
): { transactions: NormalizedTransaction[]; applied: AppliedSplit[] } {
  if (events.length === 0) return { transactions, applied: [] }

  const sortedEvents = [...events].sort(byCutoff)

  // Buy/sell row indexes per exact ticker, in first-appearance order.
  const groups = new Map<string, number[]>()
  transactions.forEach((row, index) => {
    if (!isTradeRow(row)) return
    if (typeof row.Ticker !== 'string' || row.Ticker === '') return
    const indexes = groups.get(row.Ticker) ?? []
    indexes.push(index)
    groups.set(row.Ticker, indexes)
  })

  const factors = new Array<number>(transactions.length).fill(1)
  const appliedByEvent = new Map<SplitEvent, { tickers: string[]; rowsAdjusted: number }>()

  for (const [ticker, unsortedIndexes] of groups) {
    const indexes = [...unsortedIndexes].sort(
      (a, b) => compareSplitTimes(transactions[a].Time, transactions[b].Time) || a - b
    )
    const groupRows = indexes.map(index => transactions[index])

    const matchesByIsin = new Map<SplitEvent, boolean>()
    for (const event of sortedEvents) {
      matchesByIsin.set(event, groupMatchesEventByIsin(groupRows, event))
    }
    const matches = (row: Trading212Transaction, event: SplitEvent) =>
      rowMatchesEvent(row, event, ticker, matchesByIsin.get(event) ?? false)

    const tickerEvents = selectEventsForTicker(
      sortedEvents.filter(event => groupRows.some(row => matches(row, event))),
      ticker
    )

    for (const event of tickerEvents) {
      const relevantIndexes = indexes.filter(index => matches(transactions[index], event))
      const relevantRows = relevantIndexes.map(index => transactions[index])
      const sides = relevantRows.map(row =>
        classifyRowForSplit(row, event, relevantRows, tickerEvents)
      )

      let hasPre = false
      let hasPost = false
      let balanceBefore = 0
      relevantRows.forEach((row, i) => {
        if (sides[i] === 'post') {
          hasPost = true
          return
        }
        hasPre = true
        const shares = sharesOf(row) * factors[relevantIndexes[i]]
        balanceBefore += isBuyAction(row.Action) ? shares : -shares
      })

      if (!hasPre || (!hasPost && balanceBefore <= HOLDING_EPSILON)) continue

      let rowsAdjusted = 0
      relevantIndexes.forEach((index, i) => {
        if (sides[i] !== 'pre') return
        factors[index] *= event.ratio
        rowsAdjusted++
      })

      const applied = appliedByEvent.get(event) ?? { tickers: [], rowsAdjusted: 0 }
      if (!applied.tickers.includes(ticker)) applied.tickers.push(ticker)
      applied.rowsAdjusted += rowsAdjusted
      appliedByEvent.set(event, applied)
    }
  }

  const adjusted = transactions.map((row, index) => {
    const factor = tidy(factors[index])
    if (factor === 1) return row
    const annotated: NormalizedTransaction = { ...row, splitFactor: factor }
    const shares = row['No. of shares']
    if (typeof shares === 'number' && Number.isFinite(shares)) {
      annotated.adjustedShares = tidy(shares * factor)
    }
    const price = row['Price / share']
    if (typeof price === 'number' && Number.isFinite(price)) {
      annotated.adjustedPricePerShare = tidy(price / factor)
    }
    return annotated
  })

  const applied: AppliedSplit[] = sortedEvents
    .filter(event => appliedByEvent.has(event))
    .map(event => ({ ...event, ...appliedByEvent.get(event)! }))

  return { transactions: adjusted, applied }
}
