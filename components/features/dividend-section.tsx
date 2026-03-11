'use client'

import { useMemo } from 'react'
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
import { AnimateOnView } from '@/components/features/dividends-dashboard'

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
 * Converts a dividend amount to base currency
 */
function convertToBaseCurrency(
  amount: number | undefined,
  exchangeRate: number | undefined
): number {
  const value = amount || 0
  const rate = exchangeRate || 1
  return value * rate
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

  // Process each dividend (use Total for gross amount, not Result)
  const dividends: DividendTransaction[] = dividendTransactions.map(t => {
    // For dividends, gross amount is in Total field (Result is typically for trading P&L)
    const gross = convertToBaseCurrency(t.Total, t['Exchange rate'])
    const tax = convertToBaseCurrency(t['Withholding tax'], t['Exchange rate'])
    return {
      date: t.Time,
      gross,
      tax,
      net: gross - tax
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
 * Individual metric card component
 */
function MetricCard({
  label,
  value,
  className,
  valueClassName
}: {
  label: string
  value: string
  className?: string
  valueClassName?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-semibold text-foreground mt-0.5', valueClassName)}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Custom tooltip for the bar chart
 */
function CustomTooltip({
  active,
  payload,
  baseCurrency
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  baseCurrency: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-popover/90 backdrop-blur-md border border-border/50 rounded-lg shadow-xl shadow-black/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
        <p className="text-xs font-semibold text-foreground">
          {formatCurrency(payload[0].value, baseCurrency)}
        </p>
      </div>
    </div>
  )
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

  return (
    <section className={cn('space-y-3', className)} aria-labelledby="dividend-heading">
      {/* Section Header */}
      <h2 id="dividend-heading" className="text-sm font-semibold text-foreground">
        Dividend Income
      </h2>

      {!hasDividends ? (
        <Card className="p-6 text-center border-dashed">
          <p className="text-xs text-muted-foreground">No dividends received</p>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Total Dividends"
              value={formatCurrency(metrics.totalGross, baseCurrency)}
            />
            <MetricCard
              label="Withholding Tax"
              value={formatCurrency(metrics.totalTax, baseCurrency)}
              valueClassName="text-muted-foreground"
            />
            <MetricCard
              label="Net Dividends"
              value={formatCurrency(metrics.totalNet, baseCurrency)}
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />
            <MetricCard
              label="Payments"
              value={metrics.paymentCount.toString()}
            />
          </div>

          {/* Bar Chart */}
          {chartData.length > 1 && (
            <AnimateOnView minHeight={176}>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-xs text-muted-foreground mb-3">
                    Dividend History
                  </h3>
                  <div className="h-44" role="img" aria-label={`Bar chart showing dividend income by month for ${ticker}. Total net dividends: ${formatCurrency(metrics.totalNet, baseCurrency)}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} aria-label={`Dividend income chart for ${ticker}`}>
                        <defs>
                          <linearGradient id="barGradientSection" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                          width={65}
                        />
                        <Tooltip
                          content={<CustomTooltip baseCurrency={baseCurrency} />}
                          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                        />
                        <Bar
                          dataKey="amount"
                          fill="url(#barGradientSection)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                          animationDuration={800}
                          animationEasing="ease-out"
                          animationBegin={100}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnView>
          )}

          {/* Dividend Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs" scope="col">Date</TableHead>
                    <TableHead className="text-xs text-right" scope="col">Gross</TableHead>
                    <TableHead className="text-xs text-right" scope="col">Tax</TableHead>
                    <TableHead className="text-xs text-right" scope="col">Net</TableHead>
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
                        <TableCell className="text-xs text-muted-foreground py-2">
                          {dateStr}
                        </TableCell>
                        <TableCell className="text-xs text-right py-2" aria-label={`Gross dividend: ${gross}`}>
                          {gross}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground py-2" aria-label={`Withholding tax: ${tax}`}>
                          {tax}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-emerald-600 dark:text-emerald-400 py-2" aria-label={`Net dividend: ${net}`}>
                          {net}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </section>
  )
}
