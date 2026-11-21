import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { normalizeSuffixedHeaders } from './csv-headers'
import { normalizeAllTransactions } from './currency-normalizer'
import { validateCSVColumns, validateTransactions } from './csv-validator'
import type { NormalizedTransaction, Trading212Transaction } from '@/types/trading212'

// Same options as components/features/csv-upload.tsx
const PARSE_OPTIONS = { header: true, dynamicTyping: true, skipEmptyLines: true } as const

const plainText = fs
  .readFileSync(path.join(__dirname, '__fixtures__', 't212-eur-100.csv'), 'utf8')
  .split(/\r?\n/)
  .slice(0, 41) // header + 40 rows
  .join('\n')

const RENAMES: Record<string, string> = {
  Total: 'Total (EUR)',
  Result: 'Result (EUR)',
  'Currency conversion fee': 'Currency conversion fee (EUR)'
}
const DROPPED = ['Currency (Total)', 'Currency (Result)', 'Currency (Currency conversion fee)']

/** Rebuilds the plain fixture slice the way older exports laid it out. */
function toSuffixedExport(text: string): string {
  const [header, ...rows] = Papa.parse<string[]>(text, { skipEmptyLines: true }).data
  const keep = header.map((h, i) => (DROPPED.includes(h) ? -1 : i)).filter(i => i >= 0)
  const pick = (row: string[]) => keep.map(i => row[i])
  return Papa.unparse([pick(header).map(h => RENAMES[h] ?? h), ...rows.map(pick)])
}

function totals(rows: NormalizedTransaction[]) {
  return {
    count: rows.length,
    total: rows.reduce((s, t) => s + t.totalInBaseCurrency, 0),
    result: rows.reduce((s, t) => s + t.resultInBaseCurrency, 0),
    fee: rows.reduce((s, t) => s + Math.abs(t.feeInBaseCurrency), 0)
  }
}

describe('normalizeSuffixedHeaders', () => {
  it('gives a suffixed-header export the same sums as the plain one', () => {
    const plain = Papa.parse<Trading212Transaction>(plainText, PARSE_OPTIONS)
    const suffixed = Papa.parse<Trading212Transaction>(toSuffixedExport(plainText), PARSE_OPTIONS)

    expect(suffixed.meta.fields).toContain('Total (EUR)')
    expect(suffixed.meta.fields).not.toContain('Currency (Total)')
    expect(validateCSVColumns(suffixed.meta.fields ?? []).isValid).toBe(false)

    const { fields, rows } = normalizeSuffixedHeaders(suffixed.meta.fields ?? [], suffixed.data)

    expect(fields).toContain('Total')
    expect(fields).toContain('Currency (Total)')
    expect(validateCSVColumns(fields).isValid).toBe(true)
    expect(validateTransactions(rows).isValid).toBe(true)
    expect(rows.every(r => r['Currency (Total)'] === 'EUR')).toBe(true)

    const plainNormalized = normalizeAllTransactions(plain.data)
    const suffixedNormalized = normalizeAllTransactions(rows)

    expect(suffixedNormalized.warning).toBeNull()
    const expected = totals(plainNormalized.transactions)
    const actual = totals(suffixedNormalized.transactions)
    expect(actual.count).toBe(expected.count)
    expect(actual.total).toBeCloseTo(expected.total, 6)
    expect(actual.result).toBeCloseTo(expected.result, 6)
    expect(actual.fee).toBeCloseTo(expected.fee, 6)
    expect(expected.fee).toBeGreaterThan(0)
    expect(expected.result).not.toBe(0)
  })

  it('passes plain headers through unchanged', () => {
    const plain = Papa.parse<Trading212Transaction>(plainText, PARSE_OPTIONS)
    const fields = plain.meta.fields ?? []
    const out = normalizeSuffixedHeaders(fields, plain.data)
    expect(out.fields).toBe(fields)
    expect(out.rows).toBe(plain.data)
  })

  it('keeps an existing currency column value and ignores non-currency suffixes', () => {
    const fields = ['Action', 'Result (GBP)', 'Currency (Result)', 'Total', 'Currency (Total)', 'Notes (x)']
    const rows = [
      { Action: 'Market sell', 'Result (GBP)': 4, 'Currency (Result)': 'USD', Total: 10, 'Currency (Total)': 'GBP', 'Notes (x)': '' },
      { Action: 'Market sell', 'Result (GBP)': 6, 'Currency (Result)': null, Total: 12, 'Currency (Total)': 'GBP', 'Notes (x)': '' }
    ]
    const out = normalizeSuffixedHeaders(fields, rows)
    expect(out.fields).toEqual(['Action', 'Result', 'Currency (Result)', 'Total', 'Currency (Total)', 'Notes (x)'])
    expect(out.rows[0]).toMatchObject({ Result: 4, 'Currency (Result)': 'USD', 'Currency (Total)': 'GBP' })
    expect(out.rows[1]).toMatchObject({ Result: 6, 'Currency (Result)': 'GBP' })
    expect(out.rows[0]).not.toHaveProperty('Result (GBP)')
  })
})
