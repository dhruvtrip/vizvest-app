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
  /**
   * Split-adjusted values, in today's share terms. Set on buy/sell rows only,
   * and only when a later stock split applies to the row. Read them through
   * getAdjustedShares / getAdjustedPricePerShare in lib/transaction-utils.ts.
   */
  /** `No. of shares` x splitFactor */
  adjustedShares?: number
  /** `Price / share` / splitFactor, in the row's own price currency */
  adjustedPricePerShare?: number
  /** Product of the ratios of all applied splits after this row; absent or 1 means unadjusted */
  splitFactor?: number
}

/**
 * Where a split event came from: split rows in the uploaded CSV, or the
 * bundled table of verified splits (lib/split-table.ts).
 */
export type SplitSource = 'csv' | 'table'

/**
 * One stock split (or reverse split) of one security
 */
export interface SplitEvent {
  /** Stable id: `${source}:${isins[0]}:${cutoff}` */
  id: string
  /** Every ISIN the security has had; a row matching any of them is affected */
  isins: string[]
  name: string
  /** New shares per old share: 20 for 20-for-1, 0.1 for 1-for-10 */
  ratio: number
  /** Human-readable ratio, e.g. "20-for-1" */
  ratioLabel: string
  /** "YYYY-MM-DD HH:mm:ss" UTC; rows with Time < cutoff are pre-split */
  cutoff: string
  source: SplitSource
  /**
   * Ticker of the CSV split rows. Used to match trade rows only when the
   * split rows carried no ISIN (`isins` is empty).
   */
  tickerFallback?: string
}

/**
 * A split event that was applied to at least one ticker in this upload
 */
export interface AppliedSplit extends SplitEvent {
  /** Tickers in this upload that were adjusted */
  tickers: string[]
  rowsAdjusted: number
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

