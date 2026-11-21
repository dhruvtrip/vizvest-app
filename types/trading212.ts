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
  /**
   * Internal field, not a CSV column. Set by the CSV merger to the account
   * currency detected for the file this row came from, so the normaliser can
   * tell rows from another account apart when files are merged.
   */
  sourceAccountCurrency?: string
}

/**
 * Normalized Transaction with base currency conversion
 * Extends Trading212Transaction with computed base currency amount
 */
export interface NormalizedTransaction extends Trading212Transaction {
  totalInBaseCurrency: number
  /** Realised result in the base currency. 0 when absent or in another currency. */
  resultInBaseCurrency: number
  /** Currency conversion fee in the base currency, signed as in the CSV. 0 when absent or in another currency. */
  feeInBaseCurrency: number
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
  /**
   * Net cash flow for this position: (buy volume) - (sell volume)
   * Represents the net amount of cash deployed in this stock.
   * - Positive: More money put in than taken out (net buyer)
   * - Negative: More money taken out than put in (net seller, common with partial data)
   * - Zero: Equal amounts bought and sold
   * Note: This is NOT the same as current value or unrealized P&L
   */
  netCashFlow: number
  baseCurrency: string
  status: 'holding' | 'sold'
  /**
   * Realized profit/loss from all sell transactions
   * Sourced directly from CSV 'Result' column (no manual calculation)
   */
  realizedResult: number
}

/**
 * Enhanced stock metrics with separate buy/sell volumes
 * Used for detailed stock analysis with support for partial data
 */
export interface StockMetrics {
  // Company info
  companyName: string
  isin: string
  baseCurrency: string
  
  // Buy metrics
  buyVolume: number
  buyShares: number
  buyTransactionCount: number

  // Sell metrics
  sellVolume: number
  sellShares: number
  sellTransactionCount: number
  
  // Net metrics (can be negative for partial data)
  netCashFlow: number
  netShareFlow: number
  
  // Realized profit/loss
  realizedResult: number
  
  // Metadata
  isPartialData: boolean
  positionStatus: 'net-buying' | 'net-selling' | 'flat'
  dateRange: { start: string; end: string }
}

/**
 * Partial data warning information
 * Indicates when uploaded CSV contains incomplete transaction history
 */
export interface PartialDataWarning {
  isPartialData: boolean
  affectedTickers: string[]
  reasons: string[]
  confidence: 'high' | 'medium' | 'low'
  dateRange: { start: string; end: string }
}

/**
 * Currency conversion warning
 * Emitted when some amounts could not be converted to the base currency
 * and were left out of base-currency totals rather than counted 1:1.
 */
export interface CurrencyConversionWarning {
  baseCurrency: string
  /** Rows dropped because their Total could not be converted */
  excludedRowCount: number
  /** Dropped rows grouped by their 'Currency (Total)', largest group first */
  excludedByCurrency: { currency: string; count: number }[]
  /** Kept rows whose Result was in another currency (counted as 0) */
  unconvertedResultCount: number
  /** Kept rows whose currency conversion fee was in another currency (counted as 0) */
  unconvertedFeeCount: number
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

