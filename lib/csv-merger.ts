import type { Trading212Transaction } from '@/types/trading212'
import { detectBaseCurrency } from './currency-normalizer'

export interface ParsedFile {
  fileName: string
  data: Trading212Transaction[]
}

export interface PerFileBaseCurrency {
  fileName: string
  baseCurrency: string
  rowCount: number
}

export interface MergeResult {
  merged: Trading212Transaction[]
  duplicatesRemoved: number
  perFileBaseCurrencies: PerFileBaseCurrency[]
  uniqueBaseCurrencies: string[]
  fileCount: number
  totalRowsBeforeDedupe: number
}

/**
 * Produces a stable key used to detect duplicate transactions across CSV
 * exports. Trading 212 emits a unique `ID` on newer exports; older or
 * partial exports may omit it, so we fall back to a composite of the
 * fields that together identify a single transaction.
 */
export function dedupeKey(transaction: Trading212Transaction): string {
  const id = transaction.ID
  if (typeof id === 'string' && id.trim().length > 0) {
    return `id:${id.trim()}`
  }

  const parts = [
    transaction.Time ?? '',
    transaction.Action ?? '',
    transaction.Ticker ?? '',
    transaction['No. of shares'] ?? '',
    transaction.Total ?? '',
    transaction['Currency (Total)'] ?? ''
  ]
  return `composite:${parts.join('|')}`
}

/**
 * Merges multiple parsed Trading 212 CSVs into a single transaction list,
 * removing duplicates (first occurrence wins) and reporting which base
 * currency each file used so the caller can prompt the user if they disagree.
 */
export function mergeAndDedupe(files: ParsedFile[]): MergeResult {
  const seen = new Map<string, Trading212Transaction>()
  const perFileBaseCurrencies: PerFileBaseCurrency[] = []
  let duplicatesRemoved = 0
  let totalRowsBeforeDedupe = 0

  for (const file of files) {
    perFileBaseCurrencies.push({
      fileName: file.fileName,
      baseCurrency: detectBaseCurrency(file.data),
      rowCount: file.data.length
    })

    totalRowsBeforeDedupe += file.data.length

    for (const transaction of file.data) {
      const key = dedupeKey(transaction)
      if (seen.has(key)) {
        duplicatesRemoved++
        continue
      }
      seen.set(key, transaction)
    }
  }

  const uniqueBaseCurrencies = [
    ...new Set(perFileBaseCurrencies.map(x => x.baseCurrency))
  ]

  return {
    merged: Array.from(seen.values()),
    duplicatesRemoved,
    perFileBaseCurrencies,
    uniqueBaseCurrencies,
    fileCount: files.length,
    totalRowsBeforeDedupe
  }
}
