'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowRightLeft,
  Receipt
} from 'lucide-react'
import type { NormalizedTransaction } from '@/types/trading212'

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
  transactions: NormalizedTransaction[]
  className?: string
}

interface MetricData {
  label: string
  value: string
  subValue?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  valueColor?: string
  gradient?: string
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
  let totalTaxes = 0
  let holdingsCount = 0
  let soldCount = 0

  // Track unique tickers for holdings vs sold
  const tickerStatus = new Map<string, { shares: number }>()

  for (const t of transactions) {
    // Calculate fees (currency conversion fees)
    const fee = t['Currency conversion fee'] || 0
    totalFees += Math.abs(fee)

    if (t.Action === 'Market buy') {
      totalInvested += Math.abs(t.totalInBaseCurrency || 0)

      // Track shares per ticker
      if (t.Ticker) {
        const current = tickerStatus.get(t.Ticker) || { shares: 0 }
        current.shares += t['No. of shares'] || 0
        tickerStatus.set(t.Ticker, current)
      }
    } else if (t.Action === 'Market sell') {
      totalSold += Math.abs(t.totalInBaseCurrency || 0)
      realizedPnL += t.Result || 0

      // Track shares per ticker
      if (t.Ticker) {
        const current = tickerStatus.get(t.Ticker) || { shares: 0 }
        current.shares -= t['No. of shares'] || 0
        tickerStatus.set(t.Ticker, current)
      }
    } else if (t.Action.toLowerCase().includes('dividend')) {
      // Dividends: use Total field converted to base currency
      const exchangeRate = t['Exchange rate'] || 1
      totalDividends += (t.Total || 0) * exchangeRate
      
      // Calculate withholding tax (converted to base currency)
      const tax = t['Withholding tax'] || 0
      totalTaxes += Math.abs(tax * exchangeRate)
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

  // Net invested = total bought - total sold
  const netInvested = totalInvested - totalSold

  return {
    totalInvested,
    netInvested,
    realizedPnL,
    totalDividends,
    totalFees,
    totalTaxes,
    holdingsCount,
    soldCount,
    baseCurrency
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
  const Icon = metric.icon

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
        'bg-card/50 backdrop-blur-sm',
        'hover:shadow-lg hover:shadow-primary/5',
        'group'
      )}>
        {/* Gradient overlay on hover */}
        {metric.gradient && (
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            metric.gradient
          )} />
        )}

        <CardContent className="relative z-10 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              metric.iconBg,
              'transition-transform duration-300 group-hover:scale-110'
            )}>
              <Icon className={cn('w-4 h-4', metric.iconColor)} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
          <p className={cn(
            'text-xl font-semibold tracking-tight',
            metric.valueColor || 'text-foreground'
          )}>
            {metric.value}
          </p>
          {metric.subValue && (
            <p className="text-xs text-muted-foreground mt-0.5">{metric.subValue}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PortfolioMetrics({ transactions, className }: PortfolioMetricsProps) {
  const metrics = useMemo(
    () => calculateGlobalMetrics(transactions),
    [transactions]
  )

  const isRealizedPositive = metrics.realizedPnL >= 0

  const metricCards: MetricData[] = [
    {
      label: 'Total Invested',
      value: formatCurrency(metrics.netInvested, metrics.baseCurrency),
      subValue: `${formatCurrency(metrics.totalInvested, metrics.baseCurrency)} bought`,
      icon: Wallet,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      gradient: 'from-blue-500/5 to-cyan-500/5'
    },
    {
      label: 'Realized P&L',
      value: `${isRealizedPositive ? '+' : ''}${formatCurrency(metrics.realizedPnL, metrics.baseCurrency)}`,
      subValue: `${metrics.soldCount} position${metrics.soldCount !== 1 ? 's' : ''} closed`,
      icon: isRealizedPositive ? TrendingUp : TrendingDown,
      iconBg: isRealizedPositive ? 'bg-emerald-500/10' : 'bg-red-500/10',
      iconColor: isRealizedPositive ? 'text-emerald-500' : 'text-red-500',
      valueColor: isRealizedPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      gradient: isRealizedPositive ? 'from-emerald-500/5 to-green-500/5' : 'from-red-500/5 to-rose-500/5'
    },
    {
      label: 'Total Dividends',
      value: formatCurrency(metrics.totalDividends, metrics.baseCurrency),
      subValue: 'Dividend income',
      icon: DollarSign,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      valueColor: metrics.totalDividends > 0 ? 'text-emerald-600 dark:text-emerald-400' : undefined,
      gradient: 'from-amber-500/5 to-orange-500/5'
    },
    {
      label: 'Currency Fees',
      value: formatCurrency(metrics.totalFees, metrics.baseCurrency),
      subValue: 'Conversion costs',
      icon: ArrowRightLeft,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
      gradient: 'from-violet-500/5 to-purple-500/5'
    },
    {
      label: 'Withholding Tax',
      value: formatCurrency(metrics.totalTaxes, metrics.baseCurrency),
      subValue: 'Tax deducted',
      icon: Receipt,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
      gradient: 'from-orange-500/5 to-amber-500/5'
    }
  ]

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Portfolio Overview</h2>
        <span className="text-xs text-muted-foreground">
          Base currency: {metrics.baseCurrency}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {metricCards.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>
    </div>
  )
}
