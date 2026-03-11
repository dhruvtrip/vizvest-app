'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import posthog from 'posthog-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AnimatedCurrency, AnimatedCount } from '@/components/ui/animated-number'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { TradingHeatmap } from '@/components/ui/trading-heatmap'
import { isTradeAction, isBuyAction } from '@/lib/transaction-utils'

/**
 * Currency symbols for common currencies
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBX: 'p',
  GBP: '£',
  EUR: '€',
  CHF: 'CHF',
  CAD: 'C$'
}

/**
 * Gets the currency symbol for a given currency code
 */
function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency
}

/**
 * Formats a number as currency with symbol
 */
function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))

  const sign = amount < 0 ? '-' : ''
  return `${sign}${symbol}${formatted}`
}

/**
 * Formats a date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * Formats shares number
 */
function formatShares(shares: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(shares)
}

/**
 * Extracts year from date string
 */
function getYear(dateString: string): number {
  return new Date(dateString).getFullYear()
}

interface TradingMetrics {
  totalTransactions: number
  buyCount: number
  sellCount: number
  totalBuyVolume: number
  totalSellVolume: number
  netCashFlow: number
  realizedPnL: number
  profitableTrades: number
  losingTrades: number
  winRate: number
  averageTransactionSize: number
  mostTradedStock: {
    ticker: string
    name: string
    count: number
  } | null
  baseCurrency: string
}

/**
 * Calculates trading metrics from transactions
 */
function calculateTradingMetrics(
  transactions: NormalizedTransaction[]
): TradingMetrics {
  const baseCurrency = transactions[0]?.detectedBaseCurrency || 'USD'

  // Filter to only buy/sell trades (Market and Limit orders)
  const trades = transactions.filter((t) => isTradeAction(t.Action))

  if (trades.length === 0) {
    return {
      totalTransactions: 0,
      buyCount: 0,
      sellCount: 0,
      totalBuyVolume: 0,
      totalSellVolume: 0,
      netCashFlow: 0,
      realizedPnL: 0,
      profitableTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageTransactionSize: 0,
      mostTradedStock: null,
      baseCurrency
    }
  }

  let buyCount = 0
  let sellCount = 0
  let totalBuyVolume = 0
  let totalSellVolume = 0
  let realizedPnL = 0
  let profitableTrades = 0
  let losingTrades = 0
  const stockCounts = new Map<string, { name: string; count: number }>()

  for (const trade of trades) {
    const isBuy = isBuyAction(trade.Action)
    const volume = Math.abs(trade.totalInBaseCurrency || 0)

    if (isBuy) {
      buyCount++
      totalBuyVolume += volume
    } else {
      sellCount++
      totalSellVolume += volume
      
      // Track realized P&L from CSV Result column
      const result = trade.Result || 0
      realizedPnL += result
      
      // Track win/loss statistics
      if (result > 0) {
        profitableTrades++
      } else if (result < 0) {
        losingTrades++
      }
    }

    // Track most traded stock
    if (trade.Ticker) {
      const existing = stockCounts.get(trade.Ticker)
      if (existing) {
        existing.count++
      } else {
        stockCounts.set(trade.Ticker, {
          name: trade.Name || trade.Ticker,
          count: 1
        })
      }
    }
  }

  const totalTransactions = buyCount + sellCount
  const netCashFlow = totalBuyVolume - totalSellVolume
  const winRate = sellCount > 0 ? (profitableTrades / sellCount) * 100 : 0
  const averageTransactionSize = totalTransactions > 0
    ? (totalBuyVolume + totalSellVolume) / totalTransactions
    : 0

  // Find most traded stock
  let mostTradedStock: { ticker: string; name: string; count: number } | null = null
  for (const [ticker, data] of stockCounts.entries()) {
    if (!mostTradedStock || data.count > mostTradedStock.count) {
      mostTradedStock = {
        ticker,
        name: data.name,
        count: data.count
      }
    }
  }

  return {
    totalTransactions,
    buyCount,
    sellCount,
    totalBuyVolume,
    totalSellVolume,
    netCashFlow,
    realizedPnL,
    profitableTrades,
    losingTrades,
    winRate,
    averageTransactionSize,
    mostTradedStock,
    baseCurrency
  }
}

