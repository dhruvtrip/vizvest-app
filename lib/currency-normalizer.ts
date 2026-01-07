import type { Trading212Transaction, NormalizedTransaction } from '@/types/trading212'

/**
 * Default base currency when detection is not possible
 */
const DEFAULT_BASE_CURRENCY = 'USD'

/**
 * Default exchange rate when not provided
 */
const DEFAULT_EXCHANGE_RATE = 1.0

/**
 * Detects the base currency from a list of transactions
 * Returns the most frequently occurring currency in the "Currency (Total)" column
 * 
 * @param transactions - Array of Trading 212 transactions
 * @returns The detected base currency code (e.g., 'USD', 'EUR', 'GBP')
 * 
 * @example
 * const baseCurrency = detectBaseCurrency(transactions)
 * // Returns 'EUR' if most transactions have EUR as their total currency
 */
export function detectBaseCurrency(transactions: Trading212Transaction[]): string {
  // Handle empty array edge case
  if (!transactions || transactions.length === 0) {
    return DEFAULT_BASE_CURRENCY
  }

  // Count currency occurrences
  const currencyCount = new Map<string, number>()

  for (const transaction of transactions) {
    const currency = transaction['Currency (Total)']
    
    // Skip transactions with missing currency field
    if (!currency || typeof currency !== 'string') {
      continue
    }

    const normalizedCurrency = currency.trim().toUpperCase()
    if (normalizedCurrency) {
      currencyCount.set(
        normalizedCurrency,
        (currencyCount.get(normalizedCurrency) || 0) + 1
      )
    }
  }

  // If no valid currencies found, return default
  if (currencyCount.size === 0) {
    return DEFAULT_BASE_CURRENCY
  }

  // Find the most frequent currency
  let maxCount = 0
  let baseCurrency = DEFAULT_BASE_CURRENCY

  for (const [currency, count] of currencyCount) {
    if (count > maxCount) {
      maxCount = count
      baseCurrency = currency
    }
  }

  return baseCurrency
}

/**
 * Normalizes a single transaction amount to the base currency
 * Uses the formula: baseAmount = total * exchangeRate
 * 
 * @param transaction - A single Trading 212 transaction
 * @param baseCurrency - The target base currency to normalize to
 * @returns The transaction total converted to base currency
 * 
 * @example
 * const baseAmount = normalizeToBaseCurrency(transaction, 'EUR')
 * // If transaction is 100 USD with exchangeRate 0.85, returns 85
 */
export function normalizeToBaseCurrency(
  transaction: Trading212Transaction,
  baseCurrency: string
): number {
  // Handle null/undefined Total
  const total = transaction.Total ?? 0

  // Get the transaction's currency
  const transactionCurrency = transaction['Currency (Total)']?.trim().toUpperCase()

  // If currencies match, no conversion needed
  if (transactionCurrency === baseCurrency.toUpperCase()) {
    return total
  }

  // Get exchange rate, defaulting to 1.0 if not provided
  const exchangeRate = transaction['Exchange rate'] ?? DEFAULT_EXCHANGE_RATE

  // Handle invalid exchange rates
  if (typeof exchangeRate !== 'number' || !isFinite(exchangeRate) || exchangeRate <= 0) {
    return total
  }

  // Apply conversion formula: baseAmount = total * exchangeRate
  return total * exchangeRate
}

/**
 * Normalizes all transactions to a common base currency
 * Detects the base currency automatically and converts all amounts
 * 
 * @param transactions - Array of Trading 212 transactions
 * @returns Array of normalized transactions with totalInBaseCurrency field
 * 
 * @example
 * const normalized = normalizeAllTransactions(transactions)
 * // Each transaction now has totalInBaseCurrency and detectedBaseCurrency fields
 */
export function normalizeAllTransactions(
  transactions: Trading212Transaction[]
): NormalizedTransaction[] {
  // Handle empty array edge case
  if (!transactions || transactions.length === 0) {
    return []
  }

  // Detect the base currency once for all transactions
  const baseCurrency = detectBaseCurrency(transactions)

  // Normalize each transaction
  return transactions.map(transaction => ({
    ...transaction,
    totalInBaseCurrency: normalizeToBaseCurrency(transaction, baseCurrency),
    detectedBaseCurrency: baseCurrency
  }))
}

/**
 * Gets a summary of currencies present in the transactions
 * Useful for displaying currency distribution to users
 * 
 * @param transactions - Array of Trading 212 transactions
 * @returns Object mapping currency codes to their occurrence count
 */
export function getCurrencySummary(
  transactions: Trading212Transaction[]
): Record<string, number> {
  if (!transactions || transactions.length === 0) {
    return {}
  }

  const summary: Record<string, number> = {}

  for (const transaction of transactions) {
    const currency = transaction['Currency (Total)']?.trim().toUpperCase()
    if (currency) {
      summary[currency] = (summary[currency] || 0) + 1
    }
  }

  return summary
}

