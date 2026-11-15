'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import posthog from 'posthog-js'
import { AnimatedCurrency, AnimatedCount } from '@/components/ui/animated-number'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { TradingHeatmap } from '@/components/ui/trading-heatmap'
import { TradingStatsBento } from '@/components/features/trading-stats-bento'
import { Pagination } from '@/components/ui/pagination'
import { isTradeAction, isBuyAction } from '@/lib/transaction-utils'
import { BlurReveal } from '@/components/motion/blur-reveal'
import { MetricCell, MetricGrid } from '@/components/features/metric-cell'
import {
  EmptyCell,
  SectionHeader,
  StatusMark,
  TableFrame,
  TableFooterBar,
  ViewHeader
} from '@/components/features/analysis-kit'

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
 * Signed currency for realized results: "+€12.00" / "-€3.40"
 */
function formatSignedCurrency(amount: number, currency: string): string {
  return `${amount >= 0 ? '+' : ''}${formatCurrency(amount, currency)}`
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
    posthog.capture('trading_year_filter_changed', {
      action: wasSelected ? 'deselected' : 'selected',
      year,
    })

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

  // Pagination state
  const ITEMS_PER_PAGE = 50
  const [currentPage, setCurrentPage] = useState(1)

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

  // Reset to page 1 when the year filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedYears])

  // Memoized sort — avoids re-sorting on every render and prevents array mutation
  const sortedTrades = useMemo(
    () => [...filteredTrades].sort(
      (a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime()
    ),
    [filteredTrades]
  )

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTrades = sortedTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const pageEnd = Math.min(startIndex + ITEMS_PER_PAGE, sortedTrades.length)

  // Calculate metrics from filtered trades
  const metrics = useMemo(
    () => calculateTradingMetrics(filteredTrades),
    [filteredTrades]
  )

  const hasTrades = allTrades.length > 0

  if (!hasTrades) {
    return (
      <div className={cn('min-w-0', className)}>
        <ViewHeader title="Trading activity" description="All buy and sell transactions" />
        <EmptyCell
          title="No trading activity found"
          description="Upload transaction data to see trading analytics"
        />
      </div>
    )
  }

  const breakEven = metrics.sellCount - metrics.profitableTrades - metrics.losingTrades
  const winLossLabel = `${metrics.profitableTrades}W / ${metrics.losingTrades}L`
  const allYearsSelected = availableYears.every((year) => selectedYears.has(year))

  return (
    <div className={cn('min-w-0', className)}>
      <BlurReveal immediate>
        <ViewHeader
          title="Trading activity"
          description="All buy and sell transactions in your history"
          aside={
            availableYears.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by year">
                {availableYears.map((year) => {
                  const isSelected = selectedYears.has(year)
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => toggleYear(year)}
                      className={cn(
                        'tabular inline-flex h-[38px] items-center rounded-full border px-3 text-p-sm',
                        'transition-[color,background-color,border-color] duration-200 ease-in-out active:scale-[0.97]',
                        isSelected
                          ? 'border-foreground bg-foreground text-black'
                          : 'border-border text-foreground hover:border-border-hover hover:bg-white/5'
                      )}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} year ${year}`}
                      aria-pressed={isSelected}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>
            ) : null
          }
        />
      </BlurReveal>

      <div className="space-y-10 md:space-y-12">
        {/* Summary metrics */}
        <BlurReveal immediate delay={0.1}>
          <MetricGrid columns={4}>
            <MetricCell
              label="Total transactions"
              value={<AnimatedCount value={metrics.totalTransactions} />}
              sub={allYearsSelected ? 'All years' : `In ${selectedYears.size === 1 ? 'selected year' : 'selected years'}`}
            />
            <MetricCell
              label="Buy transactions"
              value={<AnimatedCount value={metrics.buyCount} />}
              sub={formatCurrency(metrics.totalBuyVolume, metrics.baseCurrency)}
              aside={<StatusMark tone="positive" />}
            />
            <MetricCell
              label="Sell transactions"
              value={<AnimatedCount value={metrics.sellCount} />}
              sub={formatCurrency(metrics.totalSellVolume, metrics.baseCurrency)}
              aside={<StatusMark tone="negative" />}
            />
            <MetricCell
              label="Realized P&L"
              value={<AnimatedCurrency amount={metrics.realizedPnL} currency={metrics.baseCurrency} formatFn={formatSignedCurrency} />}
              tone={metrics.realizedPnL > 0 ? 'positive' : metrics.realizedPnL < 0 ? 'negative' : 'default'}
              sub={winLossLabel}
            />
            <MetricCell
              label="Win rate"
              value={`${metrics.winRate.toFixed(1)}%`}
              sub={metrics.sellCount > 0
                ? `${winLossLabel}${breakEven > 0 ? ` / ${breakEven} even` : ''}`
                : 'No sells yet'}
            />
            <MetricCell
              label="Total buy volume"
              value={<AnimatedCurrency amount={metrics.totalBuyVolume} currency={metrics.baseCurrency} formatFn={formatCurrency} />}
              sub={`Across ${metrics.buyCount} ${metrics.buyCount === 1 ? 'buy' : 'buys'}`}
            />
            <MetricCell
              label="Total sell volume"
              value={<AnimatedCurrency amount={metrics.totalSellVolume} currency={metrics.baseCurrency} formatFn={formatCurrency} />}
              sub={`Across ${metrics.sellCount} ${metrics.sellCount === 1 ? 'sell' : 'sells'}`}
            />
            <MetricCell
              label="Most traded stock"
              value={metrics.mostTradedStock ? metrics.mostTradedStock.ticker : 'N/A'}
              sub={metrics.mostTradedStock ? (
                <span className="block truncate">
                  {metrics.mostTradedStock.count} trades · {metrics.mostTradedStock.name}
                </span>
              ) : 'No trades yet'}
            />
          </MetricGrid>
        </BlurReveal>

        {/* Trading heatmap */}
        <BlurReveal soft>
          <TradingHeatmap transactions={filteredTrades} />
        </BlurReveal>

        {/* All-time trading stats */}
        <TradingStatsBento transactions={storeTransactions} />

        {/* Transactions table */}
        <section aria-labelledby="all-transactions-heading">
          <SectionHeader
            id="all-transactions-heading"
            title="All transactions"
            meta={`${sortedTrades.length} ${sortedTrades.length === 1 ? 'transaction' : 'transactions'}${selectedYears.size > 0 ? ` in selected ${selectedYears.size === 1 ? 'year' : 'years'}` : ''}`}
          />
          <BlurReveal soft>
            <TableFrame>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">Date</TableHead>
                    <TableHead scope="col">Action</TableHead>
                    <TableHead scope="col">Ticker</TableHead>
                    <TableHead scope="col" className="hidden sm:table-cell">Name</TableHead>
                    <TableHead scope="col" className="text-right">Shares</TableHead>
                    <TableHead scope="col" className="text-right">Price</TableHead>
                    <TableHead scope="col" className="text-right">Total</TableHead>
                    <TableHead scope="col" className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <motion.tbody
                  key={currentPage}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="[&_tr:last-child]:border-0"
                >
                  {paginatedTrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-p-sm text-fg-secondary">
                        No transactions found for selected year(s)
                      </td>
                    </tr>
                  ) : (
                    paginatedTrades.map((transaction) => {
                      const isBuy = isBuyAction(transaction.Action)
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
                      const resultTone = hasResult && result > 0
                        ? 'text-positive'
                        : hasResult && result < 0
                          ? 'text-negative'
                          : 'text-fg-secondary'

                      return (
                        <TableRow key={transaction.ID || `${transaction.Time}-${transaction.Ticker}`}>
                          <TableCell className="whitespace-nowrap text-fg-secondary">{dateStr}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <StatusMark tone={isBuy ? 'positive' : 'negative'} />
                              {transaction.Action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {transaction.Ticker || '-'}
                          </TableCell>
                          <TableCell className="hidden max-w-[220px] truncate normal-nums text-fg-secondary sm:table-cell">
                            {transaction.Name || '-'}
                          </TableCell>
                          <TableCell className="text-right text-foreground">{shares}</TableCell>
                          <TableCell className="whitespace-nowrap text-right text-fg-secondary">{price}</TableCell>
                          <TableCell className="whitespace-nowrap text-right text-foreground">{total}</TableCell>
                          <TableCell className={cn('whitespace-nowrap text-right', resultTone)}>
                            {hasResult ? formatSignedCurrency(result, metrics.baseCurrency) : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </motion.tbody>
              </Table>

              {totalPages > 1 && (
                <TableFooterBar start={startIndex + 1} end={pageEnd} total={sortedTrades.length}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </TableFooterBar>
              )}
            </TableFrame>
          </BlurReveal>
        </section>
      </div>
    </div>
  )
}
