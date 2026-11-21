import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import {
  canConvertTotal,
  getCurrencyWarningExplanation,
  normalizeAllTransactions,
  normalizeAmount
} from './currency-normalizer'
import { mergeAndDedupe } from './csv-merger'
import { isSellAction } from './transaction-utils'
import type { NormalizedTransaction, Trading212Transaction } from '@/types/trading212'

function loadFixture(name: string): Trading212Transaction[] {
  const text = fs.readFileSync(path.join(__dirname, '__fixtures__', name), 'utf8')
  // Same options as components/features/csv-upload.tsx
  const parsed = Papa.parse<Trading212Transaction>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  })
  return parsed.data
}

function tx(overrides: Partial<Trading212Transaction> = {}): Trading212Transaction {
  return {
    Action: 'Market sell',
    Time: '2024-01-15 10:00:00',
    Ticker: 'AAPL',
    'No. of shares': 1,
    'Price / share': 100,
    Total: 100,
    'Currency (Total)': 'GBP',
    ...overrides
  }
}

const sum = (rows: NormalizedTransaction[], pick: (t: NormalizedTransaction) => number) =>
  rows.reduce((acc, t) => acc + pick(t), 0)

describe('normalizeAllTransactions on single-account EUR exports', () => {
  for (const fixture of ['t212-eur-100.csv', 't212-eur-multi-year.csv']) {
    it(`leaves ${fixture} figures unchanged`, () => {
      const raw = loadFixture(fixture)
      expect(raw.length).toBeGreaterThan(0)

      const { transactions, warning } = normalizeAllTransactions(raw)

      expect(warning).toBeNull()
      expect(transactions).toHaveLength(raw.length)
      transactions.forEach((t, i) => {
        const source = raw[i]
        expect(t.detectedBaseCurrency).toBe('EUR')
        expect(t.totalInBaseCurrency).toBe(source.Total)
        expect(t.resultInBaseCurrency).toBe(source.Result ?? 0)
        expect(t.feeInBaseCurrency).toBe(source['Currency conversion fee'] ?? 0)
      })
    })
  }
})

describe('normalizeAllTransactions with merged accounts', () => {
  const gbpAccount: Trading212Transaction[] = [
    tx({ ID: 'g1', Action: 'Market buy', Total: 1000, 'Exchange rate': 1.27, 'Currency conversion fee': 1.5, 'Currency (Currency conversion fee)': 'GBP' }),
    tx({ ID: 'g2', Total: 600, Result: 120, 'Currency (Result)': 'GBP', 'Exchange rate': 1.27, 'Currency conversion fee': 0.9, 'Currency (Currency conversion fee)': 'GBP' }),
    tx({ ID: 'g3', Total: 300, Result: -40, 'Currency (Result)': 'GBP', 'Exchange rate': 1.27 })
  ]

  it('excludes rows from the EUR account when GBP is forced, and warns', () => {
    const eurAccount = loadFixture('t212-eur-100.csv')
    const merge = mergeAndDedupe([
      { fileName: 'gbp.csv', data: gbpAccount },
      { fileName: 'eur.csv', data: eurAccount }
    ])
    expect(merge.uniqueBaseCurrencies.sort()).toEqual(['EUR', 'GBP'])

    const { transactions, warning } = normalizeAllTransactions(merge.merged, 'GBP')

    expect(transactions.map(t => t.ID)).toEqual(['g1', 'g2', 'g3'])
    expect(warning).not.toBeNull()
    expect(warning!.baseCurrency).toBe('GBP')
    expect(warning!.excludedRowCount).toBe(eurAccount.length)
    expect(warning!.excludedByCurrency).toEqual([{ currency: 'EUR', count: eurAccount.length }])

    const realised = sum(transactions.filter(t => isSellAction(t.Action)), t => t.resultInBaseCurrency)
    expect(realised).toBe(80)
    const fees = sum(transactions, t => Math.abs(t.feeInBaseCurrency))
    expect(fees).toBeCloseTo(2.4)
  })

  it('keeps a row from another account file when its Total is already in the base currency', () => {
    const merge = mergeAndDedupe([
      { fileName: 'gbp.csv', data: gbpAccount },
      {
        fileName: 'eur.csv',
        data: [
          tx({ ID: 'e1', 'Currency (Total)': 'EUR', Total: 50, 'Exchange rate': 1.1 }),
          tx({ ID: 'e2', 'Currency (Total)': 'EUR', Total: 70, 'Exchange rate': 1.1 }),
          tx({ ID: 'e3', Total: 20, Result: 5, 'Currency (Result)': 'EUR' })
        ]
      }
    ])
    const { transactions, warning } = normalizeAllTransactions(merge.merged, 'GBP')
    const kept = transactions.find(t => t.ID === 'e3')!
    expect(kept.totalInBaseCurrency).toBe(20)
    expect(kept.resultInBaseCurrency).toBe(0)
    expect(warning!.excludedByCurrency).toEqual([{ currency: 'EUR', count: 2 }])
    expect(warning!.unconvertedResultCount).toBe(1)
  })
})

