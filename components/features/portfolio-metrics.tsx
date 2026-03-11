'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCurrency } from '@/components/ui/animated-number'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { isBuyAction, isSellAction, isDividendAction, isDepositAction } from '@/lib/transaction-utils'

/**
 * Currency symbols for common currencies
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBX: 'p',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$'
}

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))

  const sign = amount < 0 ? '-' : ''
  return `${sign}${symbol}${formatted}`
}

interface PortfolioMetricsProps {
  transactions?: NormalizedTransaction[]
  className?: string
}

interface MetricData {
  label: string
  value: string
  rawValue: number
  currency: string
  subValue?: string
  borderColor: string
  valueColor?: string
}

/**
 * Calculates global portfolio metrics from all transactions
 */
function calculateGlobalMetrics(transactions: NormalizedTransaction[]) {
  const baseCurrency = transactions[0]?.detectedBaseCurrency || 'USD'

  let totalInvested = 0
  let totalSold = 0
  let realizedPnL = 0
  let totalDividends = 0
  let totalFees = 0
  let totalDeposit = 0
  let depositCount = 0
  let holdingsCount = 0
  let soldCount = 0

  // Track unique tickers for holdings vs sold
  const tickerStatus = new Map<string, { shares: number }>()

  // Track date range
  let minDate = ''
  let maxDate = ''

  for (const t of transactions) {
    // Track date range
    if (!minDate || t.Time < minDate) minDate = t.Time
    if (!maxDate || t.Time > maxDate) maxDate = t.Time

    // Calculate fees (currency conversion fees)
    const fee = t['Currency conversion fee'] || 0
    totalFees += Math.abs(fee)

    if (isBuyAction(t.Action)) {
      totalInvested += Math.abs(t.totalInBaseCurrency || 0)

      // Track shares per ticker
      if (t.Ticker) {
        const current = tickerStatus.get(t.Ticker) || { shares: 0 }
        current.shares += t['No. of shares'] || 0
        tickerStatus.set(t.Ticker, current)
      }
    } else if (isSellAction(t.Action)) {
      totalSold += Math.abs(t.totalInBaseCurrency || 0)
      realizedPnL += t.Result || 0

      // Track shares per ticker
      if (t.Ticker) {
        const current = tickerStatus.get(t.Ticker) || { shares: 0 }
        current.shares -= t['No. of shares'] || 0
        tickerStatus.set(t.Ticker, current)
      }
    } else if (isDepositAction(t.Action)) {
      totalDeposit += Math.abs(t.totalInBaseCurrency ?? 0)
      depositCount++
    } else if (isDividendAction(t.Action)) {
      // Dividends: use Total field converted to base currency
      const exchangeRate = t['Exchange rate'] || 1
      totalDividends += (t.Total || 0) * exchangeRate
    }
  }

  // Count holdings vs sold positions
  for (const [, status] of tickerStatus) {
    if (status.shares > 0.0001) {
      holdingsCount++
    } else {
      soldCount++
    }
  }

  // Net invested = total bought - total sold (can be negative)
  const netInvested = totalInvested - totalSold

  // Calculate days covered
  const daysCovered = minDate && maxDate
    ? Math.ceil((new Date(maxDate).getTime() - new Date(minDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return {
    totalInvested,
    totalSold,
    netInvested,
    realizedPnL,
    totalDividends,
    totalFees,
    totalDeposit,
    depositCount,
    holdingsCount,
    soldCount,
    baseCurrency,
    dateRange: { start: minDate, end: maxDate },
    daysCovered
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function MetricCard({
  metric,
  index
}: {
  metric: MetricData
  index: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300',
        'border-border/50 hover:border-border',
        'hover:shadow-lg hover:shadow-primary/5',
        `border-l-[3px] ${metric.borderColor}`
      )}>
        <CardContent className="relative z-10 p-5">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">{metric.label}</p>
          <p className={cn(
            'text-2xl font-bold tracking-tight',
            metric.valueColor || 'text-foreground'
          )}>
            <AnimatedCurrency amount={metric.rawValue} currency={metric.currency} formatFn={formatCurrency} />
          </p>
          {metric.subValue && (
            <p className="text-sm text-muted-foreground mt-1">{metric.subValue}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PortfolioMetrics ({ transactions: transactionsProp, className }: PortfolioMetricsProps) {
  const storeTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const transactions = transactionsProp ?? storeTransactions
  const metrics = useMemo(
    () => calculateGlobalMetrics(transactions),
    [transactions]
  )

  const isRealizedPositive = metrics.realizedPnL >= 0

  const metricCards: MetricData[] = [
    {
      label: 'Buy Volume',
      value: formatCurrency(metrics.totalInvested, metrics.baseCurrency),
      rawValue: metrics.totalInvested,
      currency: metrics.baseCurrency,
      subValue: 'Total bought',
      borderColor: 'border-l-blue-500',
    },
    {
      label: 'Sell Volume',
      value: formatCurrency(metrics.totalSold, metrics.baseCurrency),
      rawValue: metrics.totalSold,
      currency: metrics.baseCurrency,
      subValue: 'Total sold',
      borderColor: 'border-l-rose-500',
    },
    {
      label: 'Realized P&L',
      value: `${isRealizedPositive ? '+' : ''}${formatCurrency(metrics.realizedPnL, metrics.baseCurrency)}`,
      rawValue: metrics.realizedPnL,
      currency: metrics.baseCurrency,
      subValue: `${metrics.soldCount} position${metrics.soldCount !== 1 ? 's' : ''} closed`,
      borderColor: isRealizedPositive ? 'border-l-emerald-500' : 'border-l-red-500',
      valueColor: isRealizedPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Total Dividends',
      value: formatCurrency(metrics.totalDividends, metrics.baseCurrency),
      rawValue: metrics.totalDividends,
      currency: metrics.baseCurrency,
      subValue: 'Dividend income',
      borderColor: 'border-l-amber-500',
      valueColor: metrics.totalDividends > 0 ? 'text-emerald-600 dark:text-emerald-400' : undefined,
    },
    {
      label: 'Currency Fees',
      value: formatCurrency(metrics.totalFees, metrics.baseCurrency),
      rawValue: metrics.totalFees,
      currency: metrics.baseCurrency,
      subValue: 'Conversion costs',
      borderColor: 'border-l-violet-500',
    },
    {
      label: 'Total Deposits',
      value: formatCurrency(metrics.totalDeposit, metrics.baseCurrency),
      rawValue: metrics.totalDeposit,
      currency: metrics.baseCurrency,
      subValue: `${metrics.depositCount} deposit${metrics.depositCount !== 1 ? 's' : ''} made`,
      borderColor: 'border-l-slate-500',
    }
  ]

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portfolio Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your portfolio overview in the above timeframe
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>
    </div>
  )
}
