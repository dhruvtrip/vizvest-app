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
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { isDividendAction } from '@/lib/transaction-utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { BlurReveal } from '@/components/motion/blur-reveal'
import { MetricCell, MetricGrid } from '@/components/features/metric-cell'
import { CHART, ChartTooltip } from '@/components/features/chart-tooltip'
import {
  AXIS_X,
  AXIS_Y,
  CHART_ANIMATION,
  CHART_MARGIN,
  ChartCell,
  EmptyCell,
  SectionHeader,
  TableFrame,
  formatAxisCurrency
} from '@/components/features/analysis-kit'


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
  // Dividend rows often carry "Not available" as the exchange rate; fall back to 1
  // rather than producing NaN.
  const value = Number.isFinite(taxAmount) ? (taxAmount as number) : 0
  const rate = Number.isFinite(exchangeRate) && (exchangeRate as number) > 0 ? (exchangeRate as number) : 1
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
  const symbol = getCurrencySymbol(baseCurrency)

  return (
    <section className={cn('min-w-0', className)} aria-labelledby="dividend-heading">
      <SectionHeader
        id="dividend-heading"
        title="Dividend income"
        meta={hasDividends ? `${metrics.paymentCount} ${metrics.paymentCount === 1 ? 'payment' : 'payments'}` : undefined}
      />

      {!hasDividends ? (
        <EmptyCell title="No dividends received" description={`${ticker} has not paid you a dividend in this export`} />
      ) : (
        <div className="space-y-4">
          <MetricGrid columns={4}>
            <MetricCell
              size="md"
              label="Total dividends"
              value={<AnimatedCurrency amount={metrics.totalGross} currency={baseCurrency} formatFn={formatCurrency} />}
            />
            <MetricCell
              size="md"
              label="Withholding tax"
              tone="muted"
              value={<AnimatedCurrency amount={metrics.totalTax} currency={baseCurrency} formatFn={formatCurrency} />}
            />
            <MetricCell
              size="md"
              label="Net dividends"
              tone="positive"
              value={<AnimatedCurrency amount={metrics.totalNet} currency={baseCurrency} formatFn={formatCurrency} />}
            />
            <MetricCell
              size="md"
              label="Payments"
              value={<AnimatedCount value={metrics.paymentCount} />}
            />
          </MetricGrid>

          {chartData.length > 1 && (
            <BlurReveal soft>
              <div className="cell-grid grid-cols-1">
                <ChartCell
                  title="Dividend history"
                  sub="Net income by month"
                  height={200}
                  label={`Bar chart showing dividend income by month for ${ticker}. Total net dividends: ${formatCurrency(metrics.totalNet, baseCurrency)}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={CHART_MARGIN}>
                      <CartesianGrid {...CHART.grid} />
                      <XAxis dataKey="month" {...AXIS_X} />
                      <YAxis
                        {...AXIS_Y}
                        tickFormatter={(value: number) => formatAxisCurrency(value, symbol)}
                      />
                      <Tooltip
                        cursor={CHART.cursorBar}
                        animationDuration={150}
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <ChartTooltip
                              title={label}
                              rows={[{ name: 'Net income', value: formatCurrency(Number(payload[0].value), baseCurrency), color: CHART.ink }]}
                            />
                          ) : null
                        }
                      />
                      <Bar
                        dataKey="amount"
                        fill={CHART.ink}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                        {...CHART_ANIMATION}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCell>
              </div>
            </BlurReveal>
          )}

          <BlurReveal soft>
            <TableFrame>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">Date</TableHead>
                    <TableHead className="text-right" scope="col">Gross</TableHead>
                    <TableHead className="text-right" scope="col">Tax</TableHead>
                    <TableHead className="text-right" scope="col">Net</TableHead>
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
                        <TableCell className="whitespace-nowrap text-fg-secondary">
                          {dateStr}
                        </TableCell>
                        <TableCell className="text-right text-foreground" aria-label={`Gross dividend: ${gross}`}>
                          {gross}
                        </TableCell>
                        <TableCell className="text-right text-fg-secondary" aria-label={`Withholding tax: ${tax}`}>
                          {tax}
                        </TableCell>
                        <TableCell className="text-right text-foreground" aria-label={`Net dividend: ${net}`}>
                          {net}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableFrame>
          </BlurReveal>
        </div>
      )}
    </section>
  )
}
