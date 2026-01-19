'use client'

import { useMemo } from 'react'
import groupBy from 'lodash/groupBy'
import posthog from 'posthog-js'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction, StockPosition } from '@/types/trading212'

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
 * Formats a number as currency with 2 decimal places
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
 * Formats shares with 4 decimal places for fractional shares
 */
function formatShares(shares: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(shares)
}

interface PortfolioOverviewProps {
  transactions: NormalizedTransaction[]
  onSelectTicker: (ticker: string) => void
  className?: string
}

/**
 * Aggregates transactions by ticker to calculate stock positions
 * Excludes dividend actions from share and investment calculations
 * Returns both current holdings and sold positions
 */
function aggregatePositions(transactions: NormalizedTransaction[]): StockPosition[] {
  // Filter to only include transactions with tickers (excludes deposits, etc.)
  const stockTransactions = transactions.filter(t => t.Ticker)

  if (stockTransactions.length === 0) {
    return []
  }

  // Group transactions by ticker
  const grouped = groupBy(stockTransactions, 'Ticker')

  // Get base currency from first transaction (all should be normalized to same currency)
  const baseCurrency = stockTransactions[0]?.detectedBaseCurrency || 'USD'

  // Calculate position for each ticker
  const positions: StockPosition[] = Object.entries(grouped).map(([ticker, tickerTransactions]) => {
    let totalShares = 0
    let totalInvested = 0
    let realizedResult = 0
    let name = ''

    for (const transaction of tickerTransactions) {
      // Store the company name (take the most recent non-empty name)
      if (transaction.Name) {
        name = transaction.Name
      }

      // Skip dividend actions for share and investment calculations
      if (transaction.Action.toLowerCase().includes('dividend')) {
        continue
      }

      const shares = transaction['No. of shares'] || 0
      const amount = transaction.totalInBaseCurrency || 0

      if (transaction.Action === 'Market buy') {
        totalShares += shares
        totalInvested += Math.abs(amount)
      } else if (transaction.Action === 'Market sell') {
        totalShares -= shares
        totalInvested -= Math.abs(amount)
        // Track realized gains/losses from sell transactions
        realizedResult += transaction.Result || 0
      }
    }

    // Determine if this is a current holding or sold position
    const status = totalShares > 0 ? 'holding' : 'sold'

    return {
      ticker,
      name: name || ticker,
      totalShares,
      totalInvested,
      baseCurrency,
      status,
      realizedResult
    }
  })

  // Sort by total invested descending (absolute value for sold positions)
  return positions.sort((a, b) => {
    // Holdings first, then sold positions
    if (a.status !== b.status) {
      return a.status === 'holding' ? -1 : 1
    }
    return Math.abs(b.totalInvested) - Math.abs(a.totalInvested)
  })
}

/**
 * Individual stock position tile component for current holdings
 */
