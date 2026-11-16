'use client'

import { useMemo } from 'react'
import { AnimatedCurrency, AnimatedCount } from '@/components/ui/animated-number'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tile, TileNote } from '@/components/ui/tile'
import type { NormalizedTransaction } from '@/types/trading212'
import { isDividendAction } from '@/lib/transaction-utils'
import { ChartCard, ColumnPlot, KpiTile, type ColumnDatum } from '@/components/charts'
import { Region, kpiGrid } from '@/components/features/dashboard-layout'
import { HandCoins } from '@/components/icons'

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

/**
 * Formats a date string as "MMM YYYY" for chart labels
 */
function formatMonthYear(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric'
  }).format(date)
}

interface DividendSectionProps {
  ticker: string
  transactions: NormalizedTransaction[]
  baseCurrency: string
  className?: string
}

interface DividendMetrics {
  totalGross: number
  totalTax: number
  totalNet: number
  paymentCount: number
}

interface DividendTransaction {
  date: string
  gross: number
  tax: number
  net: number
}

interface ChartDataPoint {
  month: string
  amount: number
}

/**
 * Converts a withholding tax amount to base currency.
 * T212 exchange rate = stock currency per base currency (e.g. 1.175 means 1 EUR = 1.175 USD),
 * so divide to convert from stock currency to base currency.
 */
function convertTaxToBaseCurrency(
  taxAmount: number | undefined,
  exchangeRate: number | undefined
): number {
  const value = taxAmount || 0
  const rate = exchangeRate || 1
  return value / rate
}

/**
 * Calculates dividend metrics for a specific ticker
 */
function calculateDividendMetrics(
  transactions: NormalizedTransaction[],
  ticker: string
): { metrics: DividendMetrics; dividends: DividendTransaction[] } {
  // Filter dividend transactions for this ticker (Action contains 'Dividend')
  const dividendTransactions = transactions.filter(
    t => t.Ticker === ticker && isDividendAction(t.Action)
  )

  // Process each dividend
  // T212's Total for dividends is the NET amount received, already in base currency.
  // Withholding tax is in the stock's native currency and needs conversion.
  const dividends: DividendTransaction[] = dividendTransactions.map(t => {
    const net = Math.abs(t.totalInBaseCurrency || 0)
    const tax = convertTaxToBaseCurrency(t['Withholding tax'], t['Exchange rate'])
    return {
      date: t.Time,
      gross: net + tax,
      tax,
      net
    }
  })

  // Sort by date descending
  dividends.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate totals
  const metrics: DividendMetrics = {
    totalGross: dividends.reduce((sum, d) => sum + d.gross, 0),
    totalTax: dividends.reduce((sum, d) => sum + d.tax, 0),
    totalNet: dividends.reduce((sum, d) => sum + d.net, 0),
    paymentCount: dividends.length
  }

  return { metrics, dividends }
}

/**
 * Prepares chart data by grouping dividends by month
 */
function prepareChartData(dividends: DividendTransaction[]): ChartDataPoint[] {
  if (dividends.length === 0) return []

  // Group by month
  const monthlyData = new Map<string, number>()

  for (const dividend of dividends) {
    const monthKey = formatMonthYear(dividend.date)
    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + dividend.net)
  }

  // Convert to array and sort chronologically
  const chartData: ChartDataPoint[] = []
  const sortedDividends = [...dividends].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const seenMonths = new Set<string>()
  for (const dividend of sortedDividends) {
    const monthKey = formatMonthYear(dividend.date)
    if (!seenMonths.has(monthKey)) {
      seenMonths.add(monthKey)
      chartData.push({
        month: monthKey,
        amount: monthlyData.get(monthKey) || 0
      })
    }
  }

  return chartData
}

/**
 * Dividend Section Component
 * Displays dividend income analytics for a single stock
 */
