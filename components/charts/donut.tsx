'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChartTooltip, ChartTooltipBody } from './chart-tooltip'
import { bezier, finite, rovingIndex, useInViewOnce, useIsoLayoutEffect, usePointerDownOutside } from './internal'
import { seriesVar } from './palette'
import type { Segment } from './stacked-meter'

export interface DonutProps {
  segments: Segment[]
  'aria-label': string
  /** Diameter in px. */
  size?: number
  /** Ring width in px. */
  thickness?: number
  /** Centre content. */
  children?: React.ReactNode
  activeId?: string | null
  onActiveChange?: (id: string | null) => void
  className?: string
}

/* transitions.dev 35-donut-chart: ring sectors with even gaps and rounded
   corners that morph to new values. Angles run clockwise from the top. */

function easeOf(value: string): (t: number) => number {
  const m = /cubic-bezier\(([^)]+)\)/.exec(value)
  if (!m) return (t) => t
  const [a, b, c, d] = m[1].split(',').map(parseFloat)
  return bezier(a, b, c, d)
}

// One ring sector from angle a0 to a1, inset by the corner radius (the
// round-joined stroke adds it back) and by half the gap measured straight
// across, so both gap edges stay parallel.
function ringPath(cx: number, cy: number, ro: number, ri: number, a0: number, a1: number, gap: number, cr: number): string {
  const Ro = ro - cr
  const Ri = ri + cr
  const h = gap / 2 + cr
  if (Ro <= Ri) return ''
  const dO = Math.asin(Math.min(1, h / Ro))
  const dI = Math.asin(Math.min(1, h / Ri))
  const o0 = a0 + dO
  const o1 = a1 - dO
  const i0 = a0 + dI
  const i1 = a1 - dI
  if (i1 - i0 <= 0 || o1 - o0 <= 0) return '' // too small to draw
  const pt = (r: number, a: number) => (cx + r * Math.sin(a)).toFixed(3) + ' ' + (cy - r * Math.cos(a)).toFixed(3)
  const lo = o1 - o0 > Math.PI ? 1 : 0
  const li = i1 - i0 > Math.PI ? 1 : 0
  // A single segment spanning the whole ring: draw it as two halves so the arc stays defined.
  if (a1 - a0 >= Math.PI * 2 - 1e-6 && gap === 0) {
    return (
      'M' + pt(Ro, 0) + 'A' + Ro + ' ' + Ro + ' 0 1 1 ' + pt(Ro, Math.PI) + 'A' + Ro + ' ' + Ro + ' 0 1 1 ' + pt(Ro, 0) +
      'M' + pt(Ri, 0) + 'A' + Ri + ' ' + Ri + ' 0 1 0 ' + pt(Ri, Math.PI) + 'A' + Ri + ' ' + Ri + ' 0 1 0 ' + pt(Ri, 0) + 'Z'
    )
  }
  return (
    'M' + pt(Ro, o0) + 'A' + Ro + ' ' + Ro + ' 0 ' + lo + ' 1 ' + pt(Ro, o1) +
    'L' + pt(Ri, i1) + 'A' + Ri + ' ' + Ri + ' 0 ' + li + ' 0 ' + pt(Ri, i0) + 'Z'
  )
}

// The CSS pipeline may serialise 400ms as .4s, so read either unit.
function toMs(value: string): number {
  const n = parseFloat(value)
  if (!Number.isFinite(n)) return 0
  return /ms\s*$/.test(value) ? n : /s\s*$/.test(value) ? n * 1000 : n
}

const share = (v: number, whole: number) => (whole > 0 ? `${Math.round((v / whole) * 1000) / 10}%` : '0%')

/**
 * Donut with even gaps and 2px corners. Segments morph to new values when
 * the data changes (400ms, matched by id). Hover, focus with the arrow keys,
 * or a tap highlights a segment, dims the rest and shows its value.
 */
