'use client'

import { useMemo } from 'react'
import groupBy from 'lodash/groupBy'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction, StockPosition } from '@/types/trading212'

/**
 * Currency symbols for common currencies
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$'
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
    const status = totalShares > 0.0001 ? 'holding' : 'sold'

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
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        'active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {position.ticker}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {position.name}
            </p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Shares</span>
            <span className="text-sm font-medium text-foreground">
              {formatShares(position.totalShares)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Invested</span>
            <span className={cn(
              'text-sm font-medium',
              position.totalInvested >= 0 ? 'text-foreground' : 'text-destructive'
            )}>
              {formatCurrency(position.totalInvested, position.baseCurrency)}
            </span>
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
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        'active:scale-[0.98]',
        'bg-muted/30'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-muted-foreground truncate">
              {position.ticker}
            </h3>
            <p className="text-sm text-muted-foreground/70 truncate">
              {position.name}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            Sold
          </span>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Result</span>
            <span className={cn(
              'text-sm font-medium',
              isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {isProfit ? '+' : ''}{formatCurrency(position.realizedResult, position.baseCurrency)}
            </span>
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
    <Card className="p-12 text-center">
      <p className="text-muted-foreground">No stocks found</p>
      <p className="text-sm text-muted-foreground mt-2">
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
    <div className={cn('space-y-8', className)}>
      {/* Current Holdings Section */}
      {currentHoldings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Your Portfolio
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentHoldings.length} {currentHoldings.length === 1 ? 'stock' : 'stocks'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentHoldings.map(position => (
              <StockPositionTile
                key={position.ticker}
                position={position}
                onClick={() => onSelectTicker(position.ticker)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sold Positions Section */}
      {soldPositions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-muted-foreground">
              Sold Positions
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {soldPositions.length} {soldPositions.length === 1 ? 'stock' : 'stocks'}
              </span>
              <span className={cn(
                'text-sm font-medium',
                totalRealizedResult >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              )}>
                Total: {totalRealizedResult >= 0 ? '+' : ''}{formatCurrency(totalRealizedResult, baseCurrency)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {soldPositions.map(position => (
              <SoldPositionTile
                key={position.ticker}
                position={position}
                onClick={() => onSelectTicker(position.ticker)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edge case: Only sold positions, no current holdings */}
      {currentHoldings.length === 0 && soldPositions.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No current holdings. All positions shown above have been sold.
        </div>
      )}
    </div>
  )
}

