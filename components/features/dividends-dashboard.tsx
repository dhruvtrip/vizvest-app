'use client'

import { useId, useMemo, useState } from 'react'
import posthog from 'posthog-js'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { AnimatedCount, AnimatedCurrency } from '@/components/ui/animated-number'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { BlurReveal } from '@/components/motion/blur-reveal'
import { MetricCell, MetricGrid } from '@/components/features/metric-cell'
import { CHART, ChartTooltip } from '@/components/features/chart-tooltip'
import {
  AXIS_X,
  AXIS_Y,
  CHART_ANIMATION,
  CHART_MARGIN,
  ChartCell,
  ChartFooter,
  ChartFooterStat,
  EmptyCell,
  SectionHeader,
  Segmented,
  SortButton,
  TableFrame,
  ViewHeader,
  formatAxisCurrency
} from '@/components/features/analysis-kit'
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
import groupBy from 'lodash/groupBy'
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
  const stockGroups = groupBy(dividends, 'ticker')
  
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

type TrendMode = 'month' | 'quarter'
type SortField = 'dividends' | 'avgPayment' | 'payments'

/**
 * Growth figure for one year: signed percentage with a direction icon,
 * coloured by polarity.
 */
function GrowthFigure({ growth }: { growth: number }) {
  const isPositive = growth >= 0
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-0.5', isPositive ? 'text-positive' : 'text-negative')}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
      {isPositive ? '+' : ''}{growth.toFixed(1)}%
      <span className="sr-only">{isPositive ? 'increase' : 'decrease'} on the previous year</span>
    </span>
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
  const [viewMode, setViewMode] = useState<TrendMode>('month')
  const [sortField, setSortField] = useState<SortField>('dividends')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  // Bars animate once on first view; switching Monthly/Quarterly swaps instantly
  const [trendAnimated, setTrendAnimated] = useState(true)
  const gradientId = `dividend-area-${useId().replace(/:/g, '')}`

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
  const symbol = getCurrencySymbol(baseCurrency)
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleViewMode = (mode: TrendMode) => {
    if (mode === viewMode) return
    setTrendAnimated(false)
    setViewMode(mode)
    posthog.capture('dividend_view_mode_changed', { view_mode: mode })
  }

  if (!hasDividends) {
    return (
      <div className={cn('min-w-0', className)}>
        <ViewHeader title="Dividend income" description="All dividend income across your portfolio" />
        <EmptyCell
          title="No dividends received"
          description="Upload transaction data to see dividend analytics"
        />
      </div>
    )
  }

  const averagePerPayment = globalData.paymentCount > 0
    ? globalData.totalNet / globalData.paymentCount
    : 0

  const firstPeriod = incomeOverTimeData[0]?.period
  const lastPeriod = incomeOverTimeData[incomeOverTimeData.length - 1]?.period
  const trendLabel = viewMode === 'month' ? 'month' : 'quarter'
  const bestTrend = trendData.reduce<ChartDataPoint | null>(
    (best, point) => (!best || point.amount > best.amount ? point : best),
    null
  )
  const averageTrend = trendData.length > 0
    ? trendData.reduce((sum, point) => sum + point.amount, 0) / trendData.length
    : 0
  const showGrowth = yearComparisons.length > 1

  const sortAria = (field: SortField) =>
    sortField === field ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none'

  return (
    <div className={cn('min-w-0', className)}>
      <BlurReveal immediate>
        <ViewHeader
          title="Dividend income"
          description="All dividend income across your portfolio, net of withholding tax"
        />
      </BlurReveal>

      <div className="space-y-10 md:space-y-12">
        {/* Summary metrics */}
        <BlurReveal immediate delay={0.1}>
          <MetricGrid columns={5}>
            <MetricCell
              label="Total dividends"
              value={<AnimatedCurrency amount={globalData.totalGross} currency={baseCurrency} formatFn={formatCurrency} />}
              sub="Before tax"
            />
            <MetricCell
              label="Withholding tax"
              value={<AnimatedCurrency amount={globalData.totalTax} currency={baseCurrency} formatFn={formatCurrency} />}
              tone="muted"
              sub="In base currency"
            />
            <MetricCell
              label="Net dividends"
              value={<AnimatedCurrency amount={globalData.totalNet} currency={baseCurrency} formatFn={formatCurrency} />}
              tone="positive"
              sub="Received"
            />
            <MetricCell
              label="Total payments"
              value={<AnimatedCount value={globalData.paymentCount} />}
              sub={`From ${globalData.byStock.size} ${globalData.byStock.size === 1 ? 'stock' : 'stocks'}`}
            />
            <MetricCell
              label="Avg per payment"
              value={<AnimatedCurrency amount={averagePerPayment} currency={baseCurrency} formatFn={formatCurrency} />}
              sub={`${globalData.paymentCount} payments`}
              className="col-span-2 xl:col-span-1"
            />
          </MetricGrid>
        </BlurReveal>

        {/* Charts */}
        <section aria-labelledby="dividend-charts-heading">
          <SectionHeader
            id="dividend-charts-heading"
            title="Income over time"
            meta={firstPeriod && lastPeriod ? `${firstPeriod} – ${lastPeriod}` : undefined}
          />
          <BlurReveal soft>
            <div className="cell-grid grid-cols-1 lg:grid-cols-2">
              {incomeOverTimeData.length > 0 && (
                <ChartCell
                  className="lg:col-span-2"
                  title="Total dividend income"
                  sub="Cumulative net income by month"
                  height={288}
                  label={`Area chart of cumulative dividend income by month, reaching ${formatCurrency(globalData.totalNet, baseCurrency)}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={incomeOverTimeData} margin={CHART_MARGIN}>
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART.ink} stopOpacity={0.16} />
                          <stop offset="100%" stopColor={CHART.ink} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...CHART.grid} />
                      <XAxis dataKey="period" {...AXIS_X} />
                      <YAxis
                        {...AXIS_Y}
                        tickFormatter={(value: number) => formatAxisCurrency(value, symbol)}
                      />
                      <Tooltip
                        cursor={CHART.cursorLine}
                        animationDuration={150}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const point = payload[0].payload as ChartDataPoint
                          return (
                            <ChartTooltip
                              title={label}
                              rows={[
                                { name: 'Cumulative', value: formatCurrency(point.cumulative ?? 0, baseCurrency), color: CHART.ink },
                                { name: 'This month', value: formatCurrency(point.amount, baseCurrency) }
                              ]}
                            />
                          )
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke={CHART.ink}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        fill={`url(#${gradientId})`}
                        dot={false}
                        activeDot={{ r: 4, fill: CHART.ink, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                        {...CHART_ANIMATION}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCell>
              )}

              {trendData.length > 0 && (
                <ChartCell
                  className={cn(!showGrowth && 'lg:col-span-2')}
                  title="Dividend trends"
                  sub={`${viewMode === 'month' ? 'Monthly' : 'Quarterly'} net income`}
                  height={240}
                  label={`Bar chart of ${viewMode === 'month' ? 'monthly' : 'quarterly'} dividend income`}
                  action={
                    <Segmented
                      label="Dividend trend period"
                      value={viewMode}
                      onChange={handleViewMode}
                      options={[
                        { value: 'month', label: 'Monthly' },
                        { value: 'quarter', label: 'Quarterly' }
                      ]}
                    />
                  }
                  footer={
                    <ChartFooter>
                      {bestTrend && (
                        <ChartFooterStat label={`Best ${trendLabel}`}>
                          {formatCurrency(bestTrend.amount, baseCurrency)}
                          <span className="text-fg-secondary">{bestTrend.period}</span>
                        </ChartFooterStat>
                      )}
                      <ChartFooterStat label={`Average per ${trendLabel}`}>
                        {formatCurrency(averageTrend, baseCurrency)}
                      </ChartFooterStat>
                    </ChartFooter>
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={CHART_MARGIN}>
                      <CartesianGrid {...CHART.grid} />
                      <XAxis dataKey="period" {...AXIS_X} />
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
                        isAnimationActive={trendAnimated}
                        {...CHART_ANIMATION}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCell>
              )}

              {showGrowth && (
                <ChartCell
                  title="Year-over-year growth"
                  sub="Annual net income comparison"
                  height={240}
                  label="Bar chart of annual dividend income"
                  footer={
                    <ChartFooter>
                      {yearComparisons.map((comparison, index) => {
                        if (index === 0) return null
                        return (
                          <ChartFooterStat key={comparison.year} label={comparison.year}>
                            {formatCurrency(comparison.total, baseCurrency)}
                            {comparison.growth !== undefined && <GrowthFigure growth={comparison.growth} />}
                          </ChartFooterStat>
                        )
                      })}
                    </ChartFooter>
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearComparisons} margin={CHART_MARGIN}>
                      <CartesianGrid {...CHART.grid} />
                      <XAxis dataKey="year" {...AXIS_X} />
                      <YAxis
                        {...AXIS_Y}
                        tickFormatter={(value: number) => formatAxisCurrency(value, symbol)}
                      />
                      <Tooltip
                        cursor={CHART.cursorBar}
                        animationDuration={150}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const point = payload[0].payload as YearComparison
                          return (
                            <ChartTooltip
                              title={label}
                              rows={[
                                { name: 'Net income', value: formatCurrency(point.total, baseCurrency), color: CHART.ink },
                                ...(point.growth !== undefined
                                  ? [{ name: 'vs previous year', value: `${point.growth >= 0 ? '+' : ''}${point.growth.toFixed(1)}%` }]
                                  : [])
                              ]}
                            />
                          )
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill={CHART.ink}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                        {...CHART_ANIMATION}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCell>
              )}
            </div>
          </BlurReveal>
        </section>

        {/* Dividend income by stock */}
        {sortedStockDividends.length > 0 && (
          <section aria-labelledby="dividend-stocks-heading">
            <SectionHeader
              id="dividend-stocks-heading"
              title="Income by stock"
              meta={`${sortedStockDividends.length} dividend-paying ${sortedStockDividends.length === 1 ? 'stock' : 'stocks'}`}
            />
            <BlurReveal soft>
              <TableFrame>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead scope="col">Stock</TableHead>
                      <TableHead scope="col">Company</TableHead>
                      <TableHead scope="col" className="text-right" aria-sort={sortAria('dividends')}>
                        <SortButton
                          label="Total dividends"
                          active={sortField === 'dividends'}
                          direction={sortDirection}
                          onClick={() => handleSort('dividends')}
                        />
                      </TableHead>
                      <TableHead scope="col" className="text-right" aria-sort={sortAria('payments')}>
                        <SortButton
                          label="Payments"
                          active={sortField === 'payments'}
                          direction={sortDirection}
                          onClick={() => handleSort('payments')}
                        />
                      </TableHead>
                      <TableHead scope="col" className="text-right" aria-sort={sortAria('avgPayment')}>
                        <SortButton
                          label="Avg / payment"
                          active={sortField === 'avgPayment'}
                          direction={sortDirection}
                          onClick={() => handleSort('avgPayment')}
                        />
                      </TableHead>
                      <TableHead scope="col" className="text-right">Last div / share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStockDividends.map((stock) => {
                      const avgPerPayment = stock.paymentCount > 0
                        ? stock.totalDividends / stock.paymentCount
                        : 0
                      return (
                        <TableRow key={stock.ticker}>
                          <TableCell className="text-foreground">{stock.ticker}</TableCell>
                          <TableCell className="max-w-[260px] truncate text-fg-secondary">
                            {stock.name}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {formatCurrency(stock.totalDividends, baseCurrency)}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {stock.paymentCount}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {formatCurrency(avgPerPayment, baseCurrency)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-fg-secondary">
                            {stock.lastDividendPerShare
                              ? `${getCurrencySymbol(stock.lastDividendPerShare.currency)}${stock.lastDividendPerShare.amount.toFixed(4)}`
                              : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableFrame>
            </BlurReveal>
          </section>
        )}
      </div>
    </div>
  )
}
