'use client'

import { useMemo } from 'react'
import groupBy from 'lodash/groupBy'
import posthog from 'posthog-js'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction, StockPosition } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { isTickerPartialData } from '@/lib/partial-data-detector'
import { isBuyAction, isSellAction, isDividendAction } from '@/lib/transaction-utils'

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
  transactions?: NormalizedTransaction[]
  onSelectTicker?: (ticker: string) => void
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
    let netCashFlow = 0
    let realizedResult = 0
    let name = ''

    for (const transaction of tickerTransactions) {
      // Store the company name (take the most recent non-empty name)
      if (transaction.Name) {
        name = transaction.Name
      }

      // Skip dividend actions for share and investment calculations
      if (isDividendAction(transaction.Action)) {
        continue
      }

      const shares = transaction['No. of shares'] || 0
      const amount = transaction.totalInBaseCurrency || 0

      if (isBuyAction(transaction.Action)) {
        totalShares += shares
        // Net cash flow: money going out (positive for buys)
        netCashFlow += Math.abs(amount)
      } else if (isSellAction(transaction.Action)) {
        totalShares -= shares
        // Net cash flow: money coming in (subtract from deployed cash)
        netCashFlow -= Math.abs(amount)
        // Track realized gains/losses from CSV Result column (no manual calculation)
        realizedResult += transaction.Result || 0
      }
    }

    // Determine if this is a current holding or sold position
    // Use epsilon to guard against floating point drift from many fractional share transactions
    const status = totalShares > 0.0001 ? 'holding' : 'sold'

    return {
      ticker,
      name: name || ticker,
      totalShares,
      netCashFlow, // Net cash flow: can be negative if you took out more than you put in
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
    return Math.abs(b.netCashFlow) - Math.abs(a.netCashFlow)
  })
}

/** Shared tile chrome: a hairline cell that lightens on hover and shows an arrow */
const tileClass = cn(
  'group relative flex h-full cursor-pointer flex-col gap-4 bg-background p-4 md:gap-6 md:p-5',
  'transition-[background-color] duration-150 ease-out hover:bg-white/[0.03]',
  'focus-visible:bg-white/[0.03] focus-visible:outline-offset-[-2px]'
)

function TileArrow() {
  return (
    <ArrowUpRight
      className="absolute right-4 top-4 h-4 w-4 text-fg-secondary opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 md:right-5 md:top-5"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  )
}

function TileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-label text-fg-secondary">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5">{children}</dd>
    </div>
  )
}

function activateOnKey(onClick: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }
}

/**
 * Individual stock position tile component for current holdings
 */
