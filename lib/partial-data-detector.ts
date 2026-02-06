import type { NormalizedTransaction, PartialDataWarning } from '@/types/trading212'
import { isTradeAction, isBuyAction, isSellAction } from './transaction-utils'

/**
 * Detects if the uploaded CSV contains partial transaction data
 * by analyzing transaction patterns and history completeness
 */

interface TickerAnalysis {
  ticker: string
  firstTransactionDate: Date
  lastTransactionDate: Date
  firstTransactionType: string
  netShares: number
  hasSellBeforeBuy: boolean
  earlySellingActivity: boolean
}

/**
 * Analyzes transactions for a single ticker to detect partial data indicators
 */
function analyzeTickerData(transactions: NormalizedTransaction[], ticker: string): TickerAnalysis {
  const tickerTransactions = transactions
    .filter(t => t.Ticker === ticker)
    .filter(t => isTradeAction(t.Action))
    .sort((a, b) => new Date(a.Time).getTime() - new Date(b.Time).getTime())

  if (tickerTransactions.length === 0) {
    return {
      ticker,
      firstTransactionDate: new Date(),
      lastTransactionDate: new Date(),
      firstTransactionType: '',
      netShares: 0,
      hasSellBeforeBuy: false,
      earlySellingActivity: false
    }
  }

  const firstTransaction = tickerTransactions[0]
  const lastTransaction = tickerTransactions[tickerTransactions.length - 1]
  const firstTransactionDate = new Date(firstTransaction.Time)
  const lastTransactionDate = new Date(lastTransaction.Time)

  // Calculate net shares
  let netShares = 0
  let hasSeenBuy = false
  let hasSellBeforeBuy = false

  for (const t of tickerTransactions) {
    const shares = t['No. of shares'] || 0
    
    if (isBuyAction(t.Action)) {
      netShares += shares
      hasSeenBuy = true
    } else if (isSellAction(t.Action)) {
      if (!hasSeenBuy) {
        hasSellBeforeBuy = true
      }
      netShares -= shares
    }
  }

  // Check for selling activity in the first 7 days of data range
  const dataStartDate = firstTransactionDate
  const sevenDaysLater = new Date(dataStartDate)
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  const earlySellingActivity = tickerTransactions.some(t => {
    const tDate = new Date(t.Time)
    return isSellAction(t.Action) && tDate <= sevenDaysLater
  })

  return {
    ticker,
    firstTransactionDate,
    lastTransactionDate,
    firstTransactionType: firstTransaction.Action,
    netShares,
    hasSellBeforeBuy,
    earlySellingActivity
  }
}

/**
 * Calculates the date range covered by all transactions
 */
function getDateRange(transactions: NormalizedTransaction[]): { start: string; end: string } {
  if (transactions.length === 0) {
    return { start: '', end: '' }
  }

  const dates = transactions
    .map(t => new Date(t.Time))
    .sort((a, b) => a.getTime() - b.getTime())

  const start = dates[0].toISOString().split('T')[0]
  const end = dates[dates.length - 1].toISOString().split('T')[0]

  return { start, end }
}

/**
 * Formats date range as human-readable string
 */
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}

/**
 * Calculates the number of days between two date strings
 */
function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Main function to detect partial data in transaction history
 * Returns detailed warning information if partial data is detected
 */
export function detectPartialData(transactions: NormalizedTransaction[]): PartialDataWarning {
  if (transactions.length === 0) {
    return {
      isPartialData: false,
      affectedTickers: [],
      reasons: [],
      confidence: 'low',
      dateRange: { start: '', end: '' }
    }
  }

  const dateRange = getDateRange(transactions)
  const daysCovered = getDaysBetween(dateRange.start, dateRange.end)

  // Get all unique tickers with buy/sell transactions
  const tickers = [...new Set(
    transactions
      .filter(t => t.Ticker)
      .filter(t => isTradeAction(t.Action))
      .map(t => t.Ticker!)
  )]

  const affectedTickers: string[] = []
  const reasons: string[] = []
  let highConfidenceCount = 0
  let mediumConfidenceCount = 0

  // Analyze each ticker
  for (const ticker of tickers) {
    const analysis = analyzeTickerData(transactions, ticker)
    let isAffected = false
    const tickerReasons: string[] = []

    // Heuristic 1: Negative net shares (HIGH confidence)
    if (analysis.netShares < -0.0001) {
      isAffected = true
      tickerReasons.push(`${ticker}: Sold more shares than bought (net: ${analysis.netShares.toFixed(2)})`)
      highConfidenceCount++
    }

    // Heuristic 2: First transaction is a sell (HIGH confidence)
    if (analysis.hasSellBeforeBuy) {
      isAffected = true
      tickerReasons.push(`${ticker}: Sell transaction before any buy transactions`)
      highConfidenceCount++
    }

    // Heuristic 3: Selling activity in first 7 days (MEDIUM confidence)
    if (analysis.earlySellingActivity && daysCovered > 30) {
      isAffected = true
      tickerReasons.push(`${ticker}: Early selling activity suggests prior holdings`)
      mediumConfidenceCount++
    }

    if (isAffected) {
      affectedTickers.push(ticker)
      reasons.push(...tickerReasons)
    }
  }

  // Determine overall confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (highConfidenceCount > 0) {
    confidence = 'high'
  } else if (mediumConfidenceCount > 0) {
    confidence = 'medium'
  }

  const isPartialData = affectedTickers.length > 0

  return {
    isPartialData,
    affectedTickers,
    reasons,
    confidence,
    dateRange
  }
}

/**
 * Checks if a specific ticker is affected by partial data
 */
export function isTickerPartialData(
  ticker: string,
  partialDataWarning: PartialDataWarning
): boolean {
  return partialDataWarning.affectedTickers.includes(ticker)
}

/**
 * Gets a human-readable explanation for why partial data was detected
 */
export function getPartialDataExplanation(partialDataWarning: PartialDataWarning): string {
  if (!partialDataWarning.isPartialData) {
    return ''
  }

  const { start, end } = partialDataWarning.dateRange
  const formattedRange = formatDateRange(start, end)
  const tickerCount = partialDataWarning.affectedTickers.length
  const tickerWord = tickerCount === 1 ? 'stock' : 'stocks'

  return `This CSV contains transactions from ${formattedRange} only. ${tickerCount} ${tickerWord} show activity patterns suggesting prior holdings or transactions outside this period are not included.`
}

/**
 * Gets ticker-specific explanation for partial data
 */
export function getTickerPartialDataExplanation(
  ticker: string,
  transactions: NormalizedTransaction[]
): string {
  const analysis = analyzeTickerData(transactions, ticker)
  
  if (analysis.netShares < -0.0001) {
    return `You sold ${Math.abs(analysis.netShares).toFixed(2)} more shares than you bought in this period, indicating you held shares from before.`
  }
  
  if (analysis.hasSellBeforeBuy) {
    return 'Sell transactions appear before any buy transactions, indicating prior holdings not shown in this data.'
  }
  
  if (analysis.earlySellingActivity) {
    return 'Early selling activity suggests you held shares from before the start of this data period.'
  }
  
  return 'Metrics show activity within the uploaded timeframe only.'
}
