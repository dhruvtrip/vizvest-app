'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { TradingHeatmap } from '@/components/ui/trading-heatmap'
import { TradingStatsBento } from '@/components/features/trading-stats-bento'
import { Pagination } from '@/components/ui/pagination'
import { isTradeAction, isBuyAction } from '@/lib/transaction-utils'
import { Tile, TileNote, TileTitle } from '@/components/ui/tile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight, CalendarDays } from '@/components/icons'
import { BarRows, ChartCard, KpiTile, Legend, StackedColumns, type BarRow } from '@/components/charts'
import { NumberChange, Reveal, SlidingTabs, TextSwap, useReducedMotionSafe } from '@/components/motion'
import {
  DashboardPage,
  PageHeader,
  Region,
  chartGrid,
  kpiGrid
} from '@/components/features/dashboard-layout'

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
 * Formats a date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * Formats shares number
 */
function formatShares(shares: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(shares)
}

/**
 * Extracts year from date string
 */
function getYear(dateString: string): number {
  return new Date(dateString).getFullYear()
}

interface TradingMetrics {
  totalTransactions: number
  buyCount: number
  sellCount: number
  totalBuyVolume: number
  totalSellVolume: number
  netCashFlow: number
  realizedPnL: number
  profitableTrades: number
  losingTrades: number
  winRate: number
  averageTransactionSize: number
  mostTradedStock: {
    ticker: string
    name: string
    count: number
  } | null
  baseCurrency: string
}

/**
 * Calculates trading metrics from transactions
 */
function calculateTradingMetrics(
  transactions: NormalizedTransaction[]
): TradingMetrics {
  const baseCurrency = transactions[0]?.detectedBaseCurrency || 'USD'

  // Filter to only buy/sell trades (Market and Limit orders)
  const trades = transactions.filter((t) => isTradeAction(t.Action))

  if (trades.length === 0) {
    return {
      totalTransactions: 0,
      buyCount: 0,
      sellCount: 0,
      totalBuyVolume: 0,
      totalSellVolume: 0,
      netCashFlow: 0,
      realizedPnL: 0,
      profitableTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageTransactionSize: 0,
      mostTradedStock: null,
      baseCurrency
    }
  }

  let buyCount = 0
  let sellCount = 0
  let totalBuyVolume = 0
  let totalSellVolume = 0
  let realizedPnL = 0
  let profitableTrades = 0
  let losingTrades = 0
  const stockCounts = new Map<string, { name: string; count: number }>()

  for (const trade of trades) {
    const isBuy = isBuyAction(trade.Action)
    const volume = Math.abs(trade.totalInBaseCurrency || 0)

    if (isBuy) {
      buyCount++
      totalBuyVolume += volume
    } else {
      sellCount++
      totalSellVolume += volume
      
      // Track realized P&L from CSV Result column
      const result = trade.Result || 0
      realizedPnL += result
      
      // Track win/loss statistics
      if (result > 0) {
        profitableTrades++
      } else if (result < 0) {
        losingTrades++
      }
    }

    // Track most traded stock
    if (trade.Ticker) {
      const existing = stockCounts.get(trade.Ticker)
      if (existing) {
        existing.count++
      } else {
        stockCounts.set(trade.Ticker, {
          name: trade.Name || trade.Ticker,
          count: 1
        })
      }
    }
  }

  const totalTransactions = buyCount + sellCount
  const netCashFlow = totalBuyVolume - totalSellVolume
  const winRate = sellCount > 0 ? (profitableTrades / sellCount) * 100 : 0
  const averageTransactionSize = totalTransactions > 0
    ? (totalBuyVolume + totalSellVolume) / totalTransactions
    : 0

  // Find most traded stock
  let mostTradedStock: { ticker: string; name: string; count: number } | null = null
  for (const [ticker, data] of stockCounts.entries()) {
    if (!mostTradedStock || data.count > mostTradedStock.count) {
      mostTradedStock = {
        ticker,
        name: data.name,
        count: data.count
      }
    }
  }

  return {
    totalTransactions,
    buyCount,
    sellCount,
    totalBuyVolume,
    totalSellVolume,
    netCashFlow,
    realizedPnL,
    profitableTrades,
    losingTrades,
    winRate,
    averageTransactionSize,
    mostTradedStock,
    baseCurrency
  }
}

/**
 * Signed money: "+" for gains, formatCurrency's "-" for losses.
 */
