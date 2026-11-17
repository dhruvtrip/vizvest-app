import type { SplitEvent } from '@/types/trading212'

/**
 * Display helpers for applied stock splits (dashboard banner, stock detail)
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Formats a split cut-off ("YYYY-MM-DD HH:mm:ss", UTC) as "6 Jun 2022".
 * Reads the date part as plain numbers instead of parsing it with `new Date`,
 * which would treat it as browser-local time and could shift the day.
 */
export function formatSplitDate(cutoff: string): string {
  const datePart = (cutoff || '').slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!match) return datePart

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return datePart

  return `${day} ${MONTHS[month - 1]} ${year}`
}

/**
 * Banner entry for one split: "Amazon — 20-for-1, 6 Jun 2022"
 */
export function formatSplitSummary(split: Pick<SplitEvent, 'name' | 'ratioLabel' | 'cutoff'>): string {
  return `${split.name} — ${split.ratioLabel}, ${formatSplitDate(split.cutoff)}`
}

/**
 * Number of distinct securities among the given splits. One security can
 * have several splits; it is identified by its first ISIN, else by name.
 */
export function countSplitSecurities(splits: Pick<SplitEvent, 'isins' | 'name'>[]): number {
  return new Set(splits.map(s => s.isins[0] || s.name)).size
}

/**
 * Splits as one phrase, in date order:
 * "the 4-for-1 split on 20 Jul 2021 and the 10-for-1 split on 10 Jun 2024"
 */
export function formatSplitPhrase(splits: Pick<SplitEvent, 'ratioLabel' | 'cutoff'>[]): string {
  const parts = [...splits]
    .sort((a, b) => (a.cutoff < b.cutoff ? -1 : a.cutoff > b.cutoff ? 1 : 0))
    .map(s => `the ${s.ratioLabel} split on ${formatSplitDate(s.cutoff)}`)

  if (parts.length <= 1) return parts[0] || ''
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}
