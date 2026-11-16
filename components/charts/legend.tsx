'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { seriesVar, type SeriesColor } from './palette'

export type LegendItem = { id: string; label: string; color: SeriesColor | 'muted'; value?: string }

export interface LegendProps {
  items: LegendItem[]
  activeId?: string | null
  /** Makes entries interactive: hover or focus previews an entry, a click pins it. */
  onActiveChange?: (id: string | null) => void
  className?: string
}

const keyColor = (c: SeriesColor | 'muted') => (c === 'muted' ? 'hsl(var(--muted-foreground) / 0.45)' : seriesVar(c))

/**
 * Wrapping legend: 8px colour key, label, value. When one entry is active
 * the other keys fade; text keeps its contrast.
 */
export function Legend({ items, activeId = null, onActiveChange, className }: LegendProps) {
  const [pinned, setPinned] = React.useState<string | null>(null)
  const interactive = typeof onActiveChange === 'function'

  return (
    <ul className={cn('flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-normal leading-4 text-muted-foreground', className)}>
      {items.map((item) => {
        const dim = activeId !== null && activeId !== item.id
        const on = activeId === item.id
        const inner = (
          <>
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px] transition-opacity duration-150 ease-ui"
              style={{ background: keyColor(item.color), opacity: dim ? 0.25 : 1 }}
            />
            <span className={cn('truncate transition-colors duration-150 ease-ui', on && 'text-foreground')} title={item.label}>
              {item.label}
            </span>
            {item.value ? <span className="figure whitespace-nowrap text-foreground">{item.value}</span> : null}
          </>
        )
        return (
          <li key={item.id} className="flex min-w-0 max-w-full">
            {interactive ? (
              <button
                type="button"
                aria-pressed={pinned === item.id}
                className="relative inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-[4px] text-left before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-['']"
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
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">{inner}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
