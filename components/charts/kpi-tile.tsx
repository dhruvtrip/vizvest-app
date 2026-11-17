'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tile } from '@/components/ui/tile'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from '@/components/icons'

export interface KpiTileProps {
  label: React.ReactNode
  value: React.ReactNode
  sub?: React.ReactNode
  /** Colours the figure for signed money. Pair it with a sign in `value`. */
  tone?: 'neutral' | 'up' | 'down'
  /** Explanation behind an Info button beside the label. */
  hint?: string
  icon?: React.ReactNode
  /** Length of the figure in characters, when `value` is not plain text (a count-up, say). */
  chars?: number
  className?: string
}

/**
 * One headline figure: 12px muted label, 24px semibold figure, 12px muted
 * sub line. The figure never wraps; it scales down with the tile's width
 * (container query units, see `.vz-kpi` in charts.css).
 */
export function KpiTile({ label, value, sub, tone = 'neutral', hint, icon, chars: charsProp, className }: KpiTileProps) {
  const [open, setOpen] = React.useState(false)
  // Character count lets the CSS fit the whole figure to the tile's width.
  const chars =
    charsProp ?? (typeof value === 'string' || typeof value === 'number' ? Math.max(4, String(value).length) : undefined)
  return (
    <Tile className={cn('vz-kpi rounded-2xl px-4 py-3.5', className)}>
      <div className="flex min-h-5 items-center gap-1.5 text-xs font-normal leading-4 text-muted-foreground">
        {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
        <span className="min-w-0 truncate">{label}</span>
        {hint ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip open={open} onOpenChange={setOpen}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="More about this figure"
                  // A tap focuses the button (which opens the hint) and then clicks it.
                  // Keep it open on that click instead of letting the click close it.
                  onClick={(event) => {
                    event.preventDefault()
                    setOpen(true)
                  }}
                  className="relative -my-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-ui before:absolute before:-inset-2 before:content-[''] hover:text-foreground"
                >
                  <Info size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{hint}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      <div
        className={cn(
          'vz-kpi-value figure mt-1.5 whitespace-nowrap font-semibold tracking-[-0.02em]',
          tone === 'up' && 'text-up',
          tone === 'down' && 'text-down'
        )}
        style={chars ? ({ '--vz-chars': chars } as React.CSSProperties) : undefined}
      >
        {value}
      </div>
      {sub ? <div className="mt-0.5 truncate text-xs font-normal leading-4 text-muted-foreground">{sub}</div> : null}
    </Tile>
  )
}
