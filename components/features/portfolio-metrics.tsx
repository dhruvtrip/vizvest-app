'use client'

import { useMemo } from 'react'
import { AnimatedCurrency } from '@/components/ui/animated-number'
import { KpiTile } from '@/components/charts'
import { PageHeader, Region } from '@/components/features/dashboard-layout'
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
  rawValue: number
  subValue?: string
  hint: string
  tone?: 'neutral' | 'up' | 'down'
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

/** Adds a + to gains so the sign of money always shows. */
function formatSignedCurrency(amount: number, currency: string): string {
  return `${amount > 0 ? '+' : ''}${formatCurrency(amount, currency)}`
}

const plural = (count: number, word: string) => `${count} ${word}${count !== 1 ? 's' : ''}`

export function PortfolioMetrics ({ transactions: transactionsProp, className }: PortfolioMetricsProps) {
  const storeTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const transactions = transactionsProp ?? storeTransactions
  const metrics = useMemo(
    () => calculateGlobalMetrics(transactions),
    [transactions]
  )

  const realizedTone = metrics.realizedPnL > 0 ? 'up' : metrics.realizedPnL < 0 ? 'down' : 'neutral'

  const metricCards: MetricData[] = [
    {
      label: 'Buy volume',
      rawValue: metrics.totalInvested,
      subValue: 'Total bought',
      hint: 'Everything you spent buying shares in this export, in your base currency.'
    },
    {
      label: 'Sell volume',
      rawValue: metrics.totalSold,
      subValue: 'Total sold',
      hint: 'Everything you received from selling shares in this export.'
    },
    {
      label: 'Realised profit',
      rawValue: metrics.realizedPnL,
      subValue: `${plural(metrics.soldCount, 'position')} closed`,
      tone: realizedTone,
      signed: true,
      hint: 'Profit or loss on the shares you sold, taken from the Result column of your export.'
    },
    {
      label: 'Dividends',
      rawValue: metrics.totalDividends,
      subValue: 'Dividend income',
      hint: 'Dividend payments received in this export.'
    },
    {
      label: 'Currency fees',
      rawValue: metrics.totalFees,
      subValue: 'Conversion costs',
      hint: 'Fees Trading 212 charged to convert currency when you traded shares priced in another currency.'
    },
    {
      label: 'Deposits',
      rawValue: metrics.totalDeposit,
      subValue: `${plural(metrics.depositCount, 'deposit')} made`,
      hint: 'Money you paid into your account in this export.'
    }
  ]

  return (
    <div className={className}>
      <PageHeader
        title="Portfolio overview"
        description="What you bought, sold, earned and paid across the period in your export."
      />

      <Region label="Summary" id="portfolio-summary">
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3">
          {metricCards.map((metric) => {
            const format = metric.signed ? formatSignedCurrency : formatCurrency
            // The tile fits its figure to its width by character count; the
            // count-up node hides that count, so it is passed down here.
            const chars = Math.max(4, format(metric.rawValue, metrics.baseCurrency).length)
            return (
              <div key={metric.label} className="min-w-0" style={{ '--vz-chars': chars } as React.CSSProperties}>
                <KpiTile
                  className="h-full"
                  label={metric.label}
                  hint={metric.hint}
                  tone={metric.tone}
                  sub={metric.subValue}
                  value={
                    <AnimatedCurrency
                      amount={metric.rawValue}
                      currency={metrics.baseCurrency}
                      formatFn={format}
                    />
                  }
                />
              </div>
            )
          })}
        </div>
      </Region>
    </div>
  )
}
