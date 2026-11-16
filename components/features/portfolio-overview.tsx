'use client'

import { useMemo, useState } from 'react'
import groupBy from 'lodash/groupBy'
import posthog from 'posthog-js'
import { Tile } from '@/components/ui/tile'
import { badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BarRows, ChartCard, Donut, Legend, foldSeries, isOther, seriesAt, type BarRow, type Segment } from '@/components/charts'
import { AutoHeight } from '@/components/motion'
import { ChartBar, ChartPie, ChevronRight, Folder } from '@/components/icons'
import { Region, chartGrid } from '@/components/features/dashboard-layout'
import { METRIC_EXPLANATIONS } from '@/components/features/metric-tooltip'
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

/** Signed amount: gains get a +, losses keep their -. */
function formatSigned(amount: number, currency: string): string {
  return `${amount >= 0 ? '+' : ''}${formatCurrency(amount, currency)}`
}

const holdingsGrid = 'grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'

/** One label and figure. The figure never wraps; on a very narrow tile it drops under its label. */
function FigureRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
      <span className="text-xs font-normal text-muted-foreground">{label}</span>
      <span className={cn('figure ms-auto whitespace-nowrap text-sm font-medium', className)}>{value}</span>
    </span>
  )
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
    <Tile asChild interactive>
      <button
        type="button"
        onClick={onClick}
        className="group flex h-full w-full flex-col gap-4"
        aria-label={`View details for ${position.ticker} - ${position.name}${isPartialData ? ' (partial data)' : ''}`}
      >
        <span className="flex w-full items-start gap-2">
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="ticker truncate text-base text-foreground">{position.ticker}</span>
              {isPartialData && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(badgeVariants({ variant: 'warning' }), 'h-5 px-2 font-normal')}>Partial</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">{METRIC_EXPLANATIONS.partialData}</TooltipContent>
                </Tooltip>
              )}
            </span>
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">{position.name}</span>
          </span>
          <ChevronRight
            size={16}
            className="mt-1 shrink-0 text-muted-foreground transition-colors duration-150 ease-ui group-hover:text-foreground motion-safe:transition-[color,transform] motion-safe:group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>

        <span className="mt-auto flex w-full flex-col gap-1">
          <FigureRow
            label={isNetSelling ? 'Net flow' : 'Shares'}
            value={formatShares(position.totalShares)}
            className={isNetSelling ? 'text-down' : undefined}
          />
          <FigureRow
            label={hasNegativeInvested ? 'Net cash' : 'Net invested'}
            value={formatCurrency(position.netCashFlow, position.baseCurrency)}
          />
        </span>
      </button>
    </Tile>
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
    <Tile asChild interactive>
      <button
        type="button"
        onClick={onClick}
        className="group flex h-full w-full flex-col gap-4"
        aria-label={`View transaction history for ${position.ticker} - ${position.name}`}
      >
        <span className="flex w-full items-start gap-2">
          <span className="min-w-0 flex-1">
            <span className="ticker block truncate text-base text-muted-foreground">{position.ticker}</span>
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">{position.name}</span>
          </span>
          <ChevronRight
            size={16}
            className="mt-1 shrink-0 text-muted-foreground transition-colors duration-150 ease-ui group-hover:text-foreground motion-safe:transition-[color,transform] motion-safe:group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
        <span className="mt-auto flex w-full flex-col gap-1">
          <FigureRow
            label="Result"
            value={formatSigned(position.realizedResult, position.baseCurrency)}
            className={isProfit ? 'text-up' : 'text-down'}
          />
        </span>
      </button>
    </Tile>
  )
}

