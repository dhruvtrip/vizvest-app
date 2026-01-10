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
import type { NormalizedTransaction } from '@/types/trading212'
import { DividendSection } from './dividend-section'

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
  ticker: string
  transactions: NormalizedTransaction[]
  onBack: () => void
  className?: string
}

interface StockMetrics {
  companyName: string
  isin: string
  totalShares: number
  totalInvested: number
  avgBuyPrice: number
  buyCount: number
  sellCount: number
  baseCurrency: string
}

/**
 * Calculates metrics for a specific ticker from transactions
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
  const buys = tickerTransactions.filter(t => t.Action === 'Market buy')
  const sells = tickerTransactions.filter(t => t.Action === 'Market sell')

  // Calculate totals for buys
  const totalBuyShares = buys.reduce((sum, t) => sum + (t['No. of shares'] || 0), 0)
  const totalBuyAmount = buys.reduce((sum, t) => sum + Math.abs(t.totalInBaseCurrency || 0), 0)

  // Calculate totals for sells
  const totalSellShares = sells.reduce((sum, t) => sum + (t['No. of shares'] || 0), 0)
  const totalSellAmount = sells.reduce((sum, t) => sum + Math.abs(t.totalInBaseCurrency || 0), 0)

  // Calculate final metrics
  const totalShares = totalBuyShares - totalSellShares
  const totalInvested = totalBuyAmount - totalSellAmount
  const avgBuyPrice = totalBuyShares > 0 ? totalBuyAmount / totalBuyShares : 0

  return {
    companyName,
    isin,
    totalShares,
    totalInvested,
    avgBuyPrice,
    buyCount: buys.length,
    sellCount: sells.length,
    baseCurrency
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
export function StockDetail({
  ticker,
  transactions,
  onBack,
  className
}: StockDetailProps) {
  // Calculate metrics for this ticker
  const metrics = useMemo(
    () => calculateMetrics(transactions, ticker),
    [transactions, ticker]
  )

  // Filter and sort transactions for the table (exclude dividends)
  const tableTransactions = useMemo(() => {
    return transactions
      .filter(t => t.Ticker === ticker)
      .filter(t => t.Action === 'Market buy' || t.Action === 'Market sell')
      .sort((a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime())
  }, [transactions, ticker])

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header Section */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          label="Total Shares"
          value={formatShares(metrics.totalShares)}
        />
        <MetricCard
          label="Total Invested"
          value={formatCurrency(metrics.totalInvested, metrics.baseCurrency)}
        />
        <MetricCard
          label="Avg Buy Price"
          value={formatCurrency(metrics.avgBuyPrice, metrics.baseCurrency)}
        />
        <MetricCard
          label="Buy Transactions"
          value={metrics.buyCount.toString()}
        />
        <MetricCard
          label="Sell Transactions"
          value={metrics.sellCount.toString()}
        />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs text-right">Shares</TableHead>
                  <TableHead className="text-xs text-right">Price/Share</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableTransactions.map((transaction, index) => {
                  const isBuy = transaction.Action === 'Market buy'
                  const actionColor = isBuy
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'

                  return (
                    <TableRow key={transaction.ID || index}>
                      <TableCell className="text-xs text-muted-foreground py-2">
                        {formatDate(transaction.Time)}
                      </TableCell>
                      <TableCell className={cn('text-xs font-medium py-2', actionColor)}>
                        {isBuy ? 'Buy' : 'Sell'}
                      </TableCell>
                      <TableCell className="text-xs text-right py-2">
                        {formatShares(transaction['No. of shares'] || 0)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground py-2">
                        {formatCurrency(
                          transaction['Price / share'] || 0,
                          transaction['Currency (Price / share)'] || metrics.baseCurrency
                        )}
                      </TableCell>
                      <TableCell className={cn('text-xs text-right font-medium py-2', actionColor)}>
                        {formatCurrency(
                          transaction.totalInBaseCurrency || 0,
                          metrics.baseCurrency
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
