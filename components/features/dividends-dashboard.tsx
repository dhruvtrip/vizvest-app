'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import posthog from 'posthog-js'
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
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import groupBy from 'lodash/groupBy'
import { isDividendAction } from '@/lib/transaction-utils'
import {
  AreaTrend,
  BarRows,
  ChartCard,
  ColumnPlot,
  KpiTile,
  StackedMeter,
  type BarRow,
  type ColumnDatum
} from '@/components/charts'
import { SlidingTabs } from '@/components/motion'
import { DashboardPage, PageHeader, Region, chartGrid, kpiGridFive } from '@/components/features/dashboard-layout'
import { ArrowDown, ArrowUp, ArrowUpDown, HandCoins } from '@/components/icons'

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
  const value = taxAmount || 0
  const rate = exchangeRate || 1
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

/**
 * Renders children only when scrolled into view, fading them in once. Kept as an export
 * for callers outside this file; the charts on this page animate themselves.
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
 * Short currency figure for chart labels: "€1.2K", "€85", "€8.7"
 */
function formatCompactCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: abs > 0 && abs < 10 ? 1 : 0
  }).format(abs)
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`
}

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)}%`
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const PAGE_SIZE = 15

type SortField = 'dividends' | 'avgPayment' | 'payments'

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
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [page, setPage] = useState(1)

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

  const handleViewModeChange = (mode: 'month' | 'quarter') => {
    if (mode === 'month') {
      setViewMode('month')
      posthog.capture('dividend_view_mode_changed', { view_mode: 'month' })
    } else {
      setViewMode('quarter')
      posthog.capture('dividend_view_mode_changed', { view_mode: 'quarter' })
    }
  }

  // ---- Display data derived from what is computed above ----

  const cumulativeSeries = useMemo(
    () =>
      incomeOverTimeData.map((point) => ({
        id: point.period,
        label: point.period,
        value: point.cumulative || 0,
        display: formatCurrency(point.cumulative || 0, baseCurrency)
      })),
    [incomeOverTimeData, baseCurrency]
  )

  // Number of payments in each month or quarter, for the column tooltips.
  const paymentsPerPeriod = useMemo(() => {
    const counts = new Map<string, number>()
    for (const dividend of globalData.dividends) {
      const key = viewMode === 'month' ? formatMonthYear(dividend.date) : formatQuarter(dividend.date)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return counts
  }, [globalData.dividends, viewMode])

  const periodColumns: ColumnDatum[] = useMemo(
    () =>
      trendData.map((point) => {
        const count = paymentsPerPeriod.get(point.period) || 0
        return {
          id: point.period,
          label: point.period,
          value: point.amount,
          display: formatCurrency(point.amount, baseCurrency),
          note: `${count} ${count === 1 ? 'payment' : 'payments'}`
        }
      }),
    [trendData, paymentsPerPeriod, baseCurrency]
  )

  const periodMedian = useMemo(() => median(trendData.map((point) => point.amount)), [trendData])

  const bestPeriod = useMemo(
    () => trendData.reduce<ChartDataPoint | null>((best, point) => (!best || point.amount > best.amount ? point : best), null),
    [trendData]
  )

  const paymentsPerYear = useMemo(() => {
    const counts = new Map<string, number>()
    for (const dividend of globalData.dividends) {
      const key = formatYear(dividend.date)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return counts
  }, [globalData.dividends])

  const yearRows: BarRow[] = useMemo(
    () =>
      yearComparisons.map((comparison) => {
        const count = paymentsPerYear.get(comparison.year) || 0
        const growth = comparison.growth
        return {
          id: comparison.year,
          label: comparison.year,
          note: `${count} ${count === 1 ? 'payment' : 'payments'}`,
          value: comparison.total,
          display: formatCurrency(comparison.total, baseCurrency),
          delta:
            growth !== undefined
              ? {
                  display: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
                  tone: growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'
                }
              : undefined
        }
      }),
    [yearComparisons, paymentsPerYear, baseCurrency]
  )

  const lastPaymentDate = useMemo(
    () =>
      globalData.dividends.reduce<string>(
        (latest, d) => (!latest || new Date(d.date).getTime() > new Date(latest).getTime() ? d.date : latest),
        ''
      ),
    [globalData.dividends]
  )

  // Gross, tax, net and last payment per stock, for the inline detail.
  const stockTotals = useMemo(() => {
    const totals = new Map<string, { gross: number; tax: number; net: number; lastDate: string }>()
    for (const dividend of globalData.dividends) {
      const current = totals.get(dividend.ticker) ?? { gross: 0, tax: 0, net: 0, lastDate: '' }
      current.gross += dividend.gross
      current.tax += dividend.tax
      current.net += dividend.net
      if (!current.lastDate || new Date(dividend.date).getTime() > new Date(current.lastDate).getTime()) {
        current.lastDate = dividend.date
      }
      totals.set(dividend.ticker, current)
    }
    return totals
  }, [globalData.dividends])

  const stockRows: BarRow[] = useMemo(
    () =>
      Array.from(globalData.byStock.values())
        .sort((a, b) => b.totalDividends - a.totalDividends)
        .map((stock) => ({
          id: stock.ticker,
          label: stock.ticker,
          note: stock.name,
          value: stock.totalDividends,
          display: formatCurrency(stock.totalDividends, baseCurrency),
          delta: {
            display: formatPercent(globalData.totalNet > 0 ? (stock.totalDividends / globalData.totalNet) * 100 : 0),
            tone: 'neutral' as const
          }
        })),
    [globalData.byStock, globalData.totalNet, baseCurrency]
  )

  const totalPages = Math.max(1, Math.ceil(sortedStockDividends.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedStockDividends = sortedStockDividends.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (!hasDividends) {
    return (
      <DashboardPage className={className}>
        <PageHeader title="Dividends" description="Dividend income from the stocks in your file." />
        <Tile className="flex flex-col items-center px-6 py-14 text-center">
          <HandCoins size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">No dividends in this file</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
            None of the transactions are dividend payments. Upload an export that covers a period when your
            holdings paid out to see your income here.
          </p>
        </Tile>
      </DashboardPage>
    )
  }

  const averagePerPayment = globalData.paymentCount > 0
    ? globalData.totalNet / globalData.paymentCount
    : 0

  const taxShare = globalData.totalGross > 0 ? (globalData.totalTax / globalData.totalGross) * 100 : 0
  const stockCount = globalData.byStock.size
  const periodWord = viewMode === 'month' ? 'month' : 'quarter'
  const meterTitle = baseCurrency.toUpperCase() === 'EUR' ? 'Where each euro went' : 'Net income and tax'

  const sortLabel: Record<SortField, string> = {
    dividends: 'total dividends',
    payments: 'payments',
    avgPayment: 'average per payment'
  }

  const sortHeader = (field: SortField, label: string) => {
    const active = sortField === field
    const Icon = active ? (sortDirection === 'desc' ? ArrowDown : ArrowUp) : ArrowUpDown
    return (
      <button
        type="button"
        onClick={() => {
          handleSort(field)
          setPage(1)
        }}
        className={cn(
          'ml-auto inline-flex h-9 items-center gap-1 rounded-md font-medium transition-colors duration-150 ease-ui hover:text-foreground',
          active && 'text-foreground'
        )}
      >
        {label}
        <Icon size={14} className={cn(!active && 'text-muted-foreground')} />
      </button>
    )
  }

  const ariaSort = (field: SortField) =>
    sortField === field ? (sortDirection === 'desc' ? 'descending' : 'ascending') : undefined

  return (
    <DashboardPage className={className}>
      <PageHeader
        title="Dividends"
        description={`Every dividend payment in your file, in ${baseCurrency}.`}
      />

      {/* Summary */}
      <Region label="Summary" id="dividends-summary">
        <div className={kpiGridFive}>
          <KpiTile
            label="Gross dividends"
            value={<AnimatedCurrency amount={globalData.totalGross} currency={baseCurrency} formatFn={formatCurrency} />}
            sub="Before withholding tax"
            hint="What the companies paid out: the net amount you received plus the tax withheld at source."
          />
          <KpiTile
            label="Withholding tax"
            value={<AnimatedCurrency amount={globalData.totalTax} currency={baseCurrency} formatFn={formatCurrency} />}
            sub={`${formatPercent(taxShare)} of gross`}
            hint="Tax taken at source before the payment reached your account, converted at each payment's exchange rate."
          />
          <KpiTile
            label="Net dividends"
            tone="up"
            value={
              <AnimatedCurrency
                amount={globalData.totalNet}
                currency={baseCurrency}
                formatFn={(amount, currency) => `+${formatCurrency(amount, currency)}`}
              />
            }
            sub="Paid into your account"
          />
          <KpiTile
            label="Payments"
            value={<AnimatedCount value={globalData.paymentCount} />}
            sub={`From ${stockCount} ${stockCount === 1 ? 'stock' : 'stocks'}`}
          />
          <KpiTile
            label="Average per payment"
            value={<AnimatedCurrency amount={averagePerPayment} currency={baseCurrency} formatFn={formatCurrency} />}
            sub={`Net, across ${globalData.paymentCount} payments`}
          />
        </div>
      </Region>

      {/* Income */}
      <Region label="Income" id="dividends-income">
        <div className={chartGrid}>
          <ChartCard
            title="Income over time"
            color={4}
            note={`${formatCurrency(globalData.totalNet, baseCurrency)} net`}
            footnote="Net dividends added up month by month."
          >
            <AreaTrend
              data={cumulativeSeries}
              color={4}
              height={168}
              yLabels
              formatTick={(value) => formatCompactCurrency(value, baseCurrency)}
              aria-label="Cumulative net dividend income by month"
            />
          </ChartCard>

          <ChartCard
            title="Dividends by period"
            color={2}
            action={
              <SlidingTabs
                variant="segmented"
                size="sm"
                surface="tile"
                aria-label="Group dividends by"
                value={viewMode}
                onValueChange={handleViewModeChange}
                items={[
                  { value: 'month', label: 'Monthly' },
                  { value: 'quarter', label: 'Quarterly' }
                ]}
              />
            }
            footnote={
              bestPeriod
                ? `Best ${periodWord}: ${bestPeriod.period}, ${formatCurrency(bestPeriod.amount, baseCurrency)}. Dashed line: the median ${periodWord}, ${formatCurrency(periodMedian, baseCurrency)}.`
                : undefined
            }
          >
            <ColumnPlot
              data={periodColumns}
              color={2}
              height={168}
              reference={{ value: periodMedian, label: `median ${formatCompactCurrency(periodMedian, baseCurrency)}` }}
              emphasize={(d) => d.id === bestPeriod?.period}
              aria-label={`Net dividends by ${periodWord}`}
            />
          </ChartCard>
        </div>
      </Region>

      {/* Tax and growth */}
      <Region label="Tax and growth" id="dividends-tax-growth">
        <div className={chartGrid}>
          <ChartCard
            title={meterTitle}
            footnote="Withholding tax is taken at source, before a payment reaches your account."
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="figure-kpi whitespace-nowrap">{formatCurrency(globalData.totalGross, baseCurrency)}</span>
              <span className="text-xs font-normal text-muted-foreground">
                gross, {formatPercent(taxShare)} withheld
              </span>
            </div>
            <StackedMeter
              className="mt-4"
              aria-label={`Gross dividends split into net income and withholding tax`}
              segments={[
                {
                  id: 'net',
                  label: 'Net received',
                  value: globalData.totalNet,
                  display: formatCurrency(globalData.totalNet, baseCurrency),
                  color: 2
                },
                {
                  id: 'tax',
                  label: 'Tax withheld',
                  value: globalData.totalTax,
                  display: formatCurrency(globalData.totalTax, baseCurrency),
                  color: 5
                }
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Year over year"
            color={2}
            footnote={
              yearRows.length > 1
                ? `Change against the previous calendar year. ${yearRows[yearRows.length - 1].label} counts payments up to ${formatDate(lastPaymentDate)}.`
                : 'Growth shows once your file covers a second calendar year.'
            }
          >
            <BarRows rows={yearRows} color={2} labelWidth={96} aria-label="Net dividends by calendar year" />
          </ChartCard>
        </div>
      </Region>

      {/* By stock */}
      <Region label="By stock" id="dividends-by-stock">
        <div className="space-y-3">
          <ChartCard
            title="Income by stock"
            color={2}
            note={`${stockCount} ${stockCount === 1 ? 'stock' : 'stocks'}`}
            footnote="Share of your net dividends on the right. Select a stock for its payments."
          >
            <BarRows
              rows={stockRows}
              color={2}
              emphasis="max"
              maxRows={10}
              labelWidth={140}
              selectedId={selectedStock}
              onSelect={(id) => setSelectedStock((current) => (current === id ? null : id))}
              aria-label="Net dividends by stock"
              renderDetail={(row) => {
                const stock = globalData.byStock.get(row.id)
                const totals = stockTotals.get(row.id)
                if (!stock || !totals) return null
                const items: Array<[string, string]> = [
                  ['Payments', String(stock.paymentCount)],
                  ['Gross', formatCurrency(totals.gross, baseCurrency)],
                  ['Tax withheld', formatCurrency(totals.tax, baseCurrency)],
                  ['Net', formatCurrency(totals.net, baseCurrency)],
                  [
                    'Average per payment',
                    formatCurrency(stock.paymentCount > 0 ? stock.totalDividends / stock.paymentCount : 0, baseCurrency)
                  ],
                  ['Last payment', totals.lastDate ? formatDate(totals.lastDate) : '—'],
                  [
                    'Last per share',
                    stock.lastDividendPerShare
                      ? `${getCurrencySymbol(stock.lastDividendPerShare.currency)}${stock.lastDividendPerShare.amount.toFixed(4)}`
                      : '—'
                  ]
                ]
                return (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-background p-3 sm:grid-cols-4">
                    {items.map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="truncate text-xs font-normal text-muted-foreground">{label}</dt>
                        <dd className="figure mt-0.5 whitespace-nowrap text-sm font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )
              }}
            />
          </ChartCard>

          <Tile size="flush" className="overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-2 pt-4 sm:px-5">
              <h3 className="text-sm font-medium leading-5">All dividend payers</h3>
              <TileNote>
                Sorted by {sortLabel[sortField]}, {sortDirection === 'desc' ? 'highest' : 'lowest'} first
              </TileNote>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="ps-4 sm:ps-5">Stock</TableHead>
                  <TableHead scope="col" className="hidden sm:table-cell">Company</TableHead>
                  <TableHead scope="col" className="text-right" aria-sort={ariaSort('dividends')}>
                    {sortHeader('dividends', 'Total')}
                  </TableHead>
                  <TableHead scope="col" className="text-right" aria-sort={ariaSort('payments')}>
                    {sortHeader('payments', 'Payments')}
                  </TableHead>
                  <TableHead scope="col" className="hidden text-right sm:table-cell" aria-sort={ariaSort('avgPayment')}>
                    {sortHeader('avgPayment', 'Per payment')}
                  </TableHead>
                  <TableHead scope="col" className="hidden pe-4 text-right sm:pe-5 md:table-cell">Last per share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedStockDividends.map((stock) => {
                  const avgPerPayment = stock.paymentCount > 0
                    ? stock.totalDividends / stock.paymentCount
                    : 0
                  return (
                    <TableRow key={stock.ticker}>
                      <TableCell className="ps-4 sm:ps-5">
                        <span className="ticker">{stock.ticker}</span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        <span className="block max-w-[14rem] truncate" title={stock.name}>{stock.name}</span>
                      </TableCell>
                      <TableCell className="figure whitespace-nowrap text-right">
                        {formatCurrency(stock.totalDividends, baseCurrency)}
                      </TableCell>
                      <TableCell className="figure whitespace-nowrap text-right">
                        {stock.paymentCount}
                      </TableCell>
                      <TableCell className="figure hidden whitespace-nowrap text-right sm:table-cell">
                        {formatCurrency(avgPerPayment, baseCurrency)}
                      </TableCell>
                      <TableCell className="figure hidden whitespace-nowrap pe-4 text-right text-muted-foreground sm:pe-5 md:table-cell">
                        {stock.lastDividendPerShare
                          ? `${getCurrencySymbol(stock.lastDividendPerShare.currency)}${stock.lastDividendPerShare.amount.toFixed(4)}/share`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 sm:px-5">
                <TileNote className="figure">
                  {(currentPage - 1) * PAGE_SIZE + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, sortedStockDividends.length)} of{' '}
                  {sortedStockDividends.length}
                </TileNote>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </Tile>
        </div>
      </Region>
    </DashboardPage>
  )
}