export function DividendSection({
  ticker,
  transactions,
  baseCurrency,
  className
}: DividendSectionProps) {
  // Calculate dividend metrics
  const { metrics, dividends } = useMemo(
    () => calculateDividendMetrics(transactions, ticker),
    [transactions, ticker]
  )

  // Prepare chart data
  const chartData = useMemo(
    () => prepareChartData(dividends),
    [dividends]
  )

  const hasDividends = dividends.length > 0

  // Column data for the monthly chart, with the number of payments in each month.
  const monthColumns: ColumnDatum[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const dividend of dividends) {
      const key = formatMonthYear(dividend.date)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return chartData.map((point) => {
      const count = counts.get(point.month) || 0
      return {
        id: point.month,
        label: point.month,
        value: point.amount,
        display: formatCurrency(point.amount, baseCurrency),
        note: `${count} ${count === 1 ? 'payment' : 'payments'}`
      }
    })
  }, [chartData, dividends, baseCurrency])

  const bestMonth = useMemo(
    () => chartData.reduce<ChartDataPoint | null>((best, point) => (!best || point.amount > best.amount ? point : best), null),
    [chartData]
  )

  return (
    <Region label="Dividends" id="dividend-heading" className={className}>
      {!hasDividends ? (
        <Tile size="sm" className="flex items-center gap-2.5 px-4">
          <HandCoins size={16} className="shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{ticker} paid no dividends in this file.</p>
        </Tile>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className={kpiGrid}>
            <KpiTile
              label="Gross dividends"
              value={<AnimatedCurrency amount={metrics.totalGross} currency={baseCurrency} formatFn={formatCurrency} />}
              sub="Before withholding tax"
            />
            <KpiTile
              label="Withholding tax"
              value={<AnimatedCurrency amount={metrics.totalTax} currency={baseCurrency} formatFn={formatCurrency} />}
              sub="Taken at source"
            />
            <KpiTile
              label="Net dividends"
              tone="up"
              value={
                <AnimatedCurrency
                  amount={metrics.totalNet}
                  currency={baseCurrency}
                  formatFn={(amount, currency) => `+${formatCurrency(amount, currency)}`}
                />
              }
              sub="Paid into your account"
            />
            <KpiTile
              label="Payments"
              value={<AnimatedCount value={metrics.paymentCount} />}
              sub={metrics.paymentCount === 1 ? 'One payment' : `Average ${formatCurrency(metrics.totalNet / metrics.paymentCount, baseCurrency)} net`}
            />
          </div>

          {/* Dividends by month */}
          {chartData.length > 1 && (
            <ChartCard
              title="Dividends by month"
              color={2}
              note={`${formatCurrency(metrics.totalNet, baseCurrency)} net`}
              footnote={bestMonth ? `Darkest column: the best month, ${bestMonth.month}.` : undefined}
            >
              <ColumnPlot
                data={monthColumns}
                color={2}
                height={152}
                emphasize={(d) => d.id === bestMonth?.month}
                aria-label={`Net dividends by month for ${ticker}. Total net dividends: ${formatCurrency(metrics.totalNet, baseCurrency)}`}
              />
            </ChartCard>
          )}

          {/* Payments */}
          <Tile size="flush" className="overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-2 pt-4 sm:px-5">
              <h3 className="text-sm font-medium leading-5">Payments</h3>
              <TileNote>Newest first</TileNote>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="ps-4 sm:ps-5" scope="col">Date</TableHead>
                  <TableHead className="text-right" scope="col">Gross</TableHead>
                  <TableHead className="text-right" scope="col">Tax</TableHead>
                  <TableHead className="pe-4 text-right sm:pe-5" scope="col">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividends.map((dividend, index) => {
                  const dateStr = formatDate(dividend.date)
                  const gross = formatCurrency(dividend.gross, baseCurrency)
                  const tax = dividend.tax > 0 ? formatCurrency(dividend.tax, baseCurrency) : '—'
                  const net = formatCurrency(dividend.net, baseCurrency)

                  return (
                    <TableRow key={`${dividend.date}-${index}`}>
                      <TableCell className="figure whitespace-nowrap ps-4 text-muted-foreground sm:ps-5">
                        {dateStr}
                      </TableCell>
                      <TableCell className="figure whitespace-nowrap text-right" aria-label={`Gross dividend: ${gross}`}>
                        {gross}
                      </TableCell>
                      <TableCell className="figure whitespace-nowrap text-right text-muted-foreground" aria-label={`Withholding tax: ${tax}`}>
                        {tax}
                      </TableCell>
                      <TableCell className="figure whitespace-nowrap pe-4 text-right font-medium text-up sm:pe-5" aria-label={`Net dividend: ${net}`}>
                        +{net}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Tile>
        </div>
      )}
    </Region>
  )
}
