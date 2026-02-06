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
  MARKET_SELL: 'Market sell',
  LIMIT_SELL: 'Limit sell',
  DEPOSIT: 'Deposit',
  DIVIDEND: 'Dividend (Dividend)',
  INTEREST: 'Interest on cash'
} as const

export type TransactionActionType = typeof TransactionAction[keyof typeof TransactionAction]

/**
 * Check if transaction is a buy action (Market or Limit)
 */
export function isBuyAction(action: string): boolean {
  return (
    action === TransactionAction.MARKET_BUY ||
    action === TransactionAction.LIMIT_BUY
  )
}

/**
 * Check if transaction is a sell action (Market or Limit)
 */
export function isSellAction(action: string): boolean {
  return (
    action === TransactionAction.MARKET_SELL ||
    action === TransactionAction.LIMIT_SELL
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
