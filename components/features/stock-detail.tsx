'use client'

import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { DividendSection } from './dividend-section'
import { isTickerPartialData, getTickerPartialDataExplanation } from '@/lib/partial-data-detector'

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
  const buys = tickerTransactions.filter(t => t.Action === 'Market buy' || t.Action === 'Limit buy')
  const sells = tickerTransactions.filter(t => t.Action === 'Market sell')

  // Calculate buy metrics
  const buyShares = buys.reduce((sum, t) => sum + (t['No. of shares'] || 0), 0)
  const buyVolume = buys.reduce((sum, t) => sum + Math.abs(t.totalInBaseCurrency || 0), 0)
  const avgBuyPrice = buyShares > 0 ? buyVolume / buyShares : 0

  // Calculate sell metrics
  const sellShares = sells.reduce((sum, t) => sum + (t['No. of shares'] || 0), 0)
  const sellVolume = sells.reduce((sum, t) => sum + Math.abs(t.totalInBaseCurrency || 0), 0)
  const avgSellPrice = sellShares > 0 ? sellVolume / sellShares : 0

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
    avgBuyPrice,
    sellVolume,
    sellShares,
    sellTransactionCount: sells.length,
    avgSellPrice,
    netCashFlow,
    netShareFlow,
    realizedResult,
    isPartialData,
    positionStatus,
    dateRange
  }
}

/**
 * Individual metric card component
 */
function MetricCard({
  label,
  value,
  className
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
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
            avgBuyPrice: 0,
            sellVolume: 0,
            sellShares: 0,
            sellTransactionCount: 0,
            avgSellPrice: 0,
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
      .filter(t => t.Action === 'Market buy' || t.Action === 'Market sell')
      .sort((a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime())
  }, [transactions, ticker])

  if (!ticker) return null

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header Section */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2"
          aria-label="Return to portfolio overview"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Portfolio
        </Button>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">
              {metrics.companyName}
            </h1>
            <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
              {ticker}
            </span>
          </div>
          {metrics.isin && (
            <p className="text-xs text-muted-foreground">
              ISIN: {metrics.isin}
            </p>
          )}
        </div>
      </div>

      {/* Partial Data Warning */}
      {isPartialDataForTicker && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-amber-500 text-xs font-bold">!</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                Partial Transaction Data
              </p>
              <p className="text-xs text-muted-foreground">
                {partialDataExplanation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Buy Volume"
          value={formatCurrency(metrics.buyVolume, metrics.baseCurrency)}
          className="border-blue-500/20"
        />
        <MetricCard
          label="Sell Volume"
          value={formatCurrency(metrics.sellVolume, metrics.baseCurrency)}
          className="border-rose-500/20"
        />
        <MetricCard
          label="Realized P&L"
          value={`${metrics.realizedResult >= 0 ? '+' : ''}${formatCurrency(metrics.realizedResult, metrics.baseCurrency)}`}
          className={cn(
            metrics.realizedResult >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'
          )}
        />
        <Card className={cn(
          metrics.positionStatus === 'net-buying' 
            ? 'border-blue-500/20' 
            : metrics.positionStatus === 'net-selling'
            ? 'border-rose-500/20'
            : 'border-muted'
        )}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Net Share Flow</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-sm font-semibold text-foreground">
                {metrics.netShareFlow >= 0 ? '+' : ''}{formatShares(metrics.netShareFlow)}
              </p>
              {metrics.positionStatus === 'net-buying' && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                  Buying
                </span>
              )}
              {metrics.positionStatus === 'net-selling' && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded">
                  Selling
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Counts */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Buy Transactions</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-sm font-semibold text-foreground">
                {metrics.buyTransactionCount}
              </p>
              <p className="text-xs text-muted-foreground">
                ({formatShares(metrics.buyShares)} shares)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Sell Transactions</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-sm font-semibold text-foreground">
                {metrics.sellTransactionCount}
              </p>
              <p className="text-xs text-muted-foreground">
                ({formatShares(metrics.sellShares)} shares)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Transaction History
        </h2>

        {tableTransactions.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-xs text-muted-foreground">No transactions found</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs" scope="col">Date</TableHead>
                    <TableHead className="text-xs" scope="col">Action</TableHead>
                    <TableHead className="text-xs text-right" scope="col">Shares</TableHead>
                    <TableHead className="text-xs text-right" scope="col">Price/Share</TableHead>
                    <TableHead className="text-xs text-right" scope="col">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableTransactions.map((transaction, index) => {
                    const isBuy = transaction.Action === 'Market buy'
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

                    return (
                      <TableRow key={transaction.ID || index}>
                        <TableCell className="text-xs text-muted-foreground py-2">
                          {dateStr}
                        </TableCell>
                        <TableCell className={cn('text-xs font-medium py-2', actionColor)}>
                          <span aria-label={isBuy ? 'Buy transaction' : 'Sell transaction'}>
                            {isBuy ? 'Buy' : 'Sell'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-right py-2" aria-label={`${shares} shares`}>
                          {shares}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground py-2" aria-label={`Price per share: ${price}`}>
                          {price}
                        </TableCell>
                        <TableCell className={cn('text-xs text-right font-medium py-2', actionColor)} aria-label={`Total: ${total}`}>
                          {total}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Dividend Income Section */}
      <DividendSection
        ticker={ticker}
        transactions={transactions}
        baseCurrency={metrics.baseCurrency}
      />
    </div>
  )
}