/** Quiet empty state inside a chart card, the same height as the chart it stands in for. */
function ChartEmptyState({ icon: Icon, title, detail }: { icon: React.ElementType; title: string; detail: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl bg-background px-6 py-8 text-center">
      <Icon size={20} className="text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

/** Net invested per current holding: the top five and everything else as "Other". */
function AllocationChart({ holdings, baseCurrency }: { holdings: StockPosition[]; baseCurrency: string }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const { segments, total } = useMemo(() => {
    const items = holdings
      .filter((p) => p.netCashFlow > 0)
      .map((p) => ({ id: p.ticker, label: p.ticker, value: p.netCashFlow }))
    const folded = foldSeries(items, 6)
    const segments: Segment[] = folded.map((item, i) => ({
      id: item.id,
      label: isOther(item) ? `Other (${item.members.length})` : item.label,
      value: item.value,
      display: formatCurrency(item.value, baseCurrency),
      color: seriesAt(i)
    }))
    const total = items.reduce((sum, item) => sum + item.value, 0)
    return { segments, total }
  }, [holdings, baseCurrency])

  return (
    <ChartCard
      title="Allocation by holding"
      color={1}
      footnote="Net invested: what you paid for a holding minus what you sold of it."
    >
      {segments.length === 0 ? (
        <ChartEmptyState
          icon={ChartPie}
          title="Nothing invested right now"
          detail="Allocation appears here while you hold shares you paid for in this export."
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-6 py-2 min-[440px]:flex-row min-[440px]:justify-start lg:flex-col lg:justify-center xl:flex-row xl:justify-start">
          <Donut
            segments={segments}
            aria-label="Allocation of net invested by holding"
            size={168}
            thickness={16}
            activeId={activeId}
            onActiveChange={setActiveId}
          >
            <span className="flex flex-col items-center px-4 text-center">
              <span className="text-xs font-normal text-muted-foreground">Net invested</span>
              <span className="figure mt-0.5 whitespace-nowrap text-base font-semibold tracking-[-0.01em]">
                {formatCurrency(total, baseCurrency)}
              </span>
            </span>
          </Donut>
          <Legend
            className="w-full min-w-0 flex-1 flex-col gap-y-2.5"
            items={segments.map((s) => ({ id: s.id, label: s.label, color: s.color, value: s.display }))}
            activeId={activeId}
            onActiveChange={setActiveId}
          />
        </div>
      )}
    </ChartCard>
  )
}

/** Realised profit or loss per stock, largest results first. */
function RealisedChart({ positions, baseCurrency }: { positions: StockPosition[]; baseCurrency: string }) {
  const rows: BarRow[] = useMemo(
    () =>
      positions
        .filter((p) => Math.abs(p.realizedResult) > 0.004)
        .sort((a, b) => Math.abs(b.realizedResult) - Math.abs(a.realizedResult))
        .map((p) => ({
          id: p.ticker,
          label: p.ticker,
          note: p.name,
          value: p.realizedResult,
          display: formatSigned(p.realizedResult, baseCurrency)
        })),
    [positions, baseCurrency]
  )

  return (
    <ChartCard
      title="Realised profit by stock"
      footnote="From the Result column of every sale in your export."
    >
      {rows.length === 0 ? (
        <ChartEmptyState
          icon={ChartBar}
          title="No sales yet"
          detail="Realised profit shows up here once you sell shares."
        />
      ) : (
        <BarRows
          rows={rows}
          color={1}
          signed
          emphasis="none"
          labelWidth={120}
          maxRows={8}
          aria-label="Realised profit or loss by stock"
        />
      )}
    </ChartCard>
  )
}

const CLOSED_PREVIEW = 8

/**
 * Empty state component when no stocks are found
 */
function EmptyState() {
  return (
    <Tile className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Folder size={20} className="text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">No stocks found</p>
      <p className="text-sm text-muted-foreground">
        Upload a CSV file to see your portfolio
      </p>
    </Tile>
  )
}

/**
 * Portfolio Overview Component
 * Allocation and realised profit charts, then the current holdings and the
 * closed positions as grids of tiles that open each stock.
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
  const [showAllClosed, setShowAllClosed] = useState(false)

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
  const visibleClosed = showAllClosed ? soldPositions : soldPositions.slice(0, CLOSED_PREVIEW)
  const totalSign = totalRealizedResult >= 0 ? '+' : ''

  return (
    <TooltipProvider delayDuration={200}>
      <div className={className}>
        <Region label="Where your money is" id="portfolio-allocation-heading">
          <div className={chartGrid}>
            <AllocationChart holdings={currentHoldings} baseCurrency={baseCurrency} />
            <RealisedChart positions={positions} baseCurrency={baseCurrency} />
          </div>
        </Region>

        {/* Current Holdings Section */}
        {currentHoldings.length > 0 && (
          <Region
            label="Current holdings"
            id="portfolio-heading"
            action={
              <span className="figure" aria-label={`${currentHoldings.length} ${currentHoldings.length === 1 ? 'stock' : 'stocks'} in portfolio`}>
                {currentHoldings.length} {currentHoldings.length === 1 ? 'stock' : 'stocks'}
              </span>
            }
          >
            <ul className={holdingsGrid} aria-label="Current stock holdings">
              {currentHoldings.map(position => {
                const isPartialData = partialDataWarning
                  ? isTickerPartialData(position.ticker, partialDataWarning)
                  : false

                return (
                  <li key={position.ticker} className="min-w-0">
                    <StockPositionTile
                      position={position}
                      isPartialData={isPartialData}
                      onClick={() => {
                        posthog.capture('stock_selected', { source: 'holding' })
                        onSelectTicker(position.ticker)
                      }}
                    />
                  </li>
                )
              })}
            </ul>
          </Region>
        )}

        {/* Sold Positions Section */}
        {soldPositions.length > 0 && (
          <Region
            label="Closed positions"
            id="sold-positions-heading"
            action={
              <span className="flex items-center gap-3">
                <span className="figure" aria-label={`${soldPositions.length} ${soldPositions.length === 1 ? 'stock' : 'stocks'} sold`}>
                  {soldPositions.length} {soldPositions.length === 1 ? 'stock' : 'stocks'}
                </span>
                <span
                  className={cn('figure whitespace-nowrap font-medium', totalRealizedResult >= 0 ? 'text-up' : 'text-down')}
                  aria-label={`Total realized ${totalRealizedResult >= 0 ? 'profit' : 'loss'}: ${totalSign}${formatCurrency(totalRealizedResult, baseCurrency)}`}
                >
                  Total {totalSign}{formatCurrency(totalRealizedResult, baseCurrency)}
                </span>
              </span>
            }
          >
            <AutoHeight>
              <ul className={holdingsGrid} aria-label="Sold stock positions">
                {visibleClosed.map(position => (
                  <li key={position.ticker} className="min-w-0">
                    <SoldPositionTile
                      position={position}
                      onClick={() => {
                        posthog.capture('stock_selected', { source: 'sold' })
                        onSelectTicker(position.ticker)
                      }}
                    />
                  </li>
                ))}
              </ul>
            </AutoHeight>
            {soldPositions.length > CLOSED_PREVIEW && (
              <Button
                variant="ghost"
                size="sm"
                className="-ms-3 mt-2"
                aria-expanded={showAllClosed}
                onClick={() => setShowAllClosed((value) => !value)}
              >
                {showAllClosed ? 'Show fewer' : `Show all closed positions (${soldPositions.length})`}
              </Button>
            )}
          </Region>
        )}

        {/* Edge case: Only sold positions, no current holdings */}
        {currentHoldings.length === 0 && soldPositions.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No current holdings. Every position above has been sold.
          </p>
        )}
      </div>
    </TooltipProvider>
  )
}
