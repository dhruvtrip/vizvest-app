'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChartTooltip, ChartTooltipBody } from './chart-tooltip'
import { Legend } from './legend'
import { finite, useGrowPhase, usePointerDownOutside } from './internal'
import { seriesVar, type SeriesColor } from './palette'

export type Segment = { id: string; label: string; value: number; display: string; color: SeriesColor }

export interface StackedMeterProps {
  segments: Segment[]
  'aria-label': string
  /** The whole the parts are measured against. Defaults to their sum; a larger total leaves the rest of the track empty. */
  total?: number
  legend?: boolean
  /** Lights one part from outside, for a legend the caller draws itself. */
  activeId?: string | null
  /** Called with the part under the pointer, or null when it leaves the bar. */
  onActiveChange?: (id: string | null) => void
  className?: string
}

const share = (v: number, whole: number) => (whole > 0 ? `${Math.round((v / whole) * 1000) / 10}%` : '0%')

/**
 * One whole split into parts: an 8px bar with 2px gaps and a wrapping legend
 * with values. Hovering a part or its legend entry dims the others.
 */
export function StackedMeter({
  segments,
  'aria-label': ariaLabel,
  total,
  legend = true,
  activeId: outerActiveId = null,
  onActiveChange,
  className,
}: StackedMeterProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const { phase } = useGrowPhase(rootRef, 1)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [hoverId, setHoverIdState] = React.useState<string | null>(null)
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 })
  const setHoverId = (id: string | null) => {
    setHoverIdState(id)
    if (id !== hoverId) onActiveChange?.(id)
  }
  usePointerDownOutside(boxRef, hoverId !== null, () => setHoverId(null))

  const parts = segments.map((s) => ({ ...s, v: Math.max(0, finite(s.value)) }))
  const sum = parts.reduce((a, s) => a + s.v, 0)
  const whole = Math.max(sum, total !== undefined ? finite(total) : 0)
  const rest = whole - sum
  const lit = hoverId ?? outerActiveId ?? activeId
  const hovered = parts.find((p) => p.id === hoverId) ?? null

  const segRefs = React.useRef<Record<string, HTMLSpanElement | null>>({})

  // The 8px bar is a small target, so the hit area is the whole band around it.
  const fromPointer = (e: React.PointerEvent) => {
    const box = boxRef.current
    if (!box) return
    for (const p of parts) {
      const el = segRefs.current[p.id]
      if (!el || p.v <= 0) continue
      const r = el.getBoundingClientRect()
      if (e.clientX >= r.left - 1 && e.clientX <= r.right + 1) {
        const b = box.getBoundingClientRect()
        setAnchor({ x: r.left + r.width / 2 - b.left, y: r.top - b.top })
        setHoverId(p.id)
        return
      }
    }
    setHoverId(null)
  }

  const summary = parts.map((p) => `${p.label} ${p.display} (${share(p.v, whole)})`).join(', ')

  return (
    <div ref={rootRef} data-phase={phase} className={cn('vz-chart', className)}>
      <div ref={boxRef} className="relative">
        <div
          className="-my-2 py-2"
          onPointerMove={fromPointer}
          onPointerDown={fromPointer}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setHoverId(null)
          }}
        >
          <div
            role="img"
            aria-label={sum > 0 ? `${ariaLabel}: ${summary}` : `${ariaLabel}: no data yet`}
            className="vz-plot relative h-2 overflow-hidden rounded-full bg-background"
          >
            <span className="vz-mark vz-grow-x absolute inset-y-0 flex gap-0.5" style={{ '--vz-w': '100%' } as React.CSSProperties}>
              {parts.map((p) =>
                p.v > 0 ? (
                  <span
                    key={p.id}
                    ref={(el) => {
                      segRefs.current[p.id] = el
                    }}
                    className="vz-mark h-full min-w-0 basis-0"
                    style={{ flexGrow: p.v, background: seriesVar(p.color), opacity: lit && lit !== p.id ? 0.25 : 1 }}
                  />
                ) : null
              )}
              {rest > 0 && sum > 0 ? <span aria-hidden className="vz-mark h-full basis-0" style={{ flexGrow: rest }} /> : null}
            </span>
          </div>
        </div>
        <ChartTooltip open={hovered !== null} x={anchor.x} y={anchor.y}>
          {hovered ? <ChartTooltipBody label={hovered.label} value={hovered.display} note={`${share(hovered.v, whole)} of the total`} /> : null}
        </ChartTooltip>
      </div>
      {legend ? (
        <Legend
          className="mt-3"
          items={segments.map((s) => ({ id: s.id, label: s.label, color: s.color, value: s.display }))}
          activeId={lit}
          onActiveChange={setActiveId}
        />
      ) : (
        <ul className="sr-only">
          {parts.map((p) => (
            <li key={p.id}>
              {p.label}: {p.display} ({share(p.v, whole)})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
