'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import posthog from 'posthog-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AnimatedCurrency } from '@/components/ui/animated-number'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid
} from 'recharts'
import * as _ from 'lodash'
import { isDividendAction } from '@/lib/transaction-utils'

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
 * Formats a date string as "MMM YYYY" for chart labels
 */
function formatMonthYear(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric'
  }).format(date)
}

/**
 * Formats a date string as "Q1 2024" for quarter labels
 */
function formatQuarter(dateString: string): string {
  const date = new Date(dateString)
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `Q${quarter} ${date.getFullYear()}`
}

/**
 * Formats a date string as "YYYY" for year labels
 */
function formatYear(dateString: string): string {
  const date = new Date(dateString)
  return date.getFullYear().toString()
}

/**
 * Converts a withholding tax amount to base currency
 * On T212 dividend rows, the exchange rate represents base currency per stock currency
 * (e.g., EUR per USD), so we multiply to convert
 */
function convertTaxToBaseCurrency(
  taxAmount: number | undefined,
  exchangeRate: number | undefined
): number {
  const value = taxAmount || 0
  const rate = exchangeRate || 1
  return value * rate
}

interface DividendTransaction {
  date: string
  ticker: string
  name: string
  gross: number
  tax: number
  net: number
  shares: number
  dividendPerShare: number
  dividendCurrency: string
}

interface StockDividendData {
  ticker: string
  name: string
  totalDividends: number
  paymentCount: number
  lastDividendPerShare: { amount: number; currency: string } | null
}

interface GlobalDividendData {
  totalGross: number
  totalTax: number
  totalNet: number
  paymentCount: number
  dividends: DividendTransaction[]
  byStock: Map<string, StockDividendData>
  byMonth: Map<string, number>
  byQuarter: Map<string, number>
  byYear: Map<string, number>
}

interface ChartDataPoint {
  period: string
  amount: number
  cumulative?: number
}

interface YearComparison {
  year: string
  total: number
  growth?: number
}

/**
 * Calculates global dividend metrics from all transactions
 */
function calculateGlobalDividendMetrics(
  transactions: NormalizedTransaction[]
): GlobalDividendData {
  const baseCurrency = transactions[0]?.detectedBaseCurrency || 'USD'
  
  // Filter all dividend transactions
  const dividendTransactions = transactions.filter(t => 
    t.Ticker && isDividendAction(t.Action)
  )

  // Process dividends
  // T212's Total for dividends is the NET amount received, already in base currency.
  // Withholding tax is in the stock's native currency and needs conversion.
  const dividends: DividendTransaction[] = dividendTransactions.map(t => {
    const net = Math.abs(t.totalInBaseCurrency || 0)
    const tax = convertTaxToBaseCurrency(t['Withholding tax'], t['Exchange rate'])
    return {
      date: t.Time,
      ticker: t.Ticker || '',
      name: t.Name || t.Ticker || '',
      gross: net + tax,
      tax,
      net,
      shares: t['No. of shares'] || 0,
      dividendPerShare: t['Price / share'] || 0,
      dividendCurrency: t['Currency (Price / share)'] || ''
    }
  })

  // Calculate totals
  const totalGross = dividends.reduce((sum, d) => sum + d.gross, 0)
  const totalTax = dividends.reduce((sum, d) => sum + d.tax, 0)
  const totalNet = dividends.reduce((sum, d) => sum + d.net, 0)

  // Group by stock
  const byStock = new Map<string, StockDividendData>()
  const stockGroups = _.groupBy(dividends, 'ticker')
  
  for (const [ticker, stockDividends] of Object.entries(stockGroups)) {
    if (!Array.isArray(stockDividends)) continue
    const totalDividends = stockDividends.reduce((sum, d) => sum + d.net, 0)
    const paymentCount = stockDividends.length

    // Get most recent dividend per share (sort by date descending)
    const sortedByDate = [...stockDividends].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const lastDiv = sortedByDate[0]
    const lastDividendPerShare = lastDiv && lastDiv.dividendPerShare > 0
      ? { amount: lastDiv.dividendPerShare, currency: lastDiv.dividendCurrency }
      : null

    byStock.set(ticker, {
      ticker,
      name: stockDividends[0]?.name || ticker,
      totalDividends,
      paymentCount,
      lastDividendPerShare
    })
  }

  // Group by month
  const byMonth = new Map<string, number>()
  for (const dividend of dividends) {
    const monthKey = formatMonthYear(dividend.date)
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + dividend.net)
  }

  // Group by quarter
  const byQuarter = new Map<string, number>()
  for (const dividend of dividends) {
    const quarterKey = formatQuarter(dividend.date)
    byQuarter.set(quarterKey, (byQuarter.get(quarterKey) || 0) + dividend.net)
  }

  // Group by year
  const byYear = new Map<string, number>()
  for (const dividend of dividends) {
    const yearKey = formatYear(dividend.date)
    byYear.set(yearKey, (byYear.get(yearKey) || 0) + dividend.net)
  }

  return {
    totalGross,
    totalTax,
    totalNet,
    paymentCount: dividends.length,
    dividends,
    byStock,
    byMonth,
    byQuarter,
    byYear
  }
}