/**
 * Metric card component
 */
function MetricCard({
  label,
  value,
  subValue,
  className,
  valueClassName,
  borderColor,
  rawValue,
  currency
}: {
  label: string
  value: string
  subValue?: string
  className?: string
  valueClassName?: string
  borderColor?: string
  rawValue?: number
  currency?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={cn('relative overflow-hidden transition-all duration-300 border-border/50 hover:border-border hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col', borderColor && `border-l-[3px] ${borderColor}`, className)}>
        <CardContent className="p-5 flex flex-col h-full">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex-shrink-0">{label}</p>
          <p className={cn('text-2xl font-bold tracking-tight text-foreground mt-1 flex-shrink-0', valueClassName)}>
            {rawValue !== undefined && currency ? (
              <AnimatedCurrency amount={rawValue} currency={currency} formatFn={formatCurrency} />
            ) : value}
          </p>
          {subValue ? (
            <p className="text-sm text-muted-foreground mt-1 flex-shrink-0">{subValue}</p>
          ) : (
            <div className="text-sm text-muted-foreground mt-1 flex-shrink-0 h-[20px]">&nbsp;</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface TradingActivityDashboardProps {
  transactions?: NormalizedTransaction[]
  className?: string
}

/**
 * Trading Activity Dashboard Component
 * Shows trading metrics, heatmap, and transaction table
 */
export function TradingActivityDashboard ({
  transactions: transactionsProp,
  className
}: TradingActivityDashboardProps) {
  const storeTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const transactions = transactionsProp ?? storeTransactions
  const allTrades = useMemo(() => {
    return transactions.filter((t) => isTradeAction(t.Action))
  }, [transactions])

  // Extract available years from trades
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    for (const trade of allTrades) {
      const year = getYear(trade.Time)
      if (!isNaN(year)) {
        years.add(year)
      }
    }
    return Array.from(years).sort((a, b) => b - a) // Most recent first
  }, [allTrades])

  // Year filter state (multi-select) - default to all years
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set<number>())

  // Sync selectedYears when availableYears changes - default to all years
  useEffect(() => {
    if (availableYears.length > 0) {
      setSelectedYears((prev) => {
        // If current selection is empty or doesn't include all available years, update to all years
        const hasAllYears = availableYears.every(year => prev.has(year))
        if (prev.size === 0 || !hasAllYears) {
          return new Set(availableYears)
        }
        return prev
      })
    }
  }, [availableYears])

  // Toggle year selection
  const toggleYear = (year: number) => {
    const wasSelected = selectedYears.has(year)
    posthog.capture('trading_year_filter_changed')

    setSelectedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) {
        next.delete(year)
      } else {
        next.add(year)
      }
      // Ensure at least one year is selected - default to all years if all deselected
      if (next.size === 0 && availableYears.length > 0) {
        return new Set(availableYears)
      }
      return next
    })
  }

  // Filter trades by selected years
  const filteredTrades = useMemo(() => {
    if (selectedYears.size === 0) {
      return allTrades
    }
    return allTrades.filter((trade) => {
      const year = getYear(trade.Time)
      return selectedYears.has(year)
    })
  }, [allTrades, selectedYears])

  // Calculate metrics from filtered trades
  const metrics = useMemo(
    () => calculateTradingMetrics(filteredTrades),
    [filteredTrades]
  )

  const hasTrades = allTrades.length > 0

  if (!hasTrades) {
    return (
      <div className={cn('container mx-auto px-6 py-6', className)}>
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">No trading activity found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload transaction data to see trading analytics
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('container mx-auto px-6 py-6 space-y-8', className)}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trading Activity Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive view of all buy and sell transactions
        </p>
      </div>

      {/* Year Filter Pills */}
      {availableYears.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Filter by year:</span>
          {availableYears.map((year) => {
            const isSelected = selectedYears.has(year)
            return (
              <motion.button
                key={year}
                onClick={() => toggleYear(year)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} year ${year}`}
                aria-pressed={isSelected}
              >
                {year}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
        <MetricCard
          label="Total Transactions"
          value={metrics.totalTransactions.toString()}
          borderColor="border-l-blue-500"
        />
        <MetricCard
          label="Buy Transactions"
          value={metrics.buyCount.toString()}
          subValue={formatCurrency(metrics.totalBuyVolume, metrics.baseCurrency)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          borderColor="border-l-emerald-500"
        />
        <MetricCard
          label="Sell Transactions"
          value={metrics.sellCount.toString()}
          subValue={formatCurrency(metrics.totalSellVolume, metrics.baseCurrency)}
          valueClassName="text-red-600 dark:text-red-400"
          borderColor="border-l-red-500"
        />
        <MetricCard
          label="Realized P&L"
          value={`${metrics.realizedPnL >= 0 ? '+' : ''}${formatCurrency(metrics.realizedPnL, metrics.baseCurrency)}`}
          rawValue={metrics.realizedPnL}
          currency={metrics.baseCurrency}
          subValue={`${metrics.profitableTrades}W / ${metrics.losingTrades}L`}
          valueClassName={metrics.realizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          borderColor={metrics.realizedPnL >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}
        />
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subValue={metrics.sellCount > 0 ? `${metrics.profitableTrades} profitable` : 'No sells yet'}
          valueClassName={metrics.winRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          borderColor="border-l-amber-500"
        />
        <MetricCard
          label="Total Buy Volume"
          value={formatCurrency(metrics.totalBuyVolume, metrics.baseCurrency)}
          rawValue={metrics.totalBuyVolume}
          currency={metrics.baseCurrency}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          borderColor="border-l-emerald-500"
        />
        <MetricCard
          label="Total Sell Volume"
          value={formatCurrency(metrics.totalSellVolume, metrics.baseCurrency)}
          rawValue={metrics.totalSellVolume}
          currency={metrics.baseCurrency}
          valueClassName="text-red-600 dark:text-red-400"
          borderColor="border-l-rose-500"
        />
        <MetricCard
          label="Most Traded Stock"
          value={metrics.mostTradedStock ? `${metrics.mostTradedStock.ticker}` : 'N/A'}
          borderColor="border-l-violet-500"
        />
      </div>

      {/* Trading Heatmap */}
      <TradingHeatmap transactions={filteredTrades} />

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Transactions</CardTitle>
          <CardDescription className="text-sm">
            {filteredTrades.length} {filteredTrades.length === 1 ? 'transaction' : 'transactions'}
            {selectedYears.size > 0 && ` in selected ${selectedYears.size === 1 ? 'year' : 'years'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Ticker</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs text-right">Shares</TableHead>
                  <TableHead className="text-xs text-right">Price</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      No transactions found for selected year(s)
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades
                    .sort((a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime())
                    .map((transaction, index) => {
                      const isBuy = isBuyAction(transaction.Action)
                      const actionColor = isBuy
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                      const dateStr = formatDate(transaction.Time)
                      const shares = formatShares(transaction['No. of shares'] || 0)
                      const price = formatCurrency(
                        transaction['Price / share'] || 0,
                        transaction['Currency (Price / share)'] || metrics.baseCurrency
                      )
                      const total = formatCurrency(
                        transaction.totalInBaseCurrency || 0,
                        metrics.baseCurrency
                      )
                      
                      // Show result only for sell transactions
                      const result = transaction.Result
                      const hasResult = !isBuy && result !== null && result !== undefined
                      const resultColor = hasResult && result >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'

                      return (
                        <motion.tr
                          key={transaction.ID || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.01 }}
                        >
                          <TableCell className="text-xs">{dateStr}</TableCell>
                          <TableCell className={cn('text-xs font-medium', actionColor)}>
                            {transaction.Action}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {transaction.Ticker || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {transaction.Name || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-right">{shares}</TableCell>
                          <TableCell className="text-xs text-right">{price}</TableCell>
                          <TableCell className="text-xs text-right font-medium">{total}</TableCell>
                          <TableCell className={cn('text-xs text-right font-medium', hasResult && resultColor)}>
                            {hasResult ? `${result >= 0 ? '+' : ''}${formatCurrency(result, metrics.baseCurrency)}` : '-'}
                          </TableCell>
                        </motion.tr>
                      )
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
