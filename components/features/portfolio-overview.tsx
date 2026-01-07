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
      }
    }

    return {
      ticker,
      name: name || ticker,
      totalShares,
      totalInvested,
      baseCurrency
    }
  })

  // Filter out positions with zero or negative shares (fully sold)
  // and sort by total invested descending
  return positions
    .filter(p => p.totalShares > 0)
    .sort((a, b) => b.totalInvested - a.totalInvested)
}

/**
 * Individual stock position tile component
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

  // Handle empty state
  if (positions.length === 0) {
    return <EmptyState />
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Your Portfolio
        </h2>
        <span className="text-sm text-muted-foreground">
          {positions.length} {positions.length === 1 ? 'stock' : 'stocks'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map(position => (
          <StockPositionTile
            key={position.ticker}
            position={position}
            onClick={() => onSelectTicker(position.ticker)}
          />
        ))}
      </div>
    </div>
  )
}

