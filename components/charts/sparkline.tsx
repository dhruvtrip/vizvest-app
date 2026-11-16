import * as React from 'react'
import { cn } from '@/lib/utils'
import { seriesVar, toneVar, type SeriesColor } from './palette'

export interface SparklineProps {
  values: number[]
  color: SeriesColor | 'up' | 'down'
  'aria-label': string
  /** px */
  width?: number
  /** px */
  height?: number
  className?: string
}

/**
 * A small line with a dot on the latest value, for KPI tiles and table rows.
 * It is a glyph, not a plot: the numbers belong in the text beside it.
 */
export function Sparkline({ values, color, 'aria-label': ariaLabel, width = 96, height = 28, className }: SparklineProps) {
  const stroke = color === 'up' || color === 'down' ? toneVar(color) : seriesVar(color)
  const clean = values.filter((v) => Number.isFinite(v))
  const pad = 3
  if (clean.length === 0) {
    return (
      <svg role="img" aria-label={`${ariaLabel}: no data yet`} width={width} height={height} className={cn('block shrink-0', className)}>
        <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} strokeWidth={1} strokeDasharray="2 3" style={{ stroke: 'hsl(var(--muted-foreground) / 0.5)' }} />
      </svg>
    )
  }
  const lo = Math.min(...clean)
  const hi = Math.max(...clean)
  const span = hi - lo
  const n = clean.length
  const x = (i: number) => (n === 1 ? width - pad : pad + (i / (n - 1)) * (width - pad * 2))
  const y = (v: number) => (span === 0 ? height / 2 : pad + (1 - (v - lo) / span) * (height - pad * 2))
  const pts = n === 1 ? [[pad, y(clean[0])], [width - pad, y(clean[0])]] : clean.map((v, i) => [x(i), y(v)])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block shrink-0 overflow-visible', className)}
    >
      <path d={d} fill="none" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" style={{ stroke }} />
      <circle cx={x(n - 1)} cy={y(clean[n - 1])} r={2.5} style={{ fill: stroke }} />
    </svg>
  )
}
