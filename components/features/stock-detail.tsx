'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Tile, TileNote } from '@/components/ui/tile'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { AppliedSplit, NormalizedTransaction, StockMetrics } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { ChartCard, KpiTile, Legend, StackedColumns } from '@/components/charts'
import { DashboardPage, PageHeader, Region } from '@/components/features/dashboard-layout'
import { ArrowLeft, ArrowLeftRight, TriangleAlert } from '@/components/icons'

const DividendSection = dynamic(
  () => import('./dividend-section').then(m => m.DividendSection),
  { ssr: false }
)
import { isTickerPartialData, getTickerPartialDataExplanation } from '@/lib/partial-data-detector'
import {
  isBuyAction,
  isSellAction,
  isTradeAction,
  getAdjustedShares,
  getAdjustedPricePerShare
} from '@/lib/transaction-utils'
import { formatSplitPhrase } from '@/lib/split-format'
import { compareSplitTimes } from '@/lib/split-csv-events'

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
 * Formats shares with up to 4 decimal places
 */
function formatShares(shares: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(shares)
}

/**
 * Formats a date string as "Dec 8, 2024"
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

interface StockDetailProps {
  ticker?: string
  transactions?: NormalizedTransaction[]
  onBack?: () => void
  className?: string
}

/**
 * Calculates enhanced metrics for a specific ticker from transactions
 * Separates buy and sell volumes to handle partial data scenarios
 */
function calculateMetrics(
  transactions: NormalizedTransaction[],
  ticker: string
): StockMetrics {
  // Filter transactions for this ticker
  const tickerTransactions = transactions.filter(t => t.Ticker === ticker)

  // Get company info from first transaction
  const firstTransaction = tickerTransactions[0]
  const companyName = firstTransaction?.Name || ticker
  const isin = firstTransaction?.ISIN || ''
  const baseCurrency = firstTransaction?.detectedBaseCurrency || 'USD'

  // Separate buys and sells (excluding dividends)
  const buys = tickerTransactions.filter(t => isBuyAction(t.Action))
  const sells = tickerTransactions.filter(t => isSellAction(t.Action))

  // Calculate buy metrics
  const buyShares = buys.reduce((sum, t) => sum + getAdjustedShares(t), 0)
  const buyVolume = buys.reduce((sum, t) => sum + Math.abs(t.totalInBaseCurrency || 0), 0)

  // Calculate sell metrics
  const sellShares = sells.reduce((sum, t) => sum + getAdjustedShares(t), 0)
  const sellVolume = sells.reduce((sum, t) => sum + Math.abs(t.totalInBaseCurrency || 0), 0)

  // Calculate realized profit/loss from CSV Result column
  const realizedResult = sells.reduce((sum, t) => sum + (t.Result || 0), 0)

  // Calculate net flows (can be negative for partial data)
  const netShareFlow = buyShares - sellShares
  const netCashFlow = buyVolume - sellVolume

  // Determine position status
  let positionStatus: 'net-buying' | 'net-selling' | 'flat' = 'flat'
  if (netShareFlow > 0.0001) {
    positionStatus = 'net-buying'
  } else if (netShareFlow < -0.0001) {
    positionStatus = 'net-selling'
  }

  // Detect if this is partial data (selling more than buying suggests prior holdings)
  const isPartialData = netShareFlow < -0.0001 || 
    (sells.length > 0 && buys.length === 0)

  // Get date range
  const dates = tickerTransactions.map(t => t.Time).sort()
  const dateRange = {
    start: dates[0] || '',
    end: dates[dates.length - 1] || ''
  }

  return {
    companyName,
    isin,
    baseCurrency,
    buyVolume,
    buyShares,
    buyTransactionCount: buys.length,
    sellVolume,
    sellShares,
    sellTransactionCount: sells.length,
    netCashFlow,
    netShareFlow,
    realizedResult,
    isPartialData,
    positionStatus,
    dateRange
  }
}

/**
 * Formats a date string as "Oct 2025" for chart labels
 */
function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric'
  }).format(date)
}

interface MonthlyFlow {
  id: string
  label: string
  buy: number
  sell: number
}

/**
 * Buy and sell volume per calendar month, from the first trade to the last,
 * with quiet months kept so the spacing reads as time.
 */
