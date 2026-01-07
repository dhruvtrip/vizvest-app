/**
 * Trading 212 CSV Transaction Type
 * Based on Trading 212 export format
 * 
 * Note: Some fields are optional depending on transaction type:
 * - Stock transactions (Market buy/sell): Have Ticker, shares, price
 * - Account transactions (Deposit): No ticker, shares, or price
 * - Dividend transactions: Have ticker and dividend-specific data
 */
export interface Trading212Transaction {
  Action: string
  Time: string
  ISIN?: string
  Ticker?: string
  Name?: string
  Notes?: string
  ID?: string
  'No. of shares'?: number
  'Price / share'?: number
  'Currency (Price / share)'?: string
  'Exchange rate'?: number
  Result?: number
  'Currency (Result)'?: string
  Total: number
  'Currency (Total)': string
  'Withholding tax'?: number
  'Currency (Withholding tax)'?: string
  'Currency conversion fee'?: number
  'Currency (Currency conversion fee)'?: string
}

/**
 * Normalized Transaction with base currency conversion
 * Extends Trading212Transaction with computed base currency amount
 */
export interface NormalizedTransaction extends Trading212Transaction {
  totalInBaseCurrency: number
  detectedBaseCurrency: string
}

/**
 * Aggregated stock position from transactions
 * Represents a single stock holding with calculated totals
 */
export interface StockPosition {
  ticker: string
  name: string
  totalShares: number
  totalInvested: number
  baseCurrency: string
}

/**
 * CSV Validation Result
 */
export interface CSVValidationResult {
  isValid: boolean
  errors: string[]
  rowCount?: number
}

/**
 * CSV Parse Result
 */
export interface CSVParseResult {
  data: Trading212Transaction[]
  errors: string[]
  meta: {
    rowCount: number
    hasHeaders: boolean
  }
}

