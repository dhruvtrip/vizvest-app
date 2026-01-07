import type { Trading212Transaction, CSVValidationResult } from '@/types/trading212'

/**
 * Required columns in Trading 212 CSV export
 * Note: Only Action and Total are universally required
 * Other fields (Ticker, shares, price) are conditional based on transaction type
 */
const REQUIRED_COLUMNS = [
  'Action',
  'Total'
] as const

/**
 * Transaction types that involve stock trading
 */
const STOCK_ACTIONS = ['Market buy', 'Market sell'] as const

/**
 * Transaction types that are account-level (no stock involved)
 */
const ACCOUNT_ACTIONS = ['Deposit', 'Dividend', 'Dividend (Dividend)'] as const

/**
 * All expected columns in Trading 212 CSV export
 */
const EXPECTED_COLUMNS = [
  'Action',
  'Time',
  'ISIN',
  'Ticker',
  'Name',
  'Notes',
  'ID',
  'No. of shares',
  'Price / share',
  'Currency (Price / share)',
  'Exchange rate',
  'Result',
  'Currency (Result)',
  'Total',
  'Currency (Total)',
  'Withholding tax',
  'Currency (Withholding tax)',
  'Currency conversion fee',
  'Currency (Currency conversion fee)'
] as const

/**
 * Validates if CSV has all required Trading 212 columns
 */
export function validateCSVColumns(headers: string[]): CSVValidationResult {
  const errors: string[] = []

  // Check if headers exist
  if (!headers || headers.length === 0) {
    return {
      isValid: false,
      errors: ['CSV file has no headers. Please ensure you are uploading a valid Trading 212 export.']
    }
  }

  // Check for required columns
  const missingColumns = REQUIRED_COLUMNS.filter(
    column => !headers.includes(column)
  )

  if (missingColumns.length > 0) {
    errors.push(
      `Missing required columns: ${missingColumns.join(', ')}. ` +
      'Please ensure you are uploading a Trading 212 CSV export.'
    )
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates individual transaction row
 * Validation is conditional based on transaction type:
 * - Stock transactions (Market buy/sell) require ticker, shares, and price
 * - Account transactions (Deposit, Dividend) don't require these fields
 */
export function validateTransaction(
  transaction: Partial<Trading212Transaction>,
  rowIndex: number
): string[] {
  const errors: string[] = []

  // Action is always required
  if (!transaction.Action || typeof transaction.Action !== 'string') {
    errors.push(`Row ${rowIndex + 1}: Missing or invalid Action`)
    return errors // Can't validate further without Action
  }

  // Determine if this is a stock transaction
  const isStockTransaction = transaction.Action === 'Market buy' || 
                             transaction.Action === 'Market sell'

  // Only validate stock-specific fields for stock transactions
  if (isStockTransaction) {
    // Validate Ticker
    if (!transaction.Ticker || typeof transaction.Ticker !== 'string') {
      errors.push(`Row ${rowIndex + 1}: Missing or invalid Ticker`)
    }

    // Validate No. of shares
    const shares = transaction['No. of shares']
    if (shares === undefined || shares === null || typeof shares !== 'number' || shares <= 0) {
      errors.push(`Row ${rowIndex + 1}: Invalid number of shares (must be positive number)`)
    }

    // Validate Price / share
    const pricePerShare = transaction['Price / share']
    if (pricePerShare === undefined || pricePerShare === null || typeof pricePerShare !== 'number') {
      errors.push(`Row ${rowIndex + 1}: Invalid price per share`)
    }
  }

  // Total is always required for all transaction types
  const total = transaction.Total
  if (total === undefined || total === null || typeof total !== 'number') {
    errors.push(`Row ${rowIndex + 1}: Invalid total amount`)
  }

  return errors
}

/**
 * Validates all parsed transactions
 */
export function validateTransactions(
  transactions: Partial<Trading212Transaction>[]
): CSVValidationResult {
  const errors: string[] = []

  if (transactions.length === 0) {
    return {
      isValid: false,
      errors: ['CSV file contains no transaction data.'],
      rowCount: 0
    }
  }

  // Validate each transaction
  transactions.forEach((transaction, index) => {
    const transactionErrors = validateTransaction(transaction, index)
    errors.push(...transactionErrors)
  })

  // Limit errors shown to user (first 10)
  const displayErrors = errors.slice(0, 10)
  if (errors.length > 10) {
    displayErrors.push(`...and ${errors.length - 10} more errors`)
  }

  return {
    isValid: errors.length === 0,
    errors: displayErrors,
    rowCount: transactions.length
  }
}