function monthlyFlows(trades: NormalizedTransaction[]): MonthlyFlow[] {
  if (trades.length === 0) return []
  const byMonth = new Map<string, { buy: number; sell: number }>()
  let first: Date | null = null
  let last: Date | null = null
  for (const t of trades) {
    const date = new Date(t.Time)
    if (Number.isNaN(date.getTime())) continue
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const entry = byMonth.get(key) ?? { buy: 0, sell: 0 }
    const amount = Math.abs(t.totalInBaseCurrency || 0)
    if (isBuyAction(t.Action)) entry.buy += amount
    else if (isSellAction(t.Action)) entry.sell += amount
    byMonth.set(key, entry)
    if (!first || date < first) first = date
    if (!last || date > last) last = date
  }
  if (!first || !last) return []
  const out: MonthlyFlow[] = []
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1)
  const end = new Date(last.getFullYear(), last.getMonth(), 1)
  while (cursor <= end && out.length < 240) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
    const entry = byMonth.get(key) ?? { buy: 0, sell: 0 }
    out.push({ id: key, label: formatMonthYear(cursor), buy: entry.buy, sell: entry.sell })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
}

/**
 * "Pre-split" chip for a trade made before a later stock split, with the
 * trade in today's share terms in a tooltip that also opens on tap.
 */
function PreSplitBadge ({ note }: { note: string }) {
  const [open, setOpen] = useState(false)
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(event) => {
              // A tap focuses the badge (which opens the tooltip) and then clicks it:
              // keep it open and stop Radix from closing it on that same click.
              event.preventDefault()
              setOpen(true)
            }}
            className={cn(badgeVariants({ variant: 'outline' }), 'relative h-5 px-2 font-normal text-muted-foreground before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-[\'\']')}
          >
            Pre-split
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {note}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Stock Detail Component
 * Displays comprehensive analytics for a single stock position
 */
