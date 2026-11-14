'use client'

import { useMemo } from 'react'
import { AnimatedCurrency } from '@/components/ui/animated-number'
import { MetricCell, MetricGrid, type MetricTone } from '@/components/features/metric-cell'
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

function formatSignedCurrency(amount: number, currency: string): string {
  return `${amount > 0 ? '+' : ''}${formatCurrency(amount, currency)}`
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
  tone?: MetricTone
  /** Show a leading + for gains */
  signed?: boolean
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
      totalDividends += Math.abs(t.totalInBaseCurrency || 0)
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
      label: 'Buy volume',
      value: formatCurrency(metrics.totalInvested, metrics.baseCurrency),
      rawValue: metrics.totalInvested,
      currency: metrics.baseCurrency,
      subValue: 'Total bought',
    },
    {
      label: 'Sell volume',
      value: formatCurrency(metrics.totalSold, metrics.baseCurrency),
      rawValue: metrics.totalSold,
      currency: metrics.baseCurrency,
      subValue: 'Total sold',
    },
    {
      label: 'Realized P&L',
      value: `${isRealizedPositive ? '+' : ''}${formatCurrency(metrics.realizedPnL, metrics.baseCurrency)}`,
      rawValue: metrics.realizedPnL,
      currency: metrics.baseCurrency,
      subValue: `${metrics.soldCount} position${metrics.soldCount !== 1 ? 's' : ''} closed`,
      tone: metrics.realizedPnL === 0 ? 'default' : isRealizedPositive ? 'positive' : 'negative',
      signed: true,
    },
    {
      label: 'Total dividends',
      value: formatCurrency(metrics.totalDividends, metrics.baseCurrency),
      rawValue: metrics.totalDividends,
      currency: metrics.baseCurrency,
      subValue: 'Dividend income',
    },
    {
      label: 'Currency fees',
      value: formatCurrency(metrics.totalFees, metrics.baseCurrency),
      rawValue: metrics.totalFees,
      currency: metrics.baseCurrency,
      subValue: 'Conversion costs',
    },
    {
      label: 'Total deposits',
      value: formatCurrency(metrics.totalDeposit, metrics.baseCurrency),
      rawValue: metrics.totalDeposit,
      currency: metrics.baseCurrency,
      subValue: `${metrics.depositCount} deposit${metrics.depositCount !== 1 ? 's' : ''} made`,
    }
  ]

  return (
    <section className={className} aria-labelledby="portfolio-overview-title">
      <div className="mb-8">
        <h1 id="portfolio-overview-title" className="text-h4 text-foreground md:text-h3">Portfolio overview</h1>
        <p className="mt-1 text-p-sm text-fg-secondary">
          Totals across the date range of your upload
        </p>
      </div>

      <MetricGrid columns={3}>
        {metricCards.map((metric) => (
          <MetricCell
            key={metric.label}
            label={metric.label}
            tone={metric.tone}
            sub={metric.subValue}
            value={
              <AnimatedCurrency
                amount={metric.rawValue}
                currency={metric.currency}
                formatFn={metric.signed ? formatSignedCurrency : formatCurrency}
              />
            }
          />
        ))}
      </MetricGrid>
    </section>
  )
}
