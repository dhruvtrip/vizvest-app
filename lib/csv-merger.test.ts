import { describe, it, expect } from 'vitest'
import { dedupeKey, mergeAndDedupe } from './csv-merger'
import type { Trading212Transaction } from '@/types/trading212'

function makeTx(overrides: Partial<Trading212Transaction> = {}): Trading212Transaction {
  return {
    Action: 'Market buy',
    Time: '2024-01-15 10:00:00',
    Ticker: 'AAPL',
    'No. of shares': 10,
    'Price / share': 150,
    Total: 1500,
    'Currency (Total)': 'USD',
    ...overrides
  }
}

describe('dedupeKey', () => {
  it('uses the T212 ID when present', () => {
    const tx = makeTx({ ID: 'abc-123' })
    expect(dedupeKey(tx)).toBe('id:abc-123')
  })

  it('falls back to a composite key when ID is missing', () => {
    const tx = makeTx()
    expect(dedupeKey(tx)).toBe(
      'composite:2024-01-15 10:00:00|Market buy|AAPL|10|1500|USD'
    )
  })

  it('treats whitespace-only IDs as missing', () => {
    const tx = makeTx({ ID: '   ' })
    expect(dedupeKey(tx).startsWith('composite:')).toBe(true)
  })
})

describe('mergeAndDedupe', () => {
  it('removes rows that share a T212 ID across files', () => {
    const shared = makeTx({ ID: 'same-id' })
    const result = mergeAndDedupe([
      { fileName: 'a.csv', data: [shared, makeTx({ ID: 'a1' })] },
      { fileName: 'b.csv', data: [shared, makeTx({ ID: 'b1' })] }
    ])
    expect(result.merged.length).toBe(3)
    expect(result.duplicatesRemoved).toBe(1)
    expect(result.totalRowsBeforeDedupe).toBe(4)
  })

  it('dedupes via composite key when IDs are absent', () => {
    const a = makeTx()
    const b = makeTx()
    const different = makeTx({ 'No. of shares': 12 })
    const result = mergeAndDedupe([
      { fileName: 'a.csv', data: [a] },
      { fileName: 'b.csv', data: [b, different] }
    ])
    expect(result.merged.length).toBe(2)
    expect(result.duplicatesRemoved).toBe(1)
  })

  it('returns a single-file input untouched', () => {
    const tx1 = makeTx({ ID: '1' })
    const tx2 = makeTx({ ID: '2' })
    const result = mergeAndDedupe([
      { fileName: 'only.csv', data: [tx1, tx2] }
    ])
    expect(result.merged).toEqual([tx1, tx2])
    expect(result.duplicatesRemoved).toBe(0)
    expect(result.fileCount).toBe(1)
  })

  it('flags a base-currency conflict in uniqueBaseCurrencies', () => {
    const result = mergeAndDedupe([
      {
        fileName: 'eur.csv',
        data: [makeTx({ 'Currency (Total)': 'EUR' })]
      },
      {
        fileName: 'usd.csv',
        data: [makeTx({ ID: 'x', 'Currency (Total)': 'USD' })]
      }
    ])
    expect(result.uniqueBaseCurrencies.sort()).toEqual(['EUR', 'USD'])
    expect(result.perFileBaseCurrencies).toHaveLength(2)
  })

  it('reports a single base currency when all files agree', () => {
    const result = mergeAndDedupe([
      { fileName: 'a.csv', data: [makeTx({ ID: '1' })] },
      { fileName: 'b.csv', data: [makeTx({ ID: '2' })] }
    ])
    expect(result.uniqueBaseCurrencies).toEqual(['USD'])
  })
})
