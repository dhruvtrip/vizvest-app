'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { seriesVar, type SeriesColor } from './palette'

export type ShareItem = {
  id: string
  label: string
  color: SeriesColor
  /** Share of the whole, 0 to 1. */
  share: number
  /** Formatted value, e.g. "€9,667.35". */
  value: string
}

export interface ShareListProps {
  items: ShareItem[]
  activeId?: string | null
  /** Makes rows interactive: hover or focus previews a row, a click pins it. */
  onActiveChange?: (id: string | null) => void
  className?: string
}

const percent = (share: number) => `${(Math.round(Math.max(0, share) * 1000) / 10).toFixed(1)}%`

/**
 * Table-like legend for a part-of-whole chart: colour key, label with a thin
 * share bar under it, share and value in aligned columns. When one row is
 * active the other keys and bars fade; text keeps its contrast.
 */
export function ShareList({ items, activeId = null, onActiveChange, className }: ShareListProps) {
  const [pinned, setPinned] = React.useState<string | null>(null)
  const interactive = typeof onActiveChange === 'function'

  return (
    <ul className={cn('grid grid-cols-[auto_minmax(3rem,1fr)_auto_auto] gap-x-3 divide-y divide-border sm:gap-x-4', className)}>
      {items.map((item) => {
        const dim = activeId !== null && activeId !== item.id
        const fade = { opacity: dim ? 0.25 : 1 }
        const inner = (
          <>
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[3px] transition-opacity duration-150 ease-ui"
              style={{ background: seriesVar(item.color), ...fade }}
            />
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-sm font-normal leading-4 text-foreground" title={item.label}>
                {item.label}
              </span>
              <span aria-hidden className="block h-0.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]">
                <span
                  className="block h-full rounded-full transition-[width,opacity] duration-500 ease-ui motion-reduce:transition-none"
                  style={{ width: percent(item.share), background: seriesVar(item.color), ...fade }}
                />
              </span>
            </span>
            <span className="figure text-right text-sm font-normal leading-4 text-muted-foreground">{percent(item.share)}</span>
            <span className="figure whitespace-nowrap text-right text-sm font-medium leading-4 text-foreground">{item.value}</span>
          </>
        )
        // Rows share the list's columns (subgrid), so figures line up down the list.
        const row = 'col-span-full grid grid-cols-subgrid items-center py-2.5 text-left'
        return (
          <li key={item.id} className="col-span-full grid min-w-0 grid-cols-subgrid">
            {interactive ? (
              <button
                type="button"
                aria-pressed={pinned === item.id}
                className={cn(row, 'rounded-[4px]')}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') onActiveChange?.(item.id)
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') onActiveChange?.(pinned)
                }}
                onFocus={() => onActiveChange?.(item.id)}
                onBlur={() => onActiveChange?.(pinned)}
                onClick={() => {
                  const next = pinned === item.id ? null : item.id
                  setPinned(next)
                  onActiveChange?.(next)
                }}
              >
                {inner}
              </button>
            ) : (
              <span className={row}>{inner}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
