'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChartTooltip, ChartTooltipBody } from './chart-tooltip'
import { ChartEmpty, ChartTable } from './chart-states'
import { PointLabels } from './x-labels'
import {
  finite,
  formatCompact,
  niceTicks,
  pickXLabels,
  rovingIndex,
  useGrowPhase,
  usePointerDownOutside,
  useSafeId,
  useTweenedArray,
  useWidth,
} from './internal'
import { seriesVar, type SeriesColor } from './palette'

export type AreaDatum = { id: string; label: string; value: number; display: string }

export interface AreaTrendProps {
  data: AreaDatum[]
  color: SeriesColor
  'aria-label': string
  /** Plot height in px. */
  height?: number
  xLabels?: 'ends' | 'auto' | 'none'
  /** Three quiet gridlines with their values in a left gutter. */
  yLabels?: boolean
  /** Formats the y label values; compact numbers by default (1.2K). */
  formatTick?: (value: number) => string
  className?: string
}

const VB_W = 1000
const TOP_PAD = 8
const Y_GUTTER = 28
const X_LABELS_H = 24

/**
 * A 2px line over a soft vertical fade, with a haloed dot on the latest
 * point. Hover, a tap or the arrow keys move a crosshair, a dot and a
 * tooltip to the nearest point.
 */
export function AreaTrend({
  data,
  color,
  'aria-label': ariaLabel,
  height = 160,
  xLabels = 'auto',
  yLabels = false,
  formatTick = formatCompact,
  className,
}: AreaTrendProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const gradientId = useSafeId('vz-fade')
  const { phase } = useGrowPhase(rootRef, data.length)
  const width = useWidth(plotRef, data.length > 0)
  const [active, setActive] = React.useState<number | null>(null)
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 })
  usePointerDownOutside(boxRef, active !== null, () => setActive(null))

  // Scale: zero-based unless values go below zero; ticks widen it to clean numbers.
  const values = data.map((d) => finite(d.value))
  const rawLo = Math.min(0, ...(values.length ? values : [0]))
  const rawHi = Math.max(0, ...(values.length ? values : [0]))
  const ticks = yLabels ? niceTicks(rawLo, rawHi, 3) : null
  const lo = ticks ? ticks[0] : rawLo
  const hi = ticks ? ticks[ticks.length - 1] : rawHi
  const span = hi - lo || 1
  const pad = ticks ? 0 : TOP_PAD
  // Each point's y as a fraction of the plot height, from the top.
  const target = values.map((v) => (pad + (1 - (v - lo) / span) * (height - pad)) / height)
  const ys = useTweenedArray(target)

  const n = data.length
  const xFrac = (i: number) => (n <= 1 ? 1 : i / (n - 1))
  const shownActive = active !== null && active < n ? active : null

  const point = (i: number) => {
    const plot = plotRef.current
    const box = boxRef.current
    if (!plot || !box) return
    const r = plot.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    setAnchor({ x: r.left - b.left + xFrac(i) * r.width, y: r.top - b.top + (target[i] ?? 0) * r.height })
    setActive(i)
  }

  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width)))
    point(n <= 1 ? 0 : Math.round(f * (n - 1)))
  }

  if (n === 0) {
    return (
      <div className={className}>
        <ChartEmpty height={height + (xLabels === 'none' ? 0 : X_LABELS_H)} />
      </div>
    )
  }

  const pts = (ys.length === n ? ys : target).map((y, i) => [xFrac(i) * VB_W, y * height] as const)
  const linePts = n === 1 ? [[0, pts[0][1]] as const, [VB_W, pts[0][1]] as const] : pts
  const line = linePts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(2)}`).join(' ')
  const area = `${line} L ${VB_W} ${height} L 0 ${height} Z`
  const lastY = (ys.length === n ? ys : target)[n - 1]
  const tickText = ticks ? ticks.map((t) => formatTick(t)) : []
  const gutter = ticks ? Math.max(Y_GUTTER, Math.ceil(Math.max(...tickText.map((t) => t.length)) * 6.4 + 10)) : 0
  const shown = xLabels === 'none' ? new Set<number>() : pickXLabels(data.map((d) => d.label), xLabels, width, true)
  const activeDatum = shownActive !== null ? data[shownActive] : null
  const stroke = seriesVar(color)

  return (
    <div ref={rootRef} data-phase={phase} className={cn('vz-chart', className)}>
      <div ref={boxRef} className="relative" style={{ paddingLeft: gutter }}>
        {ticks
          ? ticks.map((t, i) => {
              const top = (1 - (t - lo) / span) * 100
              return (
                <div key={i} aria-hidden className="pointer-events-none absolute inset-x-0" style={{ top: `${top}%` }}>
                  <span className="figure absolute left-0 -translate-y-1/2 whitespace-nowrap text-2xs leading-4 text-muted-foreground">
                    {tickText[i]}
                  </span>
                  <span className="absolute right-0 h-px bg-foreground/10" style={{ left: gutter }} />
                </div>
              )
            })
          : null}
        <div
          ref={plotRef}
          role="group"
          tabIndex={0}
          aria-label={`${ariaLabel}. Use the arrow keys to read each point.`}
          className="vz-plot relative touch-pan-y rounded-[2px]"
          style={{ height }}
          onPointerMove={fromPointer}
          onPointerDown={fromPointer}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setActive(null)
          }}
          onFocus={() => point(shownActive ?? n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setActive(null)
              return
            }
            const next = rovingIndex(e.key, shownActive ?? n - 1, n)
            if (next !== null) {
              e.preventDefault()
              point(next)
            }
          }}
        >
          <svg
            aria-hidden
            className="vz-draw absolute inset-0 size-full overflow-visible"
            viewBox={`0 0 ${VB_W} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={stroke} stopOpacity={0.3} />
                <stop offset="1" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke={stroke}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <i
            aria-hidden
            className="vz-end-dot pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_hsl(var(--tile))]"
            style={{ left: '100%', top: `${lastY * 100}%`, background: stroke }}
          />
          {shownActive !== null ? (
            <>
              <i
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-foreground/30"
                style={{ left: `${xFrac(shownActive) * 100}%` }}
              />
              <i
                aria-hidden
                className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_hsl(var(--tile))]"
                style={{ left: `${xFrac(shownActive) * 100}%`, top: `${(target[shownActive] ?? 0) * 100}%`, background: stroke }}
              />
            </>
          ) : null}
        </div>
        <ChartTooltip open={activeDatum !== null} x={anchor.x} y={anchor.y}>
          {activeDatum ? <ChartTooltipBody label={activeDatum.label} value={activeDatum.display} /> : null}
        </ChartTooltip>
      </div>
      {xLabels !== 'none' ? <PointLabels labels={data.map((d) => ({ id: d.id, label: d.label }))} shown={shown} gutter={gutter} /> : null}
      <p className="sr-only" aria-live="polite">
        {activeDatum ? `${activeDatum.label}: ${activeDatum.display}` : ''}
      </p>
      <ChartTable caption={ariaLabel} columns={['Label', 'Value']} rows={data.map((d) => ({ id: d.id, cells: [d.label, d.display] }))} />
    </div>
  )
}
