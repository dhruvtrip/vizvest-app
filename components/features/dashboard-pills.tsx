'use client'

import { useMemo } from 'react'
import { Calendar, Wallet } from 'lucide-react'
import { useDashboardStore } from '@/stores/useDashboardStore'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const pillBase =
  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-sm'

function DateRangePill ({ formattedRange }: { formattedRange: string }) {
  return (
    <span
      className={`${pillBase} bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 text-primary`}
      aria-label={`Data range: ${formattedRange}`}
    >
      <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      {formattedRange}
    </span>
  )
}

function BaseCurrencyPill ({ baseCurrency }: { baseCurrency: string }) {
  return (
    <span
      className={`${pillBase} bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400`}
      aria-label={`Base currency: ${baseCurrency}`}
    >
      <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      Base currency: {baseCurrency}
    </span>
  )
}

/**
 * Dashboard context bar showing date range and base currency as pills.
 * Renders only when there is transaction data (date range can be computed).
 */
export function DashboardPills () {
  const normalizedTransactions = useDashboardStore((state) => state.normalizedTransactions)
  const baseCurrency = useDashboardStore((state) => state.baseCurrency)

  const formattedRange = useMemo(() => {
    if (normalizedTransactions.length === 0) return null
    const dates = normalizedTransactions
      .map((t) => new Date(t.Time).getTime())
      .filter((ts) => Number.isFinite(ts))
    if (dates.length === 0) return null
    const min = Math.min(...dates)
    const max = Math.max(...dates)
    const minStr = dateFormatter.format(new Date(min))
    const maxStr = dateFormatter.format(new Date(max))
    return min === max ? minStr : `${minStr} – ${maxStr}`
  }, [normalizedTransactions])

  if (formattedRange === null) return null

  return (
    <div className="border-b border-border bg-muted/30 relative z-30" role="region" aria-label="Dashboard context">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
        <DateRangePill formattedRange={formattedRange} />
        <BaseCurrencyPill baseCurrency={baseCurrency} />
      </div>
    </div>
  )
}
