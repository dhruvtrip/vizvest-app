'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction, StockMetrics } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { BlurReveal } from '@/components/motion/blur-reveal'
import { MetricCell, MetricGrid } from '@/components/features/metric-cell'
import { EmptyCell, SectionHeader, StatusMark, TableFrame } from '@/components/features/analysis-kit'

const DividendSection = dynamic(
  () => import('./dividend-section').then(m => m.DividendSection),
  { ssr: false }
)
import { isTickerPartialData, getTickerPartialDataExplanation } from '@/lib/partial-data-detector'
import { isBuyAction, isSellAction, isTradeAction } from '@/lib/transaction-utils'

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
  const buyShares = buys.reduce((sum, t) => sum + (t['No. of shares'] || 0), 0)
  const buyVolume = buys.reduce((sum, t) => sum + Math.abs(t.totalInBaseCurrency || 0), 0)

  // Calculate sell metrics
  const sellShares = sells.reduce((sum, t) => sum + (t['No. of shares'] || 0), 0)
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
 * Quiet chip summarising one side of the trade history (buys or sells).
 */
function FlowChip({
  tone,
  count,
  noun,
  shares
}: {
  tone: 'positive' | 'negative'
  count: number
  noun: string
  shares: number
}) {
  return (
    <div className="tabular inline-flex h-8 items-center gap-2 rounded-full border border-border px-3 text-p-sm">
      <StatusMark tone={tone} />
      <span className="text-foreground">
        {count} {noun}
      </span>
      <span className="text-fg-secondary">{formatShares(shares)} shares</span>
    </div>
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
  const ticker = tickerProp ?? storeSelectedTicker
  const transactions = transactionsProp ?? storeTransactions
  const onBack = onBackProp ?? storeBackToOverview

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

  const tableTransactions = useMemo(() => {
    if (!ticker) return []
    return transactions
      .filter(t => t.Ticker === ticker)
      .filter(t => isTradeAction(t.Action))
      .sort((a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime())
  }, [transactions, ticker])

  if (!ticker) return null

  const realizedSign = metrics.realizedResult >= 0 ? '+' : ''

  return (
    <div className={cn('min-w-0', className)}>
      {/* Header */}
      <BlurReveal immediate className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2.5 mb-4 text-fg-secondary"
          aria-label="Return to portfolio overview"
        >
          <ArrowLeft aria-hidden="true" strokeWidth={1.5} />
          Back to portfolio
        </Button>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="min-w-0 text-h4 text-foreground md:text-h3">
            {metrics.companyName}
          </h1>
          <Badge>{ticker}</Badge>
        </div>
        {metrics.isin && (
          <p className="tabular mt-1 text-p-sm text-fg-gray">
            ISIN {metrics.isin}
          </p>
        )}
      </BlurReveal>

      <div className="space-y-10 md:space-y-12">
        <BlurReveal immediate delay={0.1} className="space-y-4">
          {/* Partial data warning */}
          {isPartialDataForTicker && (
            <div className="flex items-start gap-3 border border-border px-5 py-4 md:px-6">
              <StatusMark tone="warning" className="mt-[7px]" />
              <div className="min-w-0 flex-1">
                <p className="text-p-sm text-foreground">Partial transaction data</p>
                <p className="mt-0.5 text-p-sm text-fg-secondary">
                  {partialDataExplanation}
                </p>
              </div>
            </div>
          )}

          {/* Key metrics */}
          <MetricGrid columns={4}>
            <MetricCell
              label="Buy volume"
              value={formatCurrency(metrics.buyVolume, metrics.baseCurrency)}
            />
            <MetricCell
              label="Sell volume"
              value={formatCurrency(metrics.sellVolume, metrics.baseCurrency)}
            />
            <MetricCell
              label="Realized P&L"
              value={`${realizedSign}${formatCurrency(metrics.realizedResult, metrics.baseCurrency)}`}
              tone={metrics.realizedResult > 0 ? 'positive' : metrics.realizedResult < 0 ? 'negative' : 'default'}
            />
            <MetricCell
              label="Net share flow"
              value={`${metrics.netShareFlow >= 0 ? '+' : ''}${formatShares(metrics.netShareFlow)}`}
              aside={
                metrics.positionStatus === 'net-buying' ? (
                  <span className="inline-flex items-center gap-1.5 text-label text-fg-secondary">
                    <StatusMark tone="positive" />Buying
                  </span>
                ) : metrics.positionStatus === 'net-selling' ? (
                  <span className="inline-flex items-center gap-1.5 text-label text-fg-secondary">
                    <StatusMark tone="negative" />Selling
                  </span>
                ) : undefined
              }
            />
          </MetricGrid>

          {/* Transaction counts */}
          <div className="flex flex-wrap gap-2" aria-label="Transaction counts">
            <FlowChip
              tone="positive"
              count={metrics.buyTransactionCount}
              noun={metrics.buyTransactionCount === 1 ? 'buy' : 'buys'}
              shares={metrics.buyShares}
            />
            <FlowChip
              tone="negative"
              count={metrics.sellTransactionCount}
              noun={metrics.sellTransactionCount === 1 ? 'sell' : 'sells'}
              shares={metrics.sellShares}
            />
          </div>
        </BlurReveal>

        {/* Transaction history */}
        <section aria-labelledby="transaction-history-heading">
          <SectionHeader
            id="transaction-history-heading"
            title="Transaction history"
            meta={`${tableTransactions.length} ${tableTransactions.length === 1 ? 'trade' : 'trades'}`}
          />

          {tableTransactions.length === 0 ? (
            <EmptyCell title="No transactions found" />
          ) : (
            <BlurReveal soft>
              <TableFrame>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead scope="col">Date</TableHead>
                      <TableHead scope="col">Action</TableHead>
                      <TableHead className="text-right" scope="col">Shares</TableHead>
                      <TableHead className="text-right" scope="col">Price / share</TableHead>
                      <TableHead className="text-right" scope="col">Total</TableHead>
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

                      return (
                        <TableRow key={transaction.ID || index}>
                          <TableCell className="whitespace-nowrap text-fg-secondary">
                            {dateStr}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" aria-label={isBuy ? 'Buy transaction' : 'Sell transaction'}>
                              <StatusMark tone={isBuy ? 'positive' : 'negative'} />
                              {isBuy ? 'Buy' : 'Sell'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-foreground" aria-label={`${shares} shares`}>
                            {shares}
                          </TableCell>
                          <TableCell className="text-right text-fg-secondary" aria-label={`Price per share: ${price}`}>
                            {price}
                          </TableCell>
                          <TableCell className="text-right text-foreground" aria-label={`Total: ${total}`}>
                            {total}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableFrame>
            </BlurReveal>
          )}
        </section>

        {/* Dividend income */}
        <DividendSection
          ticker={ticker}
          transactions={transactions}
          baseCurrency={metrics.baseCurrency}
        />
      </div>
    </div>
  )
}