/**
 * Groups dividends by period for charts
 */
function groupDividendsByPeriod(
  dividends: DividendTransaction[],
  period: 'month' | 'quarter' | 'year'
): ChartDataPoint[] {
  const grouped = new Map<string, number>()
  const cumulative = new Map<string, number>()

  // Sort by date
  const sorted = [...dividends].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let runningTotal = 0

  for (const dividend of sorted) {
    let periodKey: string
    if (period === 'month') {
      periodKey = formatMonthYear(dividend.date)
    } else if (period === 'quarter') {
      periodKey = formatQuarter(dividend.date)
    } else {
      periodKey = formatYear(dividend.date)
    }

    const current = grouped.get(periodKey) || 0
    grouped.set(periodKey, current + dividend.net)
    runningTotal += dividend.net
    cumulative.set(periodKey, runningTotal)
  }

  // Convert to array and sort
  const result: ChartDataPoint[] = []
  const seen = new Set<string>()

  for (const dividend of sorted) {
    let periodKey: string
    if (period === 'month') {
      periodKey = formatMonthYear(dividend.date)
    } else if (period === 'quarter') {
      periodKey = formatQuarter(dividend.date)
    } else {
      periodKey = formatYear(dividend.date)
    }

    if (!seen.has(periodKey)) {
      seen.add(periodKey)
      result.push({
        period: periodKey,
        amount: grouped.get(periodKey) || 0,
        cumulative: cumulative.get(periodKey) || 0
      })
    }
  }

  return result
}

/**
 * Calculates year-over-year growth
 */
function calculateGrowthRate(byYear: Map<string, number>): YearComparison[] {
  const years = Array.from(byYear.keys()).sort()
  const comparisons: YearComparison[] = []

  for (let i = 0; i < years.length; i++) {
    const year = years[i]
    const total = byYear.get(year) || 0
    const comparison: YearComparison = { year, total }

    if (i > 0) {
      const previousYear = years[i - 1]
      const previousTotal = byYear.get(previousYear) || 0
      if (previousTotal > 0) {
        comparison.growth = ((total - previousTotal) / previousTotal) * 100
      }
    }

    comparisons.push(comparison)
  }

  return comparisons
}

/**
 * Renders children only when scrolled into view, triggering Recharts mount animations.
 * Accepts an optional minHeight so the placeholder matches the eventual content height
 * and avoids layout shift when the chart mounts.
 */
export function AnimateOnView ({
  children,
  className,
  minHeight
}: {
  children: React.ReactNode
  className?: string
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {isVisible ? children : <div style={minHeight ? { minHeight } : undefined} />}
    </motion.div>
  )
}

/**
 * Custom tooltip for charts
 */