function StockPositionTile({
  position,
  onClick,
  isPartialData
}: {
  position: StockPosition
  onClick: () => void
  isPartialData: boolean
}) {
  const isNetSelling = position.totalShares < 0
  const hasNegativeInvested = position.netCashFlow < 0

  return (
    <div
      className={tileClass}
      onClick={onClick}
      onKeyDown={activateOnKey(onClick)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${position.ticker} - ${position.name}`}
    >
      <TileArrow />
      <div className="min-w-0 pr-6">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-p font-medium text-foreground">
            {position.ticker}
          </h3>
          {isPartialData && (
            <Badge variant="warning" aria-label="Partial data">
              Partial
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-p-sm text-fg-secondary">
          {position.name}
        </p>
      </div>

      <dl className="mt-auto space-y-2">
        <TileRow label={isNetSelling ? 'Net flow' : 'Shares'}>
          {isNetSelling && <Badge variant="destructive">Selling</Badge>}
          <span className={cn('tabular text-p-sm', isNetSelling ? 'text-negative' : 'text-foreground')}>
            {formatShares(position.totalShares)}
          </span>
        </TileRow>
        <TileRow label={hasNegativeInvested ? 'Net cash' : 'Net invested'}>
          <span className={cn('tabular text-p-sm', hasNegativeInvested ? 'text-positive' : 'text-foreground')}>
            {formatCurrency(position.netCashFlow, position.baseCurrency)}
          </span>
        </TileRow>
      </dl>
    </div>
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
    <div
      className={tileClass}
      onClick={onClick}
      onKeyDown={activateOnKey(onClick)}
      role="button"
      tabIndex={0}
      aria-label={`View transaction history for ${position.ticker} - ${position.name}`}
    >
      <TileArrow />
      <div className="min-w-0 pr-6">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-p font-medium text-foreground">
            {position.ticker}
          </h3>
          <Badge variant="secondary">Sold</Badge>
        </div>
        <p className="mt-0.5 truncate text-p-sm text-fg-secondary">
          {position.name}
        </p>
      </div>

      <dl className="mt-auto space-y-2">
        <TileRow label="Result">
          <span className={cn('tabular text-p-sm', isProfit ? 'text-positive' : 'text-negative')}>
            {isProfit ? '+' : ''}{formatCurrency(position.realizedResult, position.baseCurrency)}
          </span>
        </TileRow>
      </dl>
    </div>
  )
}

/**
 * Empty state component when no stocks are found
 */
function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <p className="text-p-sm text-foreground">No stocks found</p>
      <p className="mt-1 text-p-sm text-fg-secondary">
        Upload a CSV file to see your portfolio
      </p>
    </div>
  )
}

// Cells share hairlines (each cell is bordered and pulled 1px over its
// neighbours), so a partly filled last row draws no line over empty slots.
const TILE_GRID = cn(
  'grid grid-cols-1 pl-px pt-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  '[&>*]:-ml-px [&>*]:-mt-px [&>*]:min-w-0 [&>*]:border [&>*]:border-border'
)

/**
 * Portfolio Overview Component
 * Displays aggregated stock positions as a responsive grid of clickable tiles
 * Shows both current holdings and sold positions in separate sections
 */
export function PortfolioOverview ({
  transactions: transactionsProp,
  onSelectTicker: onSelectTickerProp,
  className
}: PortfolioOverviewProps) {
  const storeTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const storeSetSelectedTicker = useDashboardStore((state) => state.setSelectedTicker)
  const partialDataWarning = useDashboardStore((state) => state.partialDataWarning)
  const transactions = transactionsProp ?? storeTransactions
  const onSelectTicker = onSelectTickerProp ?? storeSetSelectedTicker

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
    <div className={cn('space-y-12', className)}>
      {/* Current Holdings Section */}
      {currentHoldings.length > 0 && (
        <section aria-labelledby="portfolio-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="portfolio-heading" className="text-h5 text-foreground">
              Current holdings
            </h2>
            <span className="tabular text-p-sm text-fg-secondary" aria-label={`${currentHoldings.length} ${currentHoldings.length === 1 ? 'stock' : 'stocks'} in portfolio`}>
              {currentHoldings.length} {currentHoldings.length === 1 ? 'stock' : 'stocks'}
            </span>
          </div>

          <div className={TILE_GRID} role="list" aria-label="Current stock holdings">
            {currentHoldings.map(position => {
              const isPartialData = partialDataWarning
                ? isTickerPartialData(position.ticker, partialDataWarning)
                : false

              return (
                <div key={position.ticker} role="listitem">
                  <StockPositionTile
                    position={position}
                    isPartialData={isPartialData}
                    onClick={() => {
                      posthog.capture('stock_selected', { source: 'holding' })
                      onSelectTicker(position.ticker)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Sold Positions Section */}
      {soldPositions.length > 0 && (
        <section aria-labelledby="sold-positions-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h2 id="sold-positions-heading" className="text-h5 text-foreground">
              Closed positions
            </h2>
            <div className="flex items-center gap-3 whitespace-nowrap text-p-sm">
              <span className="tabular text-fg-secondary" aria-label={`${soldPositions.length} ${soldPositions.length === 1 ? 'stock' : 'stocks'} sold`}>
                {soldPositions.length} {soldPositions.length === 1 ? 'stock' : 'stocks'}
              </span>
              <span className="h-3 w-px bg-border" aria-hidden="true" />
              <span
                className="tabular text-fg-secondary"
                aria-label={`Total realized ${totalRealizedResult >= 0 ? 'profit' : 'loss'}: ${totalRealizedResult >= 0 ? '+' : ''}${formatCurrency(totalRealizedResult, baseCurrency)}`}
              >
                Total{' '}
                <span className={totalRealizedResult >= 0 ? 'text-positive' : 'text-negative'}>
                  {totalRealizedResult >= 0 ? '+' : ''}{formatCurrency(totalRealizedResult, baseCurrency)}
                </span>
              </span>
            </div>
          </div>

          <div className={TILE_GRID} role="list" aria-label="Sold stock positions">
            {soldPositions.map(position => (
              <div key={position.ticker} role="listitem">
                <SoldPositionTile
                  position={position}
                  onClick={() => {
                    posthog.capture('stock_selected', { source: 'sold' })
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
        <p className="text-center text-label text-fg-secondary">
          No current holdings. All positions shown above have been sold.
        </p>
      )}
    </div>
  )
}