export function Donut({
  segments,
  'aria-label': ariaLabel,
  size = 140,
  thickness = 14,
  children,
  activeId,
  onActiveChange,
  className,
}: DonutProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const donutRef = React.useRef<HTMLDivElement>(null)
  const pathRefs = React.useRef<Record<string, SVGPathElement | null>>({})
  const current = React.useRef<Record<string, number> | null>(null)
  const raf = React.useRef(0)
  const seen = useInViewOnce(rootRef)
  const [innerActive, setInnerActive] = React.useState<string | null>(null)
  const [tip, setTip] = React.useState<{ id: string; x: number; y: number } | null>(null)
  const controlled = activeId !== undefined
  const lit = controlled ? activeId : innerActive

  const setLit = React.useCallback(
    (id: string | null) => {
      if (!controlled) setInnerActive(id)
      onActiveChange?.(id)
    },
    [controlled, onActiveChange]
  )

  usePointerDownOutside(boxRef, tip !== null, () => {
    setTip(null)
    setLit(null)
  })

  const parts = segments.map((s) => ({ ...s, v: Math.max(0, finite(s.value)) }))
  const total = parts.reduce((a, p) => a + p.v, 0)
  const cx = size / 2
  const cy = size / 2
  const ro = Math.min(cx, cy)
  const ri = ro - thickness
  const key = parts.map((p) => `${p.id}:${p.v}`).join('|')

  // Mid-angle of each segment, for the tooltip anchor.
  const mids = React.useMemo(() => {
    const out: Record<string, number> = {}
    let a = 0
    for (const p of parts) {
      const span = total > 0 ? (p.v / total) * Math.PI * 2 : 0
      out[p.id] = a + span / 2
      a += span
    }
    return out
  }, [key])

  useIsoLayoutEffect(() => {
    // The snippet's tokens are scoped to .t-donut, so read them there.
    const el = donutRef.current
    if (!el) return
    const token = (name: string) => getComputedStyle(el).getPropertyValue(name).trim()
    const draw = (values: Record<string, number>) => {
      const sum = parts.reduce((a, p) => a + (values[p.id] ?? 0), 0) || 1
      const gap = parseFloat(token('--chart-gap')) || 0
      const cr = parseFloat(token('--chart-corner')) || 0
      const count = parts.filter((p) => (values[p.id] ?? 0) > 0).length
      let a = 0
      for (const p of parts) {
        const span = ((values[p.id] ?? 0) / sum) * Math.PI * 2
        const path = pathRefs.current[p.id]
        if (path) {
          path.setAttribute('d', ringPath(cx, cy, ro, ri, a, a + span, count > 1 ? gap : 0, cr))
          path.style.strokeWidth = String(2 * cr)
        }
        a += span
      }
    }

    const to: Record<string, number> = {}
    for (const p of parts) to[p.id] = p.v
    cancelAnimationFrame(raf.current)
    const from = current.current
    current.current = to
    const dur = toMs(token('--chart-morph-dur'))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!from || !dur || reduce) {
      draw(to)
      return
    }
    const ease = easeOf(token('--chart-morph-ease'))
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur)
      const e = ease(t)
      const mixed: Record<string, number> = {}
      for (const p of parts) {
        const f = from[p.id] ?? 0
        mixed[p.id] = f + (p.v - f) * e
      }
      draw(mixed)
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    step(t0)
    return () => cancelAnimationFrame(raf.current)
  }, [key, size, thickness])

  const showTip = (id: string) => {
    const a = mids[id]
    if (a === undefined) return
    const r = ro - thickness / 2
    setTip({ id, x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) })
    setLit(id)
  }
  const hide = () => {
    setTip(null)
    setLit(null)
  }

  const drawn = parts.filter((p) => p.v > 0)
  const tipPart = tip ? parts.find((p) => p.id === tip.id) : null
  const litIndex = drawn.findIndex((p) => p.id === lit)

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <div ref={boxRef} className="relative size-full">
        <div
          ref={donutRef}
          role="group"
          tabIndex={total > 0 ? 0 : -1}
          aria-label={`${ariaLabel}. Use the arrow keys to read each segment.`}
          className={cn(
            't-donut rounded-full transition-opacity duration-500 ease-reveal',
            seen ? 'opacity-100' : 'opacity-0'
          )}
          data-thickness={thickness}
          style={{ width: size, height: size }}
          onFocus={() => {
            const first = drawn[Math.max(0, litIndex)]
            if (first) showTip(first.id)
          }}
          onBlur={hide}
          onKeyDown={(e) => {
            if (e.key === 'Escape') return hide()
            const next = rovingIndex(e.key, Math.max(0, litIndex), drawn.length)
            if (next !== null) {
              e.preventDefault()
              showTip(drawn[next].id)
            }
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') hide()
          }}
        >
          <svg viewBox={`0 0 ${size} ${size}`} aria-hidden>
            {total === 0 ? (
              <circle cx={cx} cy={cy} r={ro - thickness / 2} fill="none" strokeWidth={thickness} style={{ stroke: 'hsl(var(--background))' }} />
            ) : null}
            {parts.map((p) => (
              <path
                key={p.id}
                ref={(el) => {
                  pathRefs.current[p.id] = el
                }}
                className={cn('t-donut-seg', lit && lit !== p.id && 'is-dim')}
                style={{ fill: seriesVar(p.color), stroke: seriesVar(p.color) }}
                onPointerEnter={() => showTip(p.id)}
              />
            ))}
          </svg>
          <div className="t-donut-center pointer-events-none">
            {children ?? (total === 0 ? <span className="text-xs font-normal text-muted-foreground">No data yet</span> : null)}
          </div>
        </div>
        <ChartTooltip open={tip !== null && tipPart != null} x={tip?.x ?? 0} y={tip?.y ?? 0}>
          {tipPart ? <ChartTooltipBody label={tipPart.label} value={tipPart.display} note={`${share(tipPart.v, total)} of the total`} /> : null}
        </ChartTooltip>
      </div>
      <p className="sr-only" aria-live="polite">
        {tipPart ? `${tipPart.label}: ${tipPart.display}, ${share(tipPart.v, total)}` : ''}
      </p>
      <ul className="sr-only" aria-label={ariaLabel}>
        {parts.map((p) => (
          <li key={p.id}>
            {p.label}: {p.display} ({share(p.v, total)})
          </li>
        ))}
      </ul>
    </div>
  )
}
