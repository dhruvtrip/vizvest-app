'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChartTooltip, ChartTooltipBody } from './chart-tooltip'
import { ChartEmpty, ChartTable } from './chart-states'
import { XLabels } from './x-labels'
import { finite, pickXLabels, useGrowPhase, useMarkHover, useWidth, type XLabelMode } from './internal'
import { seriesVar, toneVar, type SeriesColor } from './palette'

export type ColumnDatum = { id: string; label: string; value: number; display: string; note?: string }

export interface ColumnPlotProps {
  data: ColumnDatum[]
  color: SeriesColor
  'aria-label': string
  /** Plot height in px. */
  height?: number
  /** Dashed reference line with its label in the left gutter. */
  reference?: { value: number; label: string }
  /** Columns drawn at full colour; the rest sit at 38% of the same hue. */
  emphasize?: (d: ColumnDatum, index: number) => boolean
  /** Negative values hang below a zero baseline in up / down colours. */
  signed?: boolean
  xLabels?: XLabelMode
  selectedId?: string | null
  onSelect?: (id: string) => void
  renderTooltip?: (d: ColumnDatum) => React.ReactNode
  className?: string
}

const FILL_ALPHA = 0.38
/** The reference label moves above the line below this container width, and the gutter goes. */
const NARROW = 320
const X_LABELS_H = 24

/**
 * Columns on full-height tracks. Hover, focus or a tap tints the track,
 * lifts the column to full colour and opens a tooltip that stays inside the
 * card. Arrow keys move along the columns.
 */