function CustomTooltip({
  active,
  payload,
  baseCurrency
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey?: string }>
  baseCurrency: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-popover/90 backdrop-blur-md border border-border/50 rounded-lg shadow-xl shadow-black/10 px-4 py-2.5">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
          <p className="text-sm font-semibold text-foreground">
            {entry.dataKey === 'cumulative' ? 'Cumulative: ' : ''}
            {formatCurrency(entry.value, baseCurrency)}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Metric card component
 */
function MetricCard({
  label,
  value,
  subValue,
  className,
  valueClassName,
  rawValue,
  currency
}: {
  label: string
  value: string
  subValue?: string
  className?: string
  valueClassName?: string
  rawValue?: number
  currency?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={cn('relative overflow-hidden transition-all duration-300 border-border/50 hover:border-border hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col', `border-l-[3px]`, className)}>
        <CardContent className="p-5 flex flex-col h-full">
          <p className="metric-label text-muted-foreground flex-shrink-0">{label}</p>
          <p className={cn('metric-value text-foreground mt-1 flex-shrink-0', valueClassName)}>
            {rawValue !== undefined && currency ? (
              <AnimatedCurrency amount={rawValue} currency={currency} formatFn={formatCurrency} />
            ) : value}
          </p>
          {subValue ? (
            <p className="text-body-sm text-muted-foreground mt-1 flex-shrink-0">{subValue}</p>
          ) : (
            <div className="text-body-sm text-muted-foreground mt-1 flex-shrink-0 h-[20px]">&nbsp;</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface DividendsDashboardProps {
  transactions?: NormalizedTransaction[]
  className?: string
}

/**
 * Dividends Dashboard Component
 * Shows aggregated dividend data across all stocks
 */
export function DividendsDashboard ({
  transactions: transactionsProp,
  className
}: DividendsDashboardProps) {
  const storeTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const transactions = transactionsProp ?? storeTransactions
  const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month')
  const [sortField, setSortField] = useState<'dividends' | 'avgPayment' | 'payments'>('dividends')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Calculate global dividend metrics
  const globalData = useMemo(
    () => calculateGlobalDividendMetrics(transactions),
    [transactions]
  )

  // Calculate growth rate
  const yearComparisons = useMemo(
    () => calculateGrowthRate(globalData.byYear),
    [globalData.byYear]
  )

  // Prepare chart data
  const incomeOverTimeData = useMemo(
    () => groupDividendsByPeriod(globalData.dividends, 'month'),
    [globalData.dividends]
  )

  const trendData = useMemo(
    () => groupDividendsByPeriod(globalData.dividends, viewMode),
    [globalData.dividends, viewMode]
  )

  const baseCurrency = transactions[0]?.detectedBaseCurrency || 'USD'
  const hasDividends = globalData.dividends.length > 0

  // Sort stock dividends
  const sortedStockDividends = useMemo(() => {
    const stocks = Array.from(globalData.byStock.values())
    stocks.sort((a, b) => {
      let aValue: number
      let bValue: number

      if (sortField === 'dividends') {
        aValue = a.totalDividends
        bValue = b.totalDividends
      } else if (sortField === 'avgPayment') {
        aValue = a.paymentCount > 0 ? a.totalDividends / a.paymentCount : 0
        bValue = b.paymentCount > 0 ? b.totalDividends / b.paymentCount : 0
      } else {
        aValue = a.paymentCount
        bValue = b.paymentCount
      }

      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue
    })
    return stocks
  }, [globalData.byStock, sortField, sortDirection])

  const handleSort = (field: 'dividends' | 'avgPayment' | 'payments') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  if (!hasDividends) {
    return (
      <div className={cn('container mx-auto px-6 py-6', className)}>
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">No dividends received</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload transaction data to see dividend analytics
          </p>
        </Card>
      </div>
    )
  }

  const averagePerPayment = globalData.paymentCount > 0
    ? globalData.totalNet / globalData.paymentCount
    : 0

  return (
    <div className={cn('container mx-auto px-6 py-6 space-y-8', className)}>
      {/* Header */}
      <div>
        <h1 className="text-h2 text-foreground">Dividend Income Dashboard</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Comprehensive view of all dividend income across your portfolio
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        <MetricCard
          label="Total Dividends"
          value={formatCurrency(globalData.totalGross, baseCurrency)}
          rawValue={globalData.totalGross}
          currency={baseCurrency}
        />
        <MetricCard
          label="Withholding Tax"
          value={formatCurrency(globalData.totalTax, baseCurrency)}
          rawValue={globalData.totalTax}
          currency={baseCurrency}
          valueClassName="text-muted-foreground"
        />
        <MetricCard
          label="Net Dividends"
          value={formatCurrency(globalData.totalNet, baseCurrency)}
          rawValue={globalData.totalNet}
          currency={baseCurrency}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Total Payments"
          value={globalData.paymentCount.toString()}
        />
        <MetricCard
          label="Avg per Payment"
          value={formatCurrency(averagePerPayment, baseCurrency)}
          rawValue={averagePerPayment}
          currency={baseCurrency}
          subValue={`${globalData.paymentCount} payments`}
        />
      </div>

      {/* Total Income Over Time */}
      {incomeOverTimeData.length > 0 && (
        <AnimateOnView minHeight={450}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-normal">Total Dividend Income Over Time</CardTitle>
              <CardDescription className="text-sm">
                Cumulative dividend income by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeOverTimeData}>
                    <defs>
                      <linearGradient id="dividendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                      width={75}
                    />
                    <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
                    <Area
                      type="natural"
                      dataKey="cumulative"
                      stroke="hsl(var(--brand))"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#dividendGradient)"
                      dot={{ r: 3, fill: 'hsl(var(--brand))', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: 'hsl(var(--brand))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      animationBegin={100}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimateOnView>
      )}

      {/* Monthly/Quarterly Trends */}
      {trendData.length > 0 && (
        <AnimateOnView minHeight={400}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-normal">Dividend Trends</CardTitle>
                  <CardDescription className="text-sm">
                    {viewMode === 'month' ? 'Monthly' : 'Quarterly'} dividend income
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('month')
                      posthog.capture('dividend_view_mode_changed', { view_mode: 'month' })
                    }}
                    className="text-xs h-7"
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={viewMode === 'quarter' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setViewMode('quarter')
                      posthog.capture('dividend_view_mode_changed', { view_mode: 'quarter' })
                    }}
                    className="text-xs h-7"
                  >
                    Quarterly
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <defs>
                      <linearGradient id="barGradientTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                      width={75}
                    />
                    <Tooltip
                      content={<CustomTooltip baseCurrency={baseCurrency} />}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="url(#barGradientTrend)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
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

      {/* Year-over-Year Growth */}
      {yearComparisons.length > 1 && (
        <AnimateOnView minHeight={460}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-normal">Year-over-Year Growth</CardTitle>
              <CardDescription className="text-sm">
                Annual dividend income comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearComparisons}>
                    <defs>
                      <linearGradient id="barGradientYoY" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                      width={75}
                    />
                    <Tooltip
                      content={<CustomTooltip baseCurrency={baseCurrency} />}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                    />
                    <Bar
                      dataKey="total"
                      fill="url(#barGradientYoY)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                      animationDuration={800}
                      animationEasing="ease-out"
                      animationBegin={100}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            <div className="mt-4 space-y-2">
              {yearComparisons.map((comparison, index) => {
                if (index === 0) return null
                const isPositive = (comparison.growth || 0) >= 0
                return (
                  <div key={comparison.year} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{comparison.year}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">
                        {formatCurrency(comparison.total, baseCurrency)}
                      </span>
                      {comparison.growth !== undefined && (
                        <span className={cn(
                          'font-medium',
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {isPositive ? '+' : ''}{comparison.growth.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        </AnimateOnView>
      )}

      {/* Dividend Income by Stock */}
      {sortedStockDividends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal">Dividend Income by Stock</CardTitle>
            <CardDescription className="text-sm">
              All dividend-paying stocks in your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Stock</TableHead>
                    <TableHead className="text-xs">Company</TableHead>
                    <TableHead className="text-xs text-right">
                      <button
                        onClick={() => handleSort('dividends')}
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors underline-offset-2 hover:underline"
                      >
                        Total Dividends
                        <span className="text-[10px]">{sortField === 'dividends' ? (sortDirection === 'desc' ? '\u2193' : '\u2191') : '\u2195'}</span>
                      </button>
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      <button
                        onClick={() => handleSort('payments')}
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors underline-offset-2 hover:underline"
                      >
                        Payments
                        <span className="text-[10px]">{sortField === 'payments' ? (sortDirection === 'desc' ? '\u2193' : '\u2191') : '\u2195'}</span>
                      </button>
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      <button
                        onClick={() => handleSort('avgPayment')}
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors underline-offset-2 hover:underline"
                      >
                        Avg/Payment
                        <span className="text-[10px]">{sortField === 'avgPayment' ? (sortDirection === 'desc' ? '\u2193' : '\u2191') : '\u2195'}</span>
                      </button>
                    </TableHead>
                    <TableHead className="text-xs text-right">Last Div/Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStockDividends.map((stock) => {
                    const avgPerPayment = stock.paymentCount > 0
                      ? stock.totalDividends / stock.paymentCount
                      : 0
                    return (
                      <TableRow key={stock.ticker}>
                        <TableCell className="text-xs font-medium">{stock.ticker}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {stock.name}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(stock.totalDividends, baseCurrency)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {stock.paymentCount}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatCurrency(avgPerPayment, baseCurrency)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {stock.lastDividendPerShare
                            ? `${getCurrencySymbol(stock.lastDividendPerShare.currency)}${stock.lastDividendPerShare.amount.toFixed(4)}/share`
                            : '\u2014'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
