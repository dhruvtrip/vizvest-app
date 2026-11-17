import type { SplitEvent, Trading212Transaction } from '@/types/trading212'
import { isSplitAction, isSplitCloseAction, isSplitOpenAction } from './transaction-utils'

/**
 * Stock split rows in a Trading 212 CSV export.
 *
 * Exports carry split rows only for splits from about December 2024 onwards.
 * A split appears as two rows: `Stock split close` (the whole position before
 * the split) and `Stock split open` (the whole position after it), within about
 * a second of each other, in either order. Ratio = open shares / close shares.
 *
 * This module also holds the time helpers shared with lib/split-adjuster.ts.
 */

// ---------------------------------------------------------------------------
// Time helpers
//
// `Time` is UTC, formatted `YYYY-MM-DD HH:mm:ss`, with no zone suffix.
// `new Date(time)` would parse that as browser-local time, so it is never
// used. Times are compared as normalized strings; where arithmetic is needed
// the pieces are parsed by hand and fed to Date.UTC.
// ---------------------------------------------------------------------------

const SECOND_MS = 1000
const DAY_MS = 24 * 60 * 60 * SECOND_MS

/** Maximum distance between the two halves of a CSV split pair */
export const SPLIT_PAIR_WINDOW_MS = 60 * SECOND_MS

/**
 * Normalizes a `Time` value for comparison: trims it, turns an ISO `T`
 * separator into a space and drops anything after the seconds (fractional
 * seconds, a `Z` or an offset). Non-strings become ''.
 */
export function normalizeSplitTime(time: unknown): string {
  if (typeof time !== 'string') return ''
  return time.trim().replace(/^(\d{4}-\d{2}-\d{2})T/, '$1 ').slice(0, 19)
}

/** String comparison of two normalized times: negative, 0 or positive */
export function compareSplitTimes(a: unknown, b: unknown): number {
  const x = normalizeSplitTime(a)
  const y = normalizeSplitTime(b)
  return x < y ? -1 : x > y ? 1 : 0
}

const TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/

/**
 * Parses a `Time` value as UTC milliseconds. Accepts `YYYY-MM-DD`,
 * `YYYY-MM-DD HH:mm` and `YYYY-MM-DD HH:mm:ss` after normalization.
 * Returns null for anything else, including impossible dates.
 */
export function parseSplitTimeMs(time: unknown): number | null {
  const match = TIME_PATTERN.exec(normalizeSplitTime(time))
  if (!match) return null
  const [year, month, day, hour, minute, second] = match
    .slice(1)
    .map(part => (part === undefined ? 0 : Number(part)))
  if (hour > 23 || minute > 59 || second > 59) return null
  const ms = Date.UTC(year, month - 1, day, hour, minute, second)
  const check = new Date(ms)
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null
  }
  return ms
}

/**
 * Whole calendar days from a's date to b's date (b - a), or null when either
 * date cannot be parsed. Only the date part is used.
 */
export function calendarDaysBetween(a: unknown, b: unknown): number | null {
  const dayA = parseSplitTimeMs(normalizeSplitTime(a).slice(0, 10))
  const dayB = parseSplitTimeMs(normalizeSplitTime(b).slice(0, 10))
  if (dayA === null || dayB === null) return null
  return Math.round((dayB - dayA) / DAY_MS)
}

/** Distance in ms between two times, or null when either cannot be parsed */
export function splitTimeDistanceMs(a: unknown, b: unknown): number | null {
  const x = parseSplitTimeMs(a)
  const y = parseSplitTimeMs(b)
  if (x === null || y === null) return null
  return Math.abs(x - y)
}

/** Trimmed, upper-cased ISIN, or '' */
export function normalizeIsin(isin: unknown): string {
  return typeof isin === 'string' ? isin.trim().toUpperCase() : ''
}

// ---------------------------------------------------------------------------
// Ratio label
// ---------------------------------------------------------------------------

const LABEL_TOLERANCE = 0.005
const MAX_LABEL_DENOMINATOR = 10

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function withinTolerance(ratio: number, target: number): boolean {
  return target > 0 && Math.abs(ratio / target - 1) <= LABEL_TOLERANCE
}

/**
 * Readable label for a split ratio: "20-for-1", "1-for-10", "3-for-2". Snaps
 * when the ratio is within 0.5% of such a value; otherwise prints the ratio to
 * 4 decimals ("1.2345-for-1").
 */
export function formatSplitRatio(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return `${ratio}-for-1`

  if (ratio >= 1) {
    const n = Math.round(ratio)
    if (n >= 2 && withinTolerance(ratio, n)) return `${n}-for-1`
  } else {
    const n = Math.round(1 / ratio)
    if (n >= 2 && withinTolerance(ratio, 1 / n)) return `1-for-${n}`
  }

  for (let q = 2; q <= MAX_LABEL_DENOMINATOR; q++) {
    const p = Math.round(ratio * q)
    if (p < 1 || p === q || gcd(p, q) !== 1) continue
    if (withinTolerance(ratio, p / q)) return `${p}-for-${q}`
  }

  return `${ratio.toFixed(4)}-for-1`
}