export function ColumnPlot({
  data,
  color,
  'aria-label': ariaLabel,
  height = 168,
  reference,
  emphasize,
  signed = false,
  xLabels = 'auto',
  selectedId = null,
  onSelect,
  renderTooltip,
  className,
}: ColumnPlotProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const { phase, step } = useGrowPhase(rootRef, data.length)
  const { boxRef, active, anchor, markProps, groupProps } = useMarkHover(data.length)
  const width = useWidth(plotRef, data.length > 0)
  const rootWidth = useWidth(rootRef, data.length > 0)

  if (data.length === 0) {
    return (
      <div className={className}>
        <ChartEmpty height={height + (xLabels === 'none' ? 0 : X_LABELS_H)} />
      </div>
    )
  }

  const values = data.map((d) => finite(d.value))
  const refValue = reference ? finite(reference.value) : 0
  const rawHi = Math.max(0, ...values, refValue)
  const rawLo = signed ? Math.min(0, ...values, refValue) : 0
  const hi = rawHi * 1.05
  const lo = rawLo * 1.05
  const span = hi - lo || 1
  const pct = (v: number) => ((v - lo) / span) * 100
  const zero = pct(0)
  // Gutter sized from the reference label, capped at a third of the width; the label truncates only past that.
  const narrow = rootWidth !== null && rootWidth < NARROW
  const labelPx = reference ? Math.ceil(reference.label.length * 6.2 + 14) : 0
  const gutter = reference && !narrow ? Math.min(labelPx, rootWidth !== null ? Math.floor(rootWidth / 3) : 160) : 0
  const shown = pickXLabels(
    data.map((d) => d.label),
    xLabels,
    width
  )
  const interactive = typeof onSelect === 'function'
  const activeDatum = active !== null ? data[active] : null

  return (
    <div
      ref={rootRef}
      data-phase={phase}
      className={cn('vz-chart', className)}
      style={{ '--vz-step': `${step}ms`, '--vz-zero': `${zero}%` } as React.CSSProperties}
    >
      <div ref={boxRef} className="relative" style={{ paddingLeft: gutter }}>
        <div
          ref={plotRef}
          role="group"
          aria-label={ariaLabel}
          className={cn('vz-plot relative flex items-stretch justify-center', data.length > 24 ? 'gap-0.5' : 'gap-1')}
          style={{ height }}
          {...groupProps}
        >
          {data.map((d, i) => {
            const v = finite(d.value)
            const neg = signed && v < 0
            const b = neg ? pct(v) : zero
            const h = Math.abs(pct(v) - zero)
            const hot = emphasize ? emphasize(d, i) : false
            const hue = signed ? (neg ? 'down' : 'up') : null
            const fill = hue ? toneVar(hue, hot ? 1 : FILL_ALPHA) : seriesVar(color, hot ? 1 : FILL_ALPHA)
            const fillHot = hue ? toneVar(hue) : seriesVar(color)
            const selected = selectedId === d.id
            const text = `${d.label}: ${d.display}${d.note ? `, ${d.note}` : ''}`
            const topFrac = 1 - (neg ? b : b + h) / 100
            const common = {
              ...markProps(i, topFrac),
              className: cn(
                'group relative min-w-0 max-w-[120px] flex-1 rounded-t-[2px] bg-background transition-colors duration-150 ease-ui hover:bg-tile-hover data-[active=true]:bg-tile-hover',
                interactive && 'cursor-pointer',
                selected && 'ring-1 ring-inset ring-foreground'
              ),
            }
            const fillEl = (
              <span
                aria-hidden
                className={cn(
                  'vz-mark vz-grow-y absolute inset-x-0 bg-[var(--vz-fill)] group-hover:bg-[var(--vz-fill-hot)] group-data-[active=true]:bg-[var(--vz-fill-hot)]',
                  neg ? 'rounded-b-[2px]' : 'rounded-t-[2px]'
                )}
                style={
                  {
                    '--vz-h': `${h}%`,
                    '--vz-b': `${b}%`,
                    '--vz-i': i,
                    '--vz-fill': fill,
                    '--vz-fill-hot': fillHot,
                  } as React.CSSProperties
                }
              />
            )
            return interactive ? (
              <button
                key={d.id}
                type="button"
                aria-label={text}
                aria-pressed={selected}
                onClick={() => onSelect?.(d.id)}
                {...common}
              >
                {fillEl}
              </button>
            ) : (
              <div key={d.id} role="img" aria-label={text} {...common}>
                {fillEl}
              </div>
            )
          })}
          {signed && zero > 0 && zero < 100 ? (
            <i aria-hidden className="pointer-events-none absolute inset-x-0 h-px bg-muted-foreground/60" style={{ bottom: `${zero}%` }} />
          ) : null}
        </div>
        {reference ? (
          <>
            <i
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground opacity-55"
              style={{ bottom: `${(pct(refValue) / 100) * height}px` }}
            />
            <span
              className={cn(
                'pointer-events-none absolute left-0 truncate text-2xs leading-4 text-muted-foreground',
                narrow ? 'max-w-full rounded-[2px] bg-tile/90 px-1 -ms-1 mb-0.5' : 'translate-y-1/2 bg-tile pe-1.5'
              )}
              style={{ bottom: `${(pct(refValue) / 100) * height}px`, maxWidth: narrow ? undefined : Math.max(0, gutter - 2) }}
              title={reference.label}
            >
              {reference.label}
            </span>
          </>
        ) : null}
        <ChartTooltip open={activeDatum !== null} x={anchor.x} y={anchor.y}>
          {activeDatum ? (
            renderTooltip ? (
              renderTooltip(activeDatum)
            ) : (
              <ChartTooltipBody label={activeDatum.label} value={activeDatum.display} note={activeDatum.note} />
            )
          ) : null}
        </ChartTooltip>
      </div>
      {xLabels !== 'none' ? (
        <XLabels labels={data.map((d) => ({ id: d.id, label: d.label }))} shown={shown} gutter={gutter} gapClass={data.length > 24 ? 'gap-0.5' : 'gap-1'} />
      ) : null}
      <ChartTable
        caption={ariaLabel}
        columns={['Label', 'Value']}
        rows={data.map((d) => ({ id: d.id, cells: [d.label, d.note ? `${d.display} (${d.note})` : d.display] }))}
      />
    </div>
  )
}
