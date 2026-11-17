'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/useDashboardStore'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

/** Date range covered by the loaded transactions, or null before data loads. */
function useFormattedRange () {
  const normalizedTransactions = useDashboardStore((state) => state.normalizedTransactions)

  return useMemo(() => {
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
}

/**
 * The two context chips (date range and base currency). Used in the header
 * from `lg` up and in the slim row under it on smaller screens.
 */
export function DashboardContextChips ({ className }: { className?: string }) {
  const formattedRange = useFormattedRange()
  const baseCurrency = useDashboardStore((state) => state.baseCurrency)

  if (formattedRange === null) return null

  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-1.5', className)}>
      <Badge
        variant="secondary"
        className="min-w-0 font-normal"
        aria-label={`Data range: ${formattedRange}`}
      >
        <Calendar size={12} className="shrink-0 text-muted-foreground" />
        <span className="figure truncate">{formattedRange}</span>
      </Badge>
      <Badge
        variant="secondary"
        className="font-normal"
        aria-label={`Base currency: ${baseCurrency}`}
      >
        <span className="text-muted-foreground">Base currency</span>
        <span className="font-medium">{baseCurrency}</span>
      </Badge>
    </div>
  )
}

/**
 * Slim context row shown under the header below `lg`, where the header has
 * no room for the chips. Renders only when there is transaction data.
 */
export function DashboardPills () {
  const formattedRange = useFormattedRange()

  if (formattedRange === null) return null

  return (
    <div className="lg:hidden" role="region" aria-label="Dashboard context">
      <div className="mx-auto w-full max-w-shell px-4 pt-4 sm:px-6">
        <DashboardContextChips />
      </div>
    </div>
  )
}