function formatSignedCurrency(amount: number, currency: string): string {
  return `${amount > 0 ? '+' : ''}${formatCurrency(amount, currency)}`
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
/** Monday first; weekend days only appear when they have trades. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const monthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

/**
 * Money figure for a KPI tile: counts up on load and rolls to the new value
 * when the year filter changes. Under reduced motion the changed digits
 * cross-fade in place instead.
 */
function MoneyFigure({ amount, currency, signed = false }: { amount: number; currency: string; signed?: boolean }) {
  const reduced = useReducedMotionSafe()
  const format = signed ? formatSignedCurrency : formatCurrency
  if (reduced) return <NumberChange value={format(amount, currency)} />
  return <AnimatedCurrency amount={amount} currency={currency} formatFn={format} className="figure" />
}

/** Count figure for a KPI tile, with the same motion rules as MoneyFigure. */
function CountFigure({ value }: { value: number }) {
  const reduced = useReducedMotionSafe()
  if (reduced) return <NumberChange value={String(value)} />
  return <AnimatedCount value={value} className="figure" />
}

/** Buy / Sell tag. The full order type (Limit buy, Stop sell) stays in the title and for screen readers. */
function ActionBadge({ action }: { action: string }) {
  const isBuy = isBuyAction(action)
  return (
    <Badge variant={isBuy ? 'up' : 'down'} title={action} className="font-normal">
      <span aria-hidden="true">{isBuy ? 'Buy' : 'Sell'}</span>
      <span className="sr-only">{action}</span>
    </Badge>
  )
}

/** Designed empty state: icon, one plain sentence, a next step when there is one. */
function EmptyActivity({
  icon,
  title,
  body,
  action
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <Tile size="lg" className="flex flex-col items-center px-6 py-12 text-center sm:py-16">
      <span className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground">
        {icon}
      </span>
      <h2 className="mt-4 text-base font-medium">{title}</h2>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Tile>
  )
}

interface TradingActivityDashboardProps {
  transactions?: NormalizedTransaction[]
  className?: string
}

/**
 * Trading Activity Dashboard Component
 * Shows trading metrics, heatmap, and transaction table
 */
export function TradingActivityDashboard ({
  transactions: transactionsProp,
  className
}: TradingActivityDashboardProps) {
  const storeTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const transactions = transactionsProp ?? storeTransactions
  const allTrades = useMemo(() => {
    return transactions.filter((t) => isTradeAction(t.Action))
  }, [transactions])

  // Extract available years from trades
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    for (const trade of allTrades) {
      const year = getYear(trade.Time)
      if (!isNaN(year)) {
        years.add(year)
      }
    }
    return Array.from(years).sort((a, b) => b - a) // Most recent first
  }, [allTrades])

  // Year filter state (multi-select) - default to all years
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set<number>())

  // Sync selectedYears when availableYears changes - default to all years
  useEffect(() => {
    if (availableYears.length > 0) {
      setSelectedYears((prev) => {
        // If current selection is empty or doesn't include all available years, update to all years
        const hasAllYears = availableYears.every(year => prev.has(year))
        if (prev.size === 0 || !hasAllYears) {
          return new Set(availableYears)
        }
        return prev
      })
    }
  }, [availableYears])

  // Year filter: one segmented control, "All" or a single year. It drives
  // selectedYears, so every figure, chart and the table below follow it.
  const [yearFilter, setYearFilter] = useState<string>('all')
  const activeYearFilter =
    yearFilter !== 'all' && selectedYears.size === 1 && selectedYears.has(Number(yearFilter)) ? yearFilter : 'all'

  const changeYearFilter = (value: string) => {
    if (value === activeYearFilter) return
    const year = value === 'all' ? null : Number(value)
    posthog.capture('trading_year_filter_changed', {
      action: year === null ? 'deselected' : 'selected',
      year: year ?? Number(activeYearFilter),
    })

    setYearFilter(value)
    setSelectedYears(year === null ? new Set(availableYears) : new Set([year]))
  }

  // Pagination state
  const ITEMS_PER_PAGE = 50
  const [currentPage, setCurrentPage] = useState(1)

  // Filter trades by selected years
  const filteredTrades = useMemo(() => {
    if (selectedYears.size === 0) {
      return allTrades
    }
    return allTrades.filter((trade) => {
      const year = getYear(trade.Time)
      return selectedYears.has(year)
    })
  }, [allTrades, selectedYears])

  // Reset to page 1 when the year filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedYears])

  // Memoized sort — avoids re-sorting on every render and prevents array mutation
  const sortedTrades = useMemo(
    () => [...filteredTrades].sort(
      (a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime()
    ),
    [filteredTrades]
  )

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTrades = sortedTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const showingText = sortedTrades.length > 0
    ? `Showing ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, sortedTrades.length)} of ${sortedTrades.length} transactions`
    : ''

  // Calculate metrics from filtered trades
  const metrics = useMemo(
    () => calculateTradingMetrics(filteredTrades),
    [filteredTrades]
  )

  const hasTrades = allTrades.length > 0

  // Display data for the charts, derived from the filtered trades.
  const [selectedWeekday, setSelectedWeekday] = useState<string | null>(null)
  const weekdays = useMemo(() => {
    const counts = new Array(7).fill(0)
    const split = Array.from({ length: 7 }, () => ({ buys: 0, sells: 0, volume: 0 }))
    for (const trade of filteredTrades) {
      const day = new Date(trade.Time).getDay()
      if (isNaN(day)) continue
      counts[day]++
      if (isBuyAction(trade.Action)) split[day].buys++
      else split[day].sells++
      split[day].volume += Math.abs(trade.totalInBaseCurrency || 0)
    }
    const total = counts.reduce((sum, n) => sum + n, 0)
    const days = WEEKDAY_ORDER.filter((day) => (day >= 1 && day <= 5) || counts[day] > 0)
    const rows: BarRow[] = days.map((day) => ({
      id: WEEKDAY_NAMES[day].toLowerCase(),
      label: WEEKDAY_NAMES[day],
      value: counts[day],
      display: String(counts[day]),
      note: total > 0 ? `${Math.round((counts[day] / total) * 100)}% of trades` : undefined
    }))
    const detail = new Map(days.map((day) => [WEEKDAY_NAMES[day].toLowerCase(), split[day]]))
    return { rows, detail }
  }, [filteredTrades])

  const monthlyFlow = useMemo(() => {
    const byMonth = new Map<number, { buys: number; sells: number }>()
    let first = Infinity
    let last = -Infinity
    for (const trade of filteredTrades) {
      const date = new Date(trade.Time)
      if (isNaN(date.getTime())) continue
      const key = date.getFullYear() * 12 + date.getMonth()
      first = Math.min(first, key)
      last = Math.max(last, key)
      const entry = byMonth.get(key) ?? { buys: 0, sells: 0 }
      const volume = Math.abs(trade.totalInBaseCurrency || 0)
      if (isBuyAction(trade.Action)) entry.buys += volume
      else entry.sells += volume
      byMonth.set(key, entry)
    }
    if (!Number.isFinite(first)) return []
    const months = []
    for (let key = first; key <= last; key++) {
      const year = Math.floor(key / 12)
      const month = key % 12
      const entry = byMonth.get(key) ?? { buys: 0, sells: 0 }
      months.push({
        id: `${year}-${month + 1}`,
        label: monthLabel(year, month),
        values: { buys: entry.buys, sells: entry.sells },
        display: {
          buys: formatCurrency(entry.buys, metrics.baseCurrency),
          sells: formatCurrency(entry.sells, metrics.baseCurrency)
        },
        totalDisplay: formatCurrency(entry.buys + entry.sells, metrics.baseCurrency)
      })
    }
    return months
  }, [filteredTrades, metrics.baseCurrency])

  const yearItems = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...availableYears.map((year) => ({ value: String(year), label: String(year) }))
    ],
    [availableYears]
  )

  const header = (
    <PageHeader
      title="Trading activity"
      description="Every buy and sell in your export, when you traded and how it went."
      actions={
        availableYears.length > 0 ? (
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
            <SlidingTabs
              variant="segmented"
              size="sm"
              aria-label="Filter by year"
              items={yearItems}
              value={activeYearFilter}
              onValueChange={changeYearFilter}
            />
          </div>
        ) : undefined
      }
    />
  )

  if (!hasTrades) {
    return (
      <DashboardPage className={className}>
        {header}
        <EmptyActivity
          icon={<ArrowLeftRight size={20} />}
          title="No trading activity found"
          body="This export has no buy or sell orders. Upload a Trading 212 export that covers your trades to see them here."
        />
      </DashboardPage>
    )
  }

  const periodLabel = activeYearFilter === 'all' ? 'All years' : activeYearFilter
  const pct = (part: number) =>
    metrics.totalTransactions > 0 ? `${Math.round((part / metrics.totalTransactions) * 100)}% of trades` : 'No trades'
  const breakEven = metrics.sellCount - metrics.profitableTrades - metrics.losingTrades
  const realizedTone = metrics.realizedPnL > 0 ? 'up' : metrics.realizedPnL < 0 ? 'down' : 'neutral'

  return (
    <DashboardPage className={className}>
      {header}

      {filteredTrades.length === 0 ? (
        <EmptyActivity
          icon={<CalendarDays size={20} />}
          title={`No trades in ${periodLabel}`}
          body="Nothing was bought or sold in this period. Pick another year, or show every year."
          action={
            <Button variant="outline" onClick={() => changeYearFilter('all')}>
              Show all years
            </Button>
          }
        />
      ) : (
        <>
          <Region id="activity-summary" label="Summary" action={periodLabel}>
            <div className={kpiGrid}>
              <KpiTile
                label="Transactions"
                value={<CountFigure value={metrics.totalTransactions} />}
                sub={`Avg ${formatCurrency(metrics.averageTransactionSize, metrics.baseCurrency)} per trade`}
              />
              <KpiTile label="Buys" value={<CountFigure value={metrics.buyCount} />} sub={pct(metrics.buyCount)} />
              <KpiTile label="Sells" value={<CountFigure value={metrics.sellCount} />} sub={pct(metrics.sellCount)} />
              <KpiTile
                label="Win rate"
                value={<NumberChange value={`${metrics.winRate.toFixed(1)}%`} />}
                tone={metrics.sellCount > 0 && metrics.winRate >= 50 ? 'up' : 'neutral'}
                sub={
                  metrics.sellCount > 0
                    ? `${metrics.profitableTrades}W / ${metrics.losingTrades}L${breakEven > 0 ? ` / ${breakEven} even` : ''}`
                    : 'No sells yet'
                }
                hint="Share of sells that closed at a profit, from the Result column of your export."
              />
              <KpiTile
                label="Realised profit"
                value={<MoneyFigure amount={metrics.realizedPnL} currency={metrics.baseCurrency} signed />}
                tone={realizedTone}
                sub={`From ${metrics.sellCount} ${metrics.sellCount === 1 ? 'sell' : 'sells'}`}
                hint="Sum of the Result column on sells in this period, in your base currency."
              />
              <KpiTile
                label="Buy volume"
                value={<MoneyFigure amount={metrics.totalBuyVolume} currency={metrics.baseCurrency} />}
                sub={
                  metrics.buyCount > 0
                    ? `Avg ${formatCurrency(metrics.totalBuyVolume / metrics.buyCount, metrics.baseCurrency)} per buy`
                    : 'No buys'
                }
              />
              <KpiTile
                label="Sell volume"
                value={<MoneyFigure amount={metrics.totalSellVolume} currency={metrics.baseCurrency} />}
                sub={
                  metrics.sellCount > 0
                    ? `Avg ${formatCurrency(metrics.totalSellVolume / metrics.sellCount, metrics.baseCurrency)} per sell`
                    : 'No sells'
                }
              />
              <KpiTile
                label="Most traded stock"
                value={
                  metrics.mostTradedStock ? (
                    <TextSwap text={metrics.mostTradedStock.ticker} className="ticker" />
                  ) : (
                    'N/A'
                  )
                }
                sub={
                  metrics.mostTradedStock
                    ? `${metrics.mostTradedStock.count} trades · ${metrics.mostTradedStock.name}`
                    : undefined
                }
              />
            </div>
          </Region>

          <Region id="activity-calendar" label="Calendar">
            <Reveal>
              <TradingHeatmap
                transactions={filteredTrades}
                formatVolume={(amount) => formatCurrency(amount, metrics.baseCurrency)}
              />
            </Reveal>
          </Region>

          <Region id="activity-patterns" label="Patterns">
            <Reveal className={chartGrid}>
              <ChartCard title="Trades by weekday" color={3} note={`${metrics.totalTransactions} trades`}>
                <BarRows
                  rows={weekdays.rows}
                  color={3}
                  emphasis="max"
                  labelWidth={88}
                  aria-label={`Trades by weekday, ${periodLabel}`}
                  selectedId={selectedWeekday}
                  onSelect={(id) => setSelectedWeekday((current) => (current === id ? null : id))}
                  renderDetail={(row) => {
                    const detail = weekdays.detail.get(row.id)
                    if (!detail) return null
                    return (
                      <p className="figure flex flex-wrap gap-x-4 gap-y-1 text-xs font-normal text-muted-foreground">
                        <span>
                          <span className="text-foreground">{detail.buys}</span> {detail.buys === 1 ? 'buy' : 'buys'}
                        </span>
                        <span>
                          <span className="text-foreground">{detail.sells}</span> {detail.sells === 1 ? 'sell' : 'sells'}
                        </span>
                        <span>
                          <span className="text-foreground">{formatCurrency(detail.volume, metrics.baseCurrency)}</span> traded
                        </span>
                      </p>
                    )
                  }}
                />
              </ChartCard>
              <ChartCard title="Buys and sells by month" note={`Volume in ${metrics.baseCurrency}`}>
                <StackedColumns
                  series={[
                    { key: 'buys', label: 'Buys', color: 1 },
                    { key: 'sells', label: 'Sells', color: 6 }
                  ]}
                  data={monthlyFlow}
                  height={168}
                  aria-label={`Buy and sell volume by month in ${metrics.baseCurrency}, ${periodLabel}`}
                />
                <Legend
                  className="mt-3"
                  items={[
                    { id: 'buys', label: 'Buys', color: 1, value: formatCurrency(metrics.totalBuyVolume, metrics.baseCurrency) },
                    { id: 'sells', label: 'Sells', color: 6, value: formatCurrency(metrics.totalSellVolume, metrics.baseCurrency) }
                  ]}
                />
              </ChartCard>
            </Reveal>
          </Region>
        </>
      )}

      <TradingStatsBento transactions={storeTransactions} />

      {filteredTrades.length > 0 ? (
        <Region id="activity-transactions" label="Transactions">
          <Tile size="flush">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <TileTitle>All transactions</TileTitle>
              <TileNote className="figure">
                {sortedTrades.length} {sortedTrades.length === 1 ? 'transaction' : 'transactions'} in the selected period
              </TileNote>
            </div>
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="ps-4 pe-2 sm:ps-5 sm:pe-4">Date</TableHead>
                  <TableHead className="px-2 sm:px-4">Action</TableHead>
                  <TableHead className="px-2 sm:px-4">Ticker</TableHead>
                  <TableHead className="hidden px-4 md:table-cell">Name</TableHead>
                  <TableHead className="hidden px-4 text-right xl:table-cell">Shares</TableHead>
                  <TableHead className="hidden px-4 text-right sm:table-cell">Price</TableHead>
                  <TableHead className="ps-2 pe-4 text-right sm:px-4">Total</TableHead>
                  <TableHead className="hidden ps-4 pe-5 text-right sm:table-cell">Result</TableHead>
                </TableRow>
              </TableHeader>
              <AnimatePresence mode="wait" initial={false}>
                <motion.tbody
                  key={currentPage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="[&_tr:last-child]:border-0"
                >
                  {paginatedTrades.map((transaction) => {
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

                    // Show result only for sell transactions
                    const result = transaction.Result
                    const hasResult = !isBuy && result !== null && result !== undefined
                    const resultTone = hasResult ? (result > 0 ? 'text-up' : result < 0 ? 'text-down' : 'text-foreground') : ''

                    return (
                      <TableRow key={transaction.ID || `${transaction.Time}-${transaction.Ticker}`}>
                        <TableCell className="figure whitespace-nowrap ps-4 pe-2 sm:ps-5 sm:pe-4">{dateStr}</TableCell>
                        <TableCell className="px-2 sm:px-4">
                          <ActionBadge action={transaction.Action} />
                        </TableCell>
                        <TableCell className="ticker whitespace-nowrap px-2 sm:px-4">{transaction.Ticker || '-'}</TableCell>
                        <TableCell className="hidden px-4 text-muted-foreground md:table-cell">
                          <span className="block max-w-[8rem] truncate xl:max-w-[16rem]" title={transaction.Name || undefined}>
                            {transaction.Name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="figure hidden whitespace-nowrap px-4 text-right xl:table-cell">{shares}</TableCell>
                        <TableCell className="figure hidden whitespace-nowrap px-4 text-right sm:table-cell">{price}</TableCell>
                        <TableCell className="figure whitespace-nowrap ps-2 pe-4 text-right font-medium sm:px-4">{total}</TableCell>
                        <TableCell className={cn('figure hidden whitespace-nowrap ps-4 pe-5 text-right sm:table-cell', resultTone)}>
                          {hasResult ? (
                            formatSignedCurrency(result, metrics.baseCurrency)
                          ) : (
                            <span className="text-muted-foreground">
                              <span aria-hidden="true">–</span>
                              <span className="sr-only">No result</span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </motion.tbody>
              </AnimatePresence>
            </Table>

            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:px-5">
                <p className="figure text-xs font-normal text-muted-foreground">{showingText}</p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </Tile>
        </Region>
      ) : null}
    </DashboardPage>
  )
}