// ---------------------------------------------------------------------------
// Pairing
// ---------------------------------------------------------------------------

interface SplitRow {
  row: Trading212Transaction
  index: number
  time: string
  ms: number | null
  ticker: string
  isin: string
}

function toSplitRow(row: Trading212Transaction, index: number): SplitRow {
  return {
    row,
    index,
    time: normalizeSplitTime(row.Time),
    ms: parseSplitTimeMs(row.Time),
    ticker: typeof row.Ticker === 'string' ? row.Ticker : '',
    isin: normalizeIsin(row.ISIN)
  }
}

/** Distance between two split rows, or null when they are not within the window */
function pairDistance(a: SplitRow, b: SplitRow): number | null {
  if (a.ms !== null && b.ms !== null) {
    const distance = Math.abs(a.ms - b.ms)
    return distance <= SPLIT_PAIR_WINDOW_MS ? distance : null
  }
  // Unparseable time: only an identical (non-empty) time string counts.
  return a.time !== '' && a.time === b.time ? 0 : null
}

/**
 * Whether two split rows belong to the same listing: equal tickers when both
 * have one; otherwise a shared ISIN.
 */
function sameListing(a: SplitRow, b: SplitRow): boolean {
  if (a.ticker !== '' && b.ticker !== '') return a.ticker === b.ticker
  return a.isin !== '' && a.isin === b.isin
}

function positiveShares(row: Trading212Transaction): number | null {
  const shares = row['No. of shares']
  return typeof shares === 'number' && Number.isFinite(shares) && shares > 0 ? shares : null
}

function rowName(...rows: SplitRow[]): string {
  for (const r of rows) {
    if (typeof r.row.Name === 'string' && r.row.Name.trim() !== '') return r.row.Name.trim()
  }
  for (const r of rows) {
    if (r.ticker !== '') return r.ticker
  }
  return rows.find(r => r.isin !== '')?.isin ?? 'Unknown security'
}

function eventId(source: SplitEvent['source'], isins: string[], tickers: string[], cutoff: string): string {
  return `${source}:${isins[0] ?? tickers[0] ?? ''}:${cutoff}`
}

function addDistinct(target: string[], values: Iterable<string>): string[] {
  for (const value of values) {
    if (value !== '' && !target.includes(value)) target.push(value)
  }
  return target
}

function laterTime(a: SplitRow, b: SplitRow): string {
  return compareSplitTimes(a.time, b.time) >= 0 ? a.time : b.time
}

/**
 * Two listings of one security (e.g. a USD and a EUR line with the same ISIN)
 * produce two pairs describing the same split. Merge CSV events that share an
 * ISIN (or, when both have none, a source ticker) and whose cut-offs are within
 * 60 seconds, so the ratio is applied once instead of compounding. The merged
 * event carries the union of ISINs and source tickers.
 *
 * Pairs of one split further apart than that (a listing that adjusted later)
 * stay separate events; applySplitAdjustments makes each ticker use only one
 * of them.
 */
function mergeDuplicateEvents(events: SplitEvent[]): SplitEvent[] {
  const sorted = [...events].sort((a, b) => compareSplitTimes(a.cutoff, b.cutoff))
  const groups: SplitEvent[][] = []

  const sameSecurity = (a: SplitEvent, b: SplitEvent): boolean => {
    if (a.isins.length > 0 || b.isins.length > 0) {
      return a.isins.some(isin => b.isins.includes(isin))
    }
    return (a.sourceTickers ?? []).some(ticker => (b.sourceTickers ?? []).includes(ticker))
  }
  const closeInTime = (a: SplitEvent, b: SplitEvent): boolean => {
    const distance = splitTimeDistanceMs(a.cutoff, b.cutoff)
    return distance !== null ? distance <= SPLIT_PAIR_WINDOW_MS : a.cutoff === b.cutoff
  }

  for (const event of sorted) {
    // An event may bridge two groups (shares an ISIN with each): fold them together.
    const matching = groups.filter(group =>
      group.some(other => sameSecurity(event, other) && closeInTime(event, other))
    )
    if (matching.length === 0) {
      groups.push([event])
      continue
    }
    const [target, ...rest] = matching
    target.push(event)
    for (const group of rest) {
      target.push(...group)
      groups.splice(groups.indexOf(group), 1)
    }
  }

  return groups.map(group => {
    if (group.length === 1) return group[0]
    group.sort((a, b) => compareSplitTimes(a.cutoff, b.cutoff))
    const [first] = group
    const isins: string[] = []
    const sourceTickers: string[] = []
    for (const event of group) {
      addDistinct(isins, event.isins)
      addDistinct(sourceTickers, event.sourceTickers ?? [])
    }
    const cutoff = group.reduce(
      (latest, event) => (compareSplitTimes(event.cutoff, latest) > 0 ? event.cutoff : latest),
      first.cutoff
    )
    return {
      ...first,
      isins,
      sourceTickers,
      cutoff,
      id: eventId('csv', isins, sourceTickers, cutoff)
    }
  }).sort((a, b) => compareSplitTimes(a.cutoff, b.cutoff))
}

