'use client'

import { useMemo } from 'react'
import { CalendarDays, Coins } from 'lucide-react'
import { useDashboardStore } from '@/stores/useDashboardStore'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const chip =
  'inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-label text-fg-secondary'

function DateRangePill ({ formattedRange }: { formattedRange: string }) {
  return (
    <span className={chip} aria-label={`Data range: ${formattedRange}`}>
      <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="tabular text-foreground">{formattedRange}</span>
    </span>
  )
}

function BaseCurrencyPill ({ baseCurrency }: { baseCurrency: string }) {
  return (
    <span className={chip} aria-label={`Base currency: ${baseCurrency}`}>
      <Coins className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="hidden sm:inline">Base currency</span>
      <span className="text-foreground">{baseCurrency}</span>
    </span>
  )
}

/**
 * Dashboard context bar: date range and base currency as quiet chips in a
 * hairline row above the content, aligned to the page frame.
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
    <div className="border-b border-border" role="region" aria-label="Dashboard context">
      <div className="mx-auto flex min-h-12 w-full max-w-[1200px] flex-wrap items-center gap-2 px-4 py-2.5 md:px-8">
        <DateRangePill formattedRange={formattedRange} />
        <BaseCurrencyPill baseCurrency={baseCurrency} />
      </div>
    </div>
  )
}
