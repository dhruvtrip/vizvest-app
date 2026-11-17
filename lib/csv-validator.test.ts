import { describe, expect, it } from 'vitest'
import type { Trading212Transaction } from '@/types/trading212'
import { validateCSVColumns, validateTransaction, validateTransactions } from './csv-validator'

function row(overrides: Partial<Trading212Transaction> = {}): Partial<Trading212Transaction> {
  return {
    Action: 'Market buy',
    Time: '2025-01-10 15:00:00',
    ISIN: 'ZZ0000000018',
    Ticker: 'ABC',
    'No. of shares': 2,
    'Price / share': 10,
    Total: 20,
    'Currency (Total)': 'USD',
    ...overrides
  }
}

describe('validateCSVColumns', () => {
  it('requires Action and Total', () => {
    expect(validateCSVColumns(['Action', 'Time', 'Total']).isValid).toBe(true)
    expect(validateCSVColumns(['Action', 'Time']).isValid).toBe(false)
    expect(validateCSVColumns([]).isValid).toBe(false)
  })
})

describe('validateTransaction', () => {
  it('accepts a complete buy row', () => {
    expect(validateTransaction(row(), 0)).toEqual([])
  })

  it('rejects a buy row without shares, price or Total', () => {
    const errors = validateTransaction(
      row({ 'No. of shares': undefined, 'Price / share': undefined, Total: undefined as unknown as number }),
      4
    )
    expect(errors).toEqual([
      'Row 5: Invalid number of shares (must be positive number)',
      'Row 5: Invalid price per share',
      'Row 5: Invalid total amount'
    ])
  })

  it('rejects a non-split, non-trade row without a numeric Total', () => {
    expect(validateTransaction({ Action: 'Deposit', Total: '' as unknown as number }, 0)).toEqual([
      'Row 1: Invalid total amount'
    ])
  })

  it.each(['Stock split open', 'Stock split close', 'Stock Split', ' stock split OPEN '])(
    'accepts a "%s" row with a blank Total',
    action => {
      expect(validateTransaction(row({ Action: action, Total: null as unknown as number }), 0)).toEqual([])
      expect(validateTransaction(row({ Action: action, Total: '' as unknown as number }), 0)).toEqual([])
      expect(validateTransaction(row({ Action: action, Total: undefined as unknown as number }), 0)).toEqual([])
    }
  )

  it('does not apply trade checks to split rows', () => {
    const split = row({
      Action: 'Stock split close',
      'No. of shares': undefined,
      'Price / share': undefined,
      Ticker: undefined
    })
    expect(validateTransaction(split, 0)).toEqual([])
  })

  it('still requires an Action', () => {
    expect(validateTransaction({ Total: 1 }, 2)).toEqual(['Row 3: Missing or invalid Action'])
  })
})

describe('validateTransactions', () => {
  it('accepts an upload mixing trades and split rows with blank Totals', () => {
    const result = validateTransactions([
      row(),
      row({ Action: 'Stock split close', Total: null as unknown as number }),
      row({ Action: 'Stock split open', 'No. of shares': 8, Total: null as unknown as number }),
      row({ Action: 'Market sell', Time: '2025-07-01 15:00:00', 'No. of shares': 8, 'Price / share': 3, Total: 24 })
    ])
    expect(result).toEqual({ isValid: true, errors: [], rowCount: 4 })
  })

  it('rejects an empty upload', () => {
    expect(validateTransactions([]).isValid).toBe(false)
  })
})