/**
 * Turns the CSV's split rows into split events.
 *
 * - A `Stock split close` and a `Stock split open` row are paired when their
 *   times are within 60 seconds (either order) and they belong to the same
 *   listing: equal tickers when both rows have one; otherwise (one row has no
 *   ticker) a shared ISIN. Rows of different listings of one ISIN are never
 *   paired with each other: a missed pair is reported as unpaired, while a
 *   cross-listing pair would give wrong numbers. Each close takes the nearest
 *   unused open.
 * - When neither row of a pair carries an ISIN, the event takes the ISINs
 *   found on other rows of the same ticker in the upload, so it reaches every
 *   listing of the security. Only when the ticker has no ISIN anywhere does
 *   the event stay ISIN-less and match trade rows by `sourceTickers`.
 * - ratio = open shares / close shares. A pair with a missing or non-positive
 *   share count, a non-finite ratio or a ratio of 1 is discarded.
 * - Rows without a partner, rows of discarded pairs and the legacy single-row
 *   `Stock Split` go to `unpaired`; no ratio is ever derived from one half.
 */
export function extractCsvSplitEvents(
  transactions: Trading212Transaction[]
): { events: SplitEvent[]; unpaired: Trading212Transaction[] } {
  const closes: SplitRow[] = []
  const opens: SplitRow[] = []
  const unpairedIndexes = new Set<number>()

  transactions.forEach((row, index) => {
    const action = row?.Action
    if (typeof action !== 'string') return
    if (isSplitCloseAction(action)) closes.push(toSplitRow(row, index))
    else if (isSplitOpenAction(action)) opens.push(toSplitRow(row, index))
    else if (isSplitAction(action)) unpairedIndexes.add(index) // legacy `Stock Split`
  })

  const byTime = (a: SplitRow, b: SplitRow) => compareSplitTimes(a.time, b.time) || a.index - b.index
  closes.sort(byTime)
  opens.sort(byTime)

  const usedOpens = new Set<number>()
  const events: SplitEvent[] = []

  // ISINs seen on any row of each ticker, for split pairs that carry none.
  const isinsByTicker = new Map<string, string[]>()
  for (const row of transactions) {
    if (!row || typeof row.Ticker !== 'string' || row.Ticker === '') continue
    const isin = normalizeIsin(row.ISIN)
    if (isin === '') continue
    const known = isinsByTicker.get(row.Ticker) ?? []
    isinsByTicker.set(row.Ticker, addDistinct(known, [isin]))
  }

  for (const close of closes) {
    let best: { open: SplitRow; distance: number } | null = null
    for (const open of opens) {
      if (usedOpens.has(open.index)) continue
      if (!sameListing(close, open)) continue
      const distance = pairDistance(close, open)
      if (distance === null) continue
      if (best === null || distance < best.distance) best = { open, distance }
    }

    if (best === null) {
      unpairedIndexes.add(close.index)
      continue
    }

    const open = best.open
    usedOpens.add(open.index)

    const closeShares = positiveShares(close.row)
    const openShares = positiveShares(open.row)
    const ratio = closeShares !== null && openShares !== null ? openShares / closeShares : NaN
    if (!Number.isFinite(ratio) || ratio <= 0 || Math.abs(ratio - 1) < 1e-9) {
      unpairedIndexes.add(close.index)
      unpairedIndexes.add(open.index)
      continue
    }

    // Open half first: after a reverse split it carries the new ISIN, matching
    // the table's "current ISIN first" convention.
    const isins = addDistinct([], [open.isin, close.isin])
    const sourceTickers = addDistinct([], [close.ticker, open.ticker])
    if (isins.length === 0) {
      for (const ticker of sourceTickers) addDistinct(isins, isinsByTicker.get(ticker) ?? [])
    }
    const cutoff = laterTime(close, open)

    events.push({
      id: eventId('csv', isins, sourceTickers, cutoff),
      isins,
      name: rowName(open, close),
      ratio,
      ratioLabel: formatSplitRatio(ratio),
      cutoff,
      source: 'csv',
      sourceTickers
    })
  }

  for (const open of opens) {
    if (!usedOpens.has(open.index)) unpairedIndexes.add(open.index)
  }

  return {
    events: mergeDuplicateEvents(events),
    unpaired: [...unpairedIndexes].sort((a, b) => a - b).map(index => transactions[index])
  }
}
