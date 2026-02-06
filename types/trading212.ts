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
  /**
   * Net cash flow for this position: (buy volume) - (sell volume)
   * Represents the net amount of cash deployed in this stock.
   * - Positive: More money put in than taken out (net buyer)
   * - Negative: More money taken out than put in (net seller, common with partial data)
   * - Zero: Equal amounts bought and sold
   * Note: This is NOT the same as current value or unrealized P&L
   */
  totalInvested: number
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
  avgBuyPrice: number
  
  // Sell metrics
  sellVolume: number
  sellShares: number
  sellTransactionCount: number
  avgSellPrice: number
  
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

