'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useIsoLayoutEffect } from './internal'
import { seriesVar, type SeriesColor } from './palette'

export interface ChartTooltipProps {
  /** Shown or hidden. The last content stays while it fades out. */
  open: boolean
  /** Anchor in px, relative to the positioned parent (the chart's plot box). */
  x: number
  y: number
  /** Above the anchor by default; flips below when there is no room. */
  placement?: 'above' | 'below'
  className?: string
  children: React.ReactNode
}

const GAP = 8
const EDGE = 8

/**
 * The floating box every chart uses: `bg-raised shadow-pop rounded-lg`,
 * 150ms opacity. Place it inside a `relative` parent and pass an anchor in
 * that parent's px. It keeps itself inside the nearest `[data-vz-bounds]`
 * ancestor (ChartCard sets it) and inside the viewport.
 */
export function ChartTooltip({ open, x, y, placement = 'above', className, children }: ChartTooltipProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null)

  useIsoLayoutEffect(() => {
    if (!open) return
    const el = ref.current
    const parent = el?.offsetParent
    if (!el || !(parent instanceof HTMLElement)) return
    const p = parent.getBoundingClientRect()
    const w = el.offsetWidth
    const h = el.offsetHeight
    const boundsEl = parent.closest('[data-vz-bounds]') ?? parent
    const b = boundsEl.getBoundingClientRect()
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const minL = Math.max(b.left + EDGE, EDGE)
    const maxL = Math.min(b.right - EDGE, vw - EDGE) - w
    const minT = Math.max(b.top + EDGE, EDGE)
    const maxT = Math.min(b.bottom - EDGE, vh - EDGE) - h

    let left = p.left + x - w / 2
    left = Math.max(minL, Math.min(maxL, left))
    const above = p.top + y - h - GAP
    const below = p.top + y + GAP + 4
    let top = placement === 'above' ? (above >= minT ? above : below) : below <= maxT ? below : above
    top = Math.max(minT, Math.min(maxT, top))
    const next = { left: Math.round(left - p.left), top: Math.round(top - p.top) }
    setPos((prev) => (prev && prev.left === next.left && prev.top === next.top ? prev : next))
  }, [open, x, y, placement, children])

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-0 top-0 z-20 w-max max-w-[15rem] rounded-lg border border-transparent bg-raised px-2.5 py-2 text-xs font-normal leading-4 text-foreground shadow-pop transition-opacity duration-150 ease-out',
        open && pos ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ transform: pos ? `translate(${pos.left}px, ${pos.top}px)` : undefined }}
    >
      {children}
    </div>
  )
}

/** One line of a tooltip: optional colour key, label, value on the right. */
export function ChartTooltipRow({
  color,
  label,
  value,
  strong,
}: {
  color?: SeriesColor | 'up' | 'down'
  label: React.ReactNode
  value: React.ReactNode
  strong?: boolean
}) {
  const bg = color === undefined ? undefined : color === 'up' || color === 'down' ? `hsl(var(--${color}))` : seriesVar(color)
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {bg ? <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ background: bg }} /> : null}
      <span className={cn('min-w-0 flex-1 truncate', strong ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className={cn('figure ps-3 text-foreground', strong && 'font-medium')}>{value}</span>
    </div>
  )
}

/** The default tooltip body: muted label, the value as the strong line, an optional note. */
export function ChartTooltipBody({ label, value, note }: { label: React.ReactNode; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <>
      <div className="truncate text-2xs text-muted-foreground">{label}</div>
      <div className="figure mt-0.5 whitespace-nowrap text-sm font-medium leading-5">{value}</div>
      {note ? <div className="mt-0.5 truncate text-2xs text-muted-foreground">{note}</div> : null}
    </>
  )
}
