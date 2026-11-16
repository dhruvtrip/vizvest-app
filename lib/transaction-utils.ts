/**
 * Trading 212 Transaction Utilities
 * Centralized utilities for handling transaction actions
 * Single source of truth for action type checking
 */

/**
 * Trading 212 transaction action types
 * Based on actual CSV export values
 */
export const TransactionAction = {
  MARKET_BUY: 'Market buy',
  LIMIT_BUY: 'Limit buy',
  STOP_LIMIT_BUY: 'Stop limit buy',
  MARKET_SELL: 'Market sell',
  LIMIT_SELL: 'Limit sell',
  STOP_SELL: 'Stop sell',
  DEPOSIT: 'Deposit',
  DIVIDEND: 'Dividend (Dividend)',
  INTEREST: 'Interest on cash',
  STOCK_SPLIT_OPEN: 'Stock split open',
  STOCK_SPLIT_CLOSE: 'Stock split close'
} as const

/**
 * Single-row split label seen in older exports. It carries no ratio, so it is
 * recognised (and reported) but never used to adjust anything.
 */
const LEGACY_STOCK_SPLIT_ACTION = 'stock split'

export type TransactionActionType = typeof TransactionAction[keyof typeof TransactionAction]

/**
 * Check if transaction is a buy action (Market, Limit, or Stop limit)
 */
export function isBuyAction(action: string): boolean {
  return (
    action === TransactionAction.MARKET_BUY ||
    action === TransactionAction.LIMIT_BUY ||
    action === TransactionAction.STOP_LIMIT_BUY
  )
}

/**
 * Check if transaction is a sell action (Market or Limit)
 */
export function isSellAction(action: string): boolean {
  return (
    action === TransactionAction.MARKET_SELL ||
    action === TransactionAction.LIMIT_SELL ||
    action === TransactionAction.STOP_SELL
  )
}

/**
 * Check if transaction is a trade (buy or sell)
 */
export function isTradeAction(action: string): boolean {
  return isBuyAction(action) || isSellAction(action)
}

/**
 * Check if transaction is a dividend
 */
export function isDividendAction(action: string): boolean {
  return action.toLowerCase().includes('dividend')
}

/**
 * Check if transaction is a deposit
 */
export function isDepositAction(action: string): boolean {
  return action === TransactionAction.DEPOSIT
}

function normalizeAction(action: string | undefined | null): string {
  return typeof action === 'string' ? action.trim().toLowerCase() : ''
}

/**
 * Check if a row is the "after" half of a stock split pair
 * (the whole position, in post-split shares)
 */
export function isSplitOpenAction(action: string): boolean {
  return normalizeAction(action) === TransactionAction.STOCK_SPLIT_OPEN.toLowerCase()
}

/**
 * Check if a row is the "before" half of a stock split pair
 * (the whole position, in pre-split shares)
 */
export function isSplitCloseAction(action: string): boolean {
  return normalizeAction(action) === TransactionAction.STOCK_SPLIT_CLOSE.toLowerCase()
}

/**
 * Check if a row is any kind of stock split row, including the legacy
 * single-row `Stock Split` label.
 *
 * Split rows are never trades: they are deliberately excluded from
 * isBuyAction / isSellAction / isTradeAction, and their `Total` is a position
 * value, not a cash flow.
 */
export function isSplitAction(action: string): boolean {
  return (
    isSplitOpenAction(action) ||
    isSplitCloseAction(action) ||
    normalizeAction(action) === LEGACY_STOCK_SPLIT_ACTION
  )
}

interface ShareFields {
  'No. of shares'?: number | null
  'Price / share'?: number | null
  adjustedShares?: number
  adjustedPricePerShare?: number
}

/**
 * Share count of a row in today's share terms (split-adjusted when a later
 * split applies). Every share aggregation must use this instead of reading
 * `No. of shares` directly; transaction tables keep showing the as-traded value.
 */
export function getAdjustedShares(t: ShareFields): number {
  return t.adjustedShares ?? t['No. of shares'] ?? 0
}

/**
 * Price per share of a row in today's share terms, in the row's own price
 * currency. Counterpart of getAdjustedShares.
 */
export function getAdjustedPricePerShare(t: ShareFields): number {
  return t.adjustedPricePerShare ?? t['Price / share'] ?? 0
}
