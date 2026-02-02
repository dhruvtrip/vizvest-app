'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { useDashboardStore } from '@/stores/useDashboardStore'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

export function DashboardDateRangePill () {
  const normalizedTransactions = useDashboardStore((state) => state.normalizedTransactions)

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
    <div className="border-b border-border bg-muted/30 relative z-30">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 text-xs font-medium text-primary backdrop-blur-sm"
          aria-label={`Data range: ${formattedRange}`}
        >
          <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {formattedRange}
        </span>
      </div>
    </div>
  )
}