describe('normalizeAllTransactions with foreign-currency rows in one account', () => {
  const base = tx({ ID: 'b1', Total: 500 })

  it.each([
    ['rate 1', 1],
    ['rate within 1e-6 of 1', 1.0000004],
    ['missing rate', undefined],
    ['zero rate', 0],
    ['NaN rate', Number.NaN]
  ])('excludes a USD row with %s and warns', (_label, rate) => {
    const usd = tx({ ID: 'u1', 'Currency (Total)': 'USD', Total: 127, 'Exchange rate': rate })
    const { transactions, warning } = normalizeAllTransactions([base, usd], 'GBP')
    expect(transactions.map(t => t.ID)).toEqual(['b1'])
    expect(warning).toEqual({
      baseCurrency: 'GBP',
      excludedRowCount: 1,
      excludedByCurrency: [{ currency: 'USD', count: 1 }],
      unconvertedResultCount: 0,
      unconvertedFeeCount: 0
    })
  })

  it.each([
    ['no source account', undefined],
    ['a GBP source account', 'GBP']
  ])('converts a USD row with a valid rate and %s', (_label, sourceAccountCurrency) => {
    const usd = tx({ ID: 'u1', 'Currency (Total)': 'USD', Total: 127, 'Exchange rate': 1.27, sourceAccountCurrency })
    const { transactions, warning } = normalizeAllTransactions([base, usd], 'GBP')
    expect(warning).toBeNull()
    expect(transactions[1].totalInBaseCurrency).toBeCloseTo(100)
  })

  it('counts a Result or fee in another currency as 0 on a kept row', () => {
    const row = tx({
      Total: 200,
      Result: 30,
      'Currency (Result)': 'USD',
      'Currency conversion fee': 0.4,
      'Currency (Currency conversion fee)': 'EUR'
    })
    const { transactions, warning } = normalizeAllTransactions([base, row], 'GBP')
    expect(transactions).toHaveLength(2)
    expect(transactions[1].totalInBaseCurrency).toBe(200)
    expect(transactions[1].resultInBaseCurrency).toBe(0)
    expect(transactions[1].feeInBaseCurrency).toBe(0)
    expect(warning).toMatchObject({ excludedRowCount: 0, unconvertedResultCount: 1, unconvertedFeeCount: 1 })
  })

  it('treats a blank currency as the base currency', () => {
    const row = tx({ Total: 80, 'Currency (Total)': '', Result: 12, 'Exchange rate': 1.27 })
    const { transactions, warning } = normalizeAllTransactions([base, row], 'GBP')
    expect(warning).toBeNull()
    expect(transactions[1].totalInBaseCurrency).toBe(80)
    expect(transactions[1].resultInBaseCurrency).toBe(12)
  })

  it('returns an empty result for no input', () => {
    expect(normalizeAllTransactions([])).toEqual({ transactions: [], warning: null })
  })
})

describe('canConvertTotal and normalizeAmount', () => {
  it('distrusts a foreign row from an account in another currency', () => {
    const row = tx({ 'Currency (Total)': 'EUR', 'Exchange rate': 1.18, sourceAccountCurrency: 'EUR' })
    expect(canConvertTotal(row, 'GBP')).toBe(false)
    expect(canConvertTotal(row, 'EUR')).toBe(true)
  })

  it('normalises amounts by their own currency column', () => {
    expect(normalizeAmount(5, 'gbp', 'GBP')).toBe(5)
    expect(normalizeAmount(5, undefined, 'GBP')).toBe(5)
    expect(normalizeAmount(5, 'USD', 'GBP')).toBeNull()
    expect(normalizeAmount(null, 'USD', 'GBP')).toBe(0)
  })
})

describe('getCurrencyWarningExplanation', () => {
  it('lists excluded currencies and unconverted amounts', () => {
    const text = getCurrencyWarningExplanation({
      baseCurrency: 'GBP',
      excludedRowCount: 12,
      excludedByCurrency: [
        { currency: 'EUR', count: 8 },
        { currency: 'USD', count: 4 }
      ],
      unconvertedResultCount: 3,
      unconvertedFeeCount: 1
    })
    expect(text).toContain('12 transactions in EUR (8) and USD (4) could not be converted to GBP and are left out of your figures.')
    expect(text).toContain('3 realised results and 1 conversion fee in another currency are counted as zero.')
  })

  it('uses the singular for one transaction', () => {
    const text = getCurrencyWarningExplanation({
      baseCurrency: 'GBP',
      excludedRowCount: 1,
      excludedByCurrency: [{ currency: 'USD', count: 1 }],
      unconvertedResultCount: 0,
      unconvertedFeeCount: 0
    })
    expect(text).toMatch(/^1 transaction in USD could not be converted to GBP and is left out of your figures\./)
  })
})