function StockPositionTile({
  position,
  onClick
}: {
  position: StockPosition
  onClick: () => void
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 group',
        'hover:shadow-md hover:-translate-y-0.5',
        'hover:border-primary/50 hover:bg-primary/5',
        'active:scale-[0.99]',
        'h-full flex flex-col',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${position.ticker} - ${position.name}`}
    >
      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {position.ticker}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {position.name}
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-200 flex-shrink-0" />
        </div>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Shares</span>
            <span className="text-xs font-medium text-foreground">
              {formatShares(position.totalShares)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Invested</span>
            <span className={cn(
              'text-xs font-medium',
              position.totalInvested >= 0 ? 'text-foreground' : 'text-destructive'
            )}>
              {formatCurrency(position.totalInvested, position.baseCurrency)}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Click to view details
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual sold position tile component
 * Shows realized gains/losses instead of current investment
 */
function SoldPositionTile({
  position,
  onClick
}: {
  position: StockPosition
  onClick: () => void
}) {
  const isProfit = position.realizedResult >= 0

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 group',
        'hover:shadow-md hover:-translate-y-0.5',
        'hover:border-primary/50 hover:bg-primary/5',
        'active:scale-[0.99]',
        'bg-muted/30',
        'h-full flex flex-col',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View transaction history for ${position.ticker} - ${position.name}`}
    >
      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-muted-foreground truncate group-hover:text-primary transition-colors">
              {position.ticker}
            </h3>
            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
              {position.name}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              Sold
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-200" />
          </div>
        </div>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Result</span>
            <span className={cn(
              'text-xs font-medium',
              isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}>
              {isProfit ? '+' : ''}{formatCurrency(position.realizedResult, position.baseCurrency)}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Click to view details
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state component when no stocks are found
 */
function EmptyState() {
  return (
    <Card className="p-8 text-center border-dashed">
      <p className="text-sm text-muted-foreground">No stocks found</p>
      <p className="text-xs text-muted-foreground mt-1">
        Upload a CSV file to see your portfolio
      </p>
    </Card>
  )
}

/**
 * Portfolio Overview Component
 * Displays aggregated stock positions as a responsive grid of clickable tiles
 * Shows both current holdings and sold positions in separate sections
 */
export function PortfolioOverview({
  transactions,
  onSelectTicker,
  className
}: PortfolioOverviewProps) {
  // Memoize position calculations to avoid recalculating on every render
  const positions = useMemo(
    () => aggregatePositions(transactions),
    [transactions]
  )

  // Split positions into current holdings and sold positions
  const currentHoldings = useMemo(
    () => positions.filter(p => p.status === 'holding'),
    [positions]
  )

  const soldPositions = useMemo(
    () => positions.filter(p => p.status === 'sold'),
    [positions]
  )

  // Calculate total realized result for sold positions
  const totalRealizedResult = useMemo(
    () => soldPositions.reduce((sum, p) => sum + p.realizedResult, 0),
    [soldPositions]
  )

  // Handle empty state
  if (positions.length === 0) {
    return <EmptyState />
  }

  const baseCurrency = positions[0]?.baseCurrency || 'USD'

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Holdings Section */}
      {currentHoldings.length > 0 && (
        <section className="space-y-3" aria-labelledby="portfolio-heading">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="portfolio-heading" className="text-sm font-semibold text-foreground">
                Your Portfolio
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any tile to view detailed analytics
              </p>
            </div>
            <span className="text-xs text-muted-foreground" aria-label={`${currentHoldings.length} ${currentHoldings.length === 1 ? 'stock' : 'stocks'} in portfolio`}>
              {currentHoldings.length} {currentHoldings.length === 1 ? 'stock' : 'stocks'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" role="list" aria-label="Current stock holdings">
            {currentHoldings.map(position => (
              <div key={position.ticker} role="listitem">
                <StockPositionTile
                  position={position}
                  onClick={() => {
                    posthog.capture('stock_selected_holding')
                    onSelectTicker(position.ticker)
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sold Positions Section */}
      {soldPositions.length > 0 && (
        <section className="space-y-3" aria-labelledby="sold-positions-heading">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="sold-positions-heading" className="text-sm font-medium text-muted-foreground">
                Sold Positions
              </h2>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Click any tile to view transaction history
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground" aria-label={`${soldPositions.length} ${soldPositions.length === 1 ? 'stock' : 'stocks'} sold`}>
                {soldPositions.length} {soldPositions.length === 1 ? 'stock' : 'stocks'}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  totalRealizedResult >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}
                aria-label={`Total realized ${totalRealizedResult >= 0 ? 'profit' : 'loss'}: ${totalRealizedResult >= 0 ? '+' : ''}${formatCurrency(totalRealizedResult, baseCurrency)}`}
              >
                Total: {totalRealizedResult >= 0 ? '+' : ''}{formatCurrency(totalRealizedResult, baseCurrency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" role="list" aria-label="Sold stock positions">
            {soldPositions.map(position => (
              <div key={position.ticker} role="listitem">
                <SoldPositionTile
                  position={position}
                  onClick={() => {
                    posthog.capture('stock_selected_sold')
                    onSelectTicker(position.ticker)
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Edge case: Only sold positions, no current holdings */}
      {currentHoldings.length === 0 && soldPositions.length > 0 && (
        <div className="text-center py-3 text-xs text-muted-foreground">
          No current holdings. All positions shown above have been sold.
        </div>
      )}
    </div>
  )
}
