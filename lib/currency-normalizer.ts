import type {
  Trading212Transaction,
  NormalizedTransaction,
  CurrencyConversionWarning
} from '@/types/trading212'

/**
 * Default base currency when detection is not possible
 */
const DEFAULT_BASE_CURRENCY = 'USD'

/**
 * Rates this close to 1 on a row whose currency differs from the base are
 * treated as missing: a rate of 1 most likely means the trade was paid from a
 * balance in that currency, so dividing by it would count the amount 1:1.
 */
const RATE_EPSILON = 1e-6

function currencyCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const code = value.trim().toUpperCase()
  return code || undefined
}

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
 * Whether a row's Total can be trusted as convertible to the base currency.
 *
 * A row whose 'Currency (Total)' is the base currency (or blank, treated as
 * the base) is always convertible. A row in another currency C is not when:
 * - it came from a merged file whose account currency is not the base (its
 *   Exchange rate is instrument → that account's currency, not → the base), or
 * - its Exchange rate is missing, invalid, or ≈1 (likely paid from a wallet).
 * Otherwise `Total / Exchange rate` gives the base amount.
 */
export function canConvertTotal(
  transaction: Trading212Transaction,
  baseCurrency: string
): boolean {
  const base = baseCurrency.trim().toUpperCase()
  const currency = currencyCode(transaction['Currency (Total)'])
  if (!currency || currency === base) return true

  const sourceAccount = currencyCode(transaction.sourceAccountCurrency)
  if (sourceAccount && sourceAccount !== base) return false

  const rate = transaction['Exchange rate']
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return false
  if (Math.abs(rate - 1) < RATE_EPSILON) return false

  return true
}

/**
 * Converts a row's Total to the base currency.
 * Returns null when the Total cannot be converted (see canConvertTotal).
 *
 * @example
 * normalizeToBaseCurrency(transaction, 'EUR')
 * // 100 USD with Exchange rate 1.175 (1 EUR = 1.175 USD) returns 85.11
 */
export function normalizeToBaseCurrency(
  transaction: Trading212Transaction,
  baseCurrency: string
): number | null {
  const total = typeof transaction.Total === 'number' ? transaction.Total : 0
  const base = baseCurrency.trim().toUpperCase()
  const currency = currencyCode(transaction['Currency (Total)'])
  if (!currency || currency === base) return total

  if (!canConvertTotal(transaction, base)) return null

  // T212's Exchange rate = units of stock currency per 1 unit of account currency
  return total / (transaction['Exchange rate'] as number)
}

/**
 * Normalises a secondary amount (Result, currency conversion fee) that carries
 * its own currency column. These have no exchange rate of their own, so:
 * - currency equals the base → the amount as is
 * - currency blank or missing → treated as the base
 * - any other currency → null (unconvertible)
 * A missing or non-numeric amount is 0.
 */
export function normalizeAmount(
  amount: unknown,
  currency: unknown,
  baseCurrency: string
): number | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) return 0
  const code = currencyCode(currency)
  if (!code || code === baseCurrency.trim().toUpperCase()) return amount
  return null
}

export interface NormalizationResult {
  transactions: NormalizedTransaction[]
  warning: CurrencyConversionWarning | null
}

/**
 * Normalizes all transactions to a common base currency
 * Detects the base currency automatically (or uses the forced one) and converts
 * Total, Result and the currency conversion fee.
 *
 * Rows whose Total cannot be converted are dropped, so share counts and costs
 * stay consistent per ticker. Unconvertible Result or fee values on kept rows
 * become 0. Both are reported in the returned warning (null when none).
 */
export function normalizeAllTransactions(
  transactions: Trading212Transaction[],
  forcedBaseCurrency?: string
): NormalizationResult {
  if (!transactions || transactions.length === 0) {
    return { transactions: [], warning: null }
  }

  // Use the caller-specified base currency when provided, otherwise auto-detect
  const baseCurrency = forcedBaseCurrency
    ? forcedBaseCurrency.trim().toUpperCase()
    : detectBaseCurrency(transactions)

  const excluded = new Map<string, number>()
  let excludedRowCount = 0
  let unconvertedResultCount = 0
  let unconvertedFeeCount = 0
  const normalized: NormalizedTransaction[] = []

  for (const transaction of transactions) {
    const total = normalizeToBaseCurrency(transaction, baseCurrency)
    if (total === null) {
      const currency = currencyCode(transaction['Currency (Total)']) ?? 'unknown'
      excluded.set(currency, (excluded.get(currency) ?? 0) + 1)
      excludedRowCount++
      continue
    }

    const result = normalizeAmount(transaction.Result, transaction['Currency (Result)'], baseCurrency)
    if (result === null) unconvertedResultCount++

    const fee = normalizeAmount(
      transaction['Currency conversion fee'],
      transaction['Currency (Currency conversion fee)'],
      baseCurrency
    )
    if (fee === null) unconvertedFeeCount++

    normalized.push({
      ...transaction,
      totalInBaseCurrency: total,
      resultInBaseCurrency: result ?? 0,
      feeInBaseCurrency: fee ?? 0,
      detectedBaseCurrency: baseCurrency
    })
  }

  const hasIssues = excludedRowCount > 0 || unconvertedResultCount > 0 || unconvertedFeeCount > 0
  const warning: CurrencyConversionWarning | null = hasIssues
    ? {
        baseCurrency,
        excludedRowCount,
        excludedByCurrency: [...excluded]
          .map(([currency, count]) => ({ currency, count }))
          .sort((a, b) => b.count - a.count || a.currency.localeCompare(b.currency)),
        unconvertedResultCount,
        unconvertedFeeCount
      }
    : null

  return { transactions: normalized, warning }
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * Gets a human-readable explanation of a currency conversion warning
 */
export function getCurrencyWarningExplanation(warning: CurrencyConversionWarning): string {
  const sentences: string[] = []
  const base = warning.baseCurrency

  if (warning.excludedRowCount > 0) {
    const currencies = warning.excludedByCurrency.length === 1
      ? warning.excludedByCurrency[0].currency
      : joinList(warning.excludedByCurrency.map(({ currency, count }) => `${currency} (${count})`))
    const verb = warning.excludedRowCount === 1 ? 'is' : 'are'
    sentences.push(
      `${plural(warning.excludedRowCount, 'transaction')} in ${currencies} could not be converted to ${base} and ${verb} left out of your figures.`
    )
  }

  const amounts: string[] = []
  if (warning.unconvertedResultCount > 0) {
    amounts.push(plural(warning.unconvertedResultCount, 'realised result'))
  }
  if (warning.unconvertedFeeCount > 0) {
    amounts.push(plural(warning.unconvertedFeeCount, 'conversion fee'))
  }
  if (amounts.length > 0) {
    const total = warning.unconvertedResultCount + warning.unconvertedFeeCount
    sentences.push(
      `${joinList(amounts)} in another currency ${total === 1 ? 'is' : 'are'} counted as zero.`
    )
  }

  if (sentences.length === 0) return ''
  sentences.push('This happens when exports from accounts in different currencies are combined, or a trade was paid from another currency balance.')
  return sentences.join(' ')
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