export function StockDetail ({
  ticker: tickerProp,
  transactions: transactionsProp,
  onBack: onBackProp,
  className
}: StockDetailProps) {
  const storeSelectedTicker = useDashboardStore((state) => state.selectedTicker)
  const storeTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const storeBackToOverview = useDashboardStore((state) => state.backToOverview)
  const partialDataWarning = useDashboardStore((state) => state.partialDataWarning)
  const appliedSplits = useDashboardStore((state) => state.appliedSplits)
  const ticker = tickerProp ?? storeSelectedTicker
  const transactions = transactionsProp ?? storeTransactions
  const onBack = onBackProp ?? storeBackToOverview
  const [partialOpen, setPartialOpen] = useState(false)

  const metrics = useMemo(
    () =>
      ticker
        ? calculateMetrics(transactions, ticker)
        : {
            companyName: '',
            isin: '',
            baseCurrency: 'USD',
            buyVolume: 0,
            buyShares: 0,
            buyTransactionCount: 0,
            sellVolume: 0,
            sellShares: 0,
            sellTransactionCount: 0,
            netCashFlow: 0,
            netShareFlow: 0,
            realizedResult: 0,
            isPartialData: false,
            positionStatus: 'flat' as const,
            dateRange: { start: '', end: '' }
          },
    [transactions, ticker]
  )

  const isPartialDataForTicker = ticker && partialDataWarning
    ? isTickerPartialData(ticker, partialDataWarning)
    : false

  const partialDataExplanation = ticker && isPartialDataForTicker
    ? getTickerPartialDataExplanation(ticker, transactions)
    : ''

  const tickerSplits = useMemo<AppliedSplit[]>(
    () => (ticker ? appliedSplits.filter(s => s.tickers.includes(ticker)) : []),
    [appliedSplits, ticker]
  )

  const tableTransactions = useMemo(() => {
    if (!ticker) return []
    return transactions
      .filter(t => t.Ticker === ticker)
      .filter(t => isTradeAction(t.Action))
      .sort((a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime())
  }, [transactions, ticker])

  const flows = useMemo(() => monthlyFlows(tableTransactions), [tableTransactions])

  const flowData = useMemo(
    () =>
      flows.map((month) => ({
        id: month.id,
        label: month.label,
        values: { buy: month.buy, sell: month.sell },
        display: {
          buy: formatCurrency(month.buy, metrics.baseCurrency),
          sell: formatCurrency(month.sell, metrics.baseCurrency)
        }
      })),
    [flows, metrics.baseCurrency]
  )

  if (!ticker) return null

  const currency = metrics.baseCurrency
  const avgBuyPrice = metrics.buyShares > 0 ? metrics.buyVolume / metrics.buyShares : null
  const avgSellPrice = metrics.sellShares > 0 ? metrics.sellVolume / metrics.sellShares : null
  const realizedTone = metrics.realizedResult > 0 ? 'up' : metrics.realizedResult < 0 ? 'down' : 'neutral'
  const statusLabel =
    metrics.positionStatus === 'net-buying'
      ? 'Net buying in this file'
      : metrics.positionStatus === 'net-selling'
        ? 'Net selling in this file'
        : 'Bought and sold the same amount'

  const title = (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="ticker">{ticker}</span>
      {isPartialDataForTicker && (
        <TooltipProvider delayDuration={200}>
          <Tooltip open={partialOpen} onOpenChange={setPartialOpen}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(event) => {
                  // A tap focuses the badge (which opens the tooltip) and then clicks it:
                  // keep it open and stop Radix from closing it on that same click.
                  event.preventDefault()
                  setPartialOpen(true)
                }}
                className={cn(badgeVariants({ variant: 'warning' }), 'relative text-xs before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-[\'\']')}
                aria-label={`Partial data: ${partialDataExplanation}`}
              >
                <TriangleAlert size={12} strokeWidth={2} />
                Partial data
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              {partialDataExplanation}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  )

  return (
    <DashboardPage className={className}>
      <PageHeader
        before={
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ms-3 ps-2.5"
            aria-label="Return to portfolio overview"
          >
            <ArrowLeft size={16} />
            Portfolio
          </Button>
        }
        title={title}
        description={
          <>
            <span>{metrics.companyName}</span>
            {metrics.isin && (
              <span className="figure hidden sm:inline"> &middot; ISIN {metrics.isin}</span>
            )}
          </>
        }
      />

      {/* Position */}
      <Region label="Position" id="stock-position">
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-3">
          <KpiTile
            label="Buy volume"
            value={formatCurrency(metrics.buyVolume, currency)}
            sub={`${metrics.buyTransactionCount} ${metrics.buyTransactionCount === 1 ? 'buy' : 'buys'}, ${formatShares(metrics.buyShares)} shares`}
            hint="Everything spent on buys of this stock in the file, in your base currency."
          />
          <KpiTile
            label="Sell volume"
            value={formatCurrency(metrics.sellVolume, currency)}
            sub={`${metrics.sellTransactionCount} ${metrics.sellTransactionCount === 1 ? 'sell' : 'sells'}, ${formatShares(metrics.sellShares)} shares`}
            hint="Everything received from sells of this stock in the file, in your base currency."
          />
          <KpiTile
            label="Realised P&L"
            tone={realizedTone}
            value={`${metrics.realizedResult >= 0 ? '+' : ''}${formatCurrency(metrics.realizedResult, currency)}`}
            sub={metrics.sellTransactionCount > 0 ? 'From closed sells' : 'Nothing sold yet'}
            hint="The sum of the Result column Trading 212 reports on each sell."
          />
          <KpiTile
            label="Net share flow"
            value={`${metrics.netShareFlow >= 0 ? '+' : ''}${formatShares(metrics.netShareFlow)}`}
            sub={statusLabel}
            hint="Shares bought minus shares sold in this file. Negative means you sold shares bought before the file starts."
          />
          <KpiTile
            label="Average buy price"
            value={avgBuyPrice !== null ? formatCurrency(avgBuyPrice, currency) : '—'}
            sub="Per share bought"
            hint="Buy volume divided by shares bought, in your base currency. Share counts are split-adjusted, so this is in today's share terms."
          />
          <KpiTile
            label="Average sell price"
            value={avgSellPrice !== null ? formatCurrency(avgSellPrice, currency) : '—'}
            sub="Per share sold"
            hint="Sell volume divided by shares sold, in your base currency. Share counts are split-adjusted, so this is in today's share terms."
          />
        </div>
        {tickerSplits.length > 0 && (
          <TileNote className="mt-3">
            Share counts and average prices are adjusted for {formatSplitPhrase(tickerSplits)}.
          </TileNote>
        )}
      </Region>

      {/* Buys and sells */}
      {flowData.length > 0 && (
        <Region label="Buys and sells" id="stock-flows">
          <ChartCard
            title="Buy and sell volume by month"
            note={
              metrics.netCashFlow >= 0
                ? `${formatCurrency(metrics.netCashFlow, currency)} net invested`
                : `${formatCurrency(Math.abs(metrics.netCashFlow), currency)} net taken out`
            }
          >
            <StackedColumns
              layout="stacked"
              series={[
                { key: 'buy', label: 'Buys', color: 1 },
                { key: 'sell', label: 'Sells', color: 6 }
              ]}
              data={flowData}
              height={168}
              aria-label={`Buy and sell volume by month for ${ticker}`}
            />
            <Legend
              className="mt-3"
              items={[
                { id: 'buy', label: 'Buys', color: 1, value: formatCurrency(metrics.buyVolume, currency) },
                { id: 'sell', label: 'Sells', color: 6, value: formatCurrency(metrics.sellVolume, currency) }
              ]}
            />
          </ChartCard>
        </Region>
      )}

      {/* Dividend Income Section */}
      <DividendSection
        ticker={ticker}
        transactions={transactions}
        baseCurrency={metrics.baseCurrency}
      />

      {/* Transactions */}
      <Region label="Transactions" id="stock-transactions">
        {tableTransactions.length === 0 ? (
          <Tile size="sm" className="flex items-center gap-2.5 px-4">
            <ArrowLeftRight size={16} className="shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No buys or sells of {ticker} in this file.</p>
          </Tile>
        ) : (
          <Tile size="flush" className="overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-2 pt-4 sm:px-5">
              <h3 className="text-sm font-medium leading-5">Trades</h3>
              <TileNote>
                {tableTransactions.length} {tableTransactions.length === 1 ? 'trade' : 'trades'}, newest first
              </TileNote>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pe-2 ps-4 sm:pe-4 sm:ps-5" scope="col">Date</TableHead>
                  <TableHead className="px-2 sm:px-4" scope="col">Action</TableHead>
                  <TableHead className="hidden text-right sm:table-cell" scope="col">Shares</TableHead>
                  <TableHead className="hidden text-right md:table-cell" scope="col">Price/share</TableHead>
                  <TableHead className="pe-4 ps-2 text-right sm:px-4" scope="col">Total</TableHead>
                  <TableHead className="hidden pe-4 ps-2 text-right sm:table-cell sm:pe-5 sm:ps-4" scope="col">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableTransactions.map((transaction, index) => {
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
                  const result = transaction.Result
                  const hasResult = !isBuy && typeof result === 'number' && Number.isFinite(result)
                  const resultStr = hasResult
                    ? `${result >= 0 ? '+' : ''}${formatCurrency(result, metrics.baseCurrency)}`
                    : '—'
                  const isPreSplit = transaction.splitFactor !== undefined && transaction.splitFactor !== 1
                  const laterSplitCount = tickerSplits.filter(s => compareSplitTimes(transaction.Time, s.cutoff) < 0).length
                  const preSplitNote = isPreSplit
                    ? `Equals ${formatShares(getAdjustedShares(transaction))} shares at ${formatCurrency(
                        getAdjustedPricePerShare(transaction),
                        transaction['Currency (Price / share)'] || metrics.baseCurrency
                      )} after the ${laterSplitCount > 1 ? 'splits' : 'split'}`
                    : ''

                  return (
                    <TableRow key={transaction.ID || index}>
                      <TableCell className="figure whitespace-nowrap pe-2 ps-4 text-muted-foreground sm:pe-4 sm:ps-5">
                        {dateStr}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <Badge variant={isBuy ? 'up' : 'down'} aria-label={isBuy ? 'Buy transaction' : 'Sell transaction'}>
                          {isBuy ? 'Buy' : 'Sell'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="figure hidden whitespace-nowrap text-right sm:table-cell"
                        aria-label={isPreSplit ? `${shares} shares, pre-split. ${preSplitNote}` : `${shares} shares`}
                      >
                        {isPreSplit ? (
                          <span className="inline-flex items-center justify-end gap-2">
                            <PreSplitBadge note={preSplitNote} />
                            {shares}
                          </span>
                        ) : shares}
                      </TableCell>
                      <TableCell className="figure hidden whitespace-nowrap text-right text-muted-foreground md:table-cell" aria-label={`Price per share: ${price}`}>
                        {price}
                      </TableCell>
                      <TableCell
                        className="figure whitespace-nowrap pe-4 ps-2 text-right sm:px-4"
                        aria-label={`Total: ${total}${hasResult ? `, result: ${resultStr}` : ''}`}
                      >
                        {total}
                        {hasResult && (
                          <span
                            aria-hidden="true"
                            className={cn('block text-xs sm:hidden', result > 0 && 'text-up', result < 0 && 'text-down')}
                          >
                            {resultStr}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'figure hidden whitespace-nowrap pe-4 ps-2 text-right sm:table-cell sm:pe-5 sm:ps-4',
                          hasResult && result > 0 && 'text-up',
                          hasResult && result < 0 && 'text-down',
                          !hasResult && 'text-muted-foreground'
                        )}
                        aria-label={hasResult ? `Result: ${resultStr}` : 'No result'}
                      >
                        {resultStr}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Tile>
        )}
      </Region>
    </DashboardPage>
  )
}
