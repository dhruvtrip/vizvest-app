'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChartTooltip, ChartTooltipRow } from './chart-tooltip'
import { ChartEmpty, ChartTable } from './chart-states'
import { XLabels } from './x-labels'
import { finite, formatFull, pickXLabels, useGrowPhase, useMarkHover, useWidth, type XLabelMode } from './internal'
import { seriesVar, type SeriesColor } from './palette'

export type StackedSeries = { key: string; label: string; color: SeriesColor }
export type StackedDatum = {
  id: string
  label: string
  values: Record<string, number>
  display?: Record<string, string>
  totalDisplay?: string
}

export interface StackedColumnsProps {
  series: StackedSeries[]
  data: StackedDatum[]
  'aria-label': string
  height?: number
  xLabels?: XLabelMode
  layout?: 'stacked' | 'grouped'
  className?: string
}

const X_LABELS_H = 24

/**
 * Two to six series per column, stacked with 2px gaps or grouped side by
 * side. The tooltip lists every series for the hovered column with its
 * colour key; pair it with a Legend. Values below zero count as zero.
 */
export function StackedColumns({
  series,
  data,
  'aria-label': ariaLabel,
  height = 168,
  xLabels = 'auto',
  layout = 'stacked',
  className,
}: StackedColumnsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const { phase, step } = useGrowPhase(rootRef, data.length)
  const { boxRef, active, anchor, markProps, groupProps } = useMarkHover(data.length)
  const width = useWidth(plotRef, data.length > 0)

  if (data.length === 0 || series.length === 0) {
    return (
      <div className={className}>
        <ChartEmpty height={height + (xLabels === 'none' ? 0 : X_LABELS_H)} />
      </div>
    )
  }

  const val = (d: StackedDatum, key: string) => Math.max(0, finite(d.values[key] ?? 0))
  const show = (d: StackedDatum, key: string) => d.display?.[key] ?? formatFull(val(d, key))
  const totals = data.map((d) => series.reduce((sum, s) => sum + val(d, s.key), 0))
  const hi =
    (layout === 'stacked' ? Math.max(0, ...totals) : Math.max(0, ...data.flatMap((d) => series.map((s) => val(d, s.key))))) * 1.05 || 1
  const shown = pickXLabels(
    data.map((d) => d.label),
    xLabels,
    width
  )
  const gapClass = data.length > 24 ? 'gap-0.5' : layout === 'grouped' ? 'gap-2' : 'gap-1'
  const activeDatum = active !== null ? data[active] : null

  return (
    <div
      ref={rootRef}
      data-phase={phase}
      className={cn('vz-chart', className)}
      style={{ '--vz-step': `${step}ms` } as React.CSSProperties}
    >
      <div ref={boxRef} className="relative">
        <div
          ref={plotRef}
          role="group"
          aria-label={ariaLabel}
          className={cn('vz-plot relative flex items-stretch justify-center', gapClass)}
          style={{ height }}
          {...groupProps}
        >
          {data.map((d, i) => {
            const total = totals[i]
            const text = `${d.label}: ${series.map((s) => `${s.label} ${show(d, s.key)}`).join(', ')}${
              d.totalDisplay ? `, total ${d.totalDisplay}` : ''
            }`
            const topFrac = layout === 'stacked' ? 1 - total / hi : 1 - Math.max(...series.map((s) => val(d, s.key))) / hi
            return (
              <div
                key={d.id}
                role="img"
                aria-label={text}
                {...markProps(i, topFrac)}
                className="group relative min-w-0 max-w-[120px] flex-1 rounded-t-[2px] bg-background transition-colors duration-150 ease-ui hover:bg-tile-hover data-[active=true]:bg-tile-hover"
              >
                {layout === 'stacked' ? (
                  <span
                    aria-hidden
                    className="vz-mark vz-grow-y absolute inset-x-0 flex flex-col-reverse gap-0.5 overflow-hidden rounded-t-[2px]"
                    style={{ '--vz-h': `${(total / hi) * 100}%`, '--vz-i': i } as React.CSSProperties}
                  >
                    {series.map((s) => {
                      const v = val(d, s.key)
                      return (
                        <span
                          key={s.key}
                          className={cn(
                            'vz-mark min-h-0 basis-0 opacity-90 group-hover:opacity-100 group-data-[active=true]:opacity-100',
                            v === 0 && 'hidden'
                          )}
                          style={{ flexGrow: v, background: seriesVar(s.color) }}
                        />
                      )
                    })}
                  </span>
                ) : (
                  <span aria-hidden className="absolute inset-0 flex items-stretch gap-0.5 px-[8%]">
                    {series.map((s) => (
                      <span key={s.key} className="relative min-w-0 flex-1">
                        <span
                          className="vz-mark vz-grow-y absolute inset-x-0 rounded-t-[2px] opacity-90 group-hover:opacity-100 group-data-[active=true]:opacity-100"
                          style={
                            {
                              '--vz-h': `${(val(d, s.key) / hi) * 100}%`,
                              '--vz-i': i,
                              background: seriesVar(s.color),
                            } as React.CSSProperties
                          }
                        />
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <ChartTooltip open={activeDatum !== null} x={anchor.x} y={anchor.y}>
          {activeDatum ? (
            <div className="min-w-[9rem] space-y-1">
              <div className="truncate text-2xs text-muted-foreground">{activeDatum.label}</div>
              {(layout === 'stacked' ? [...series].reverse() : series).map((s) => (
                <ChartTooltipRow key={s.key} color={s.color} label={s.label} value={show(activeDatum, s.key)} />
              ))}
              {activeDatum.totalDisplay ? (
                <div className="border-t border-border pt-1">
                  <ChartTooltipRow label="Total" value={activeDatum.totalDisplay} strong />
                </div>
              ) : null}
            </div>
          ) : null}
        </ChartTooltip>
      </div>
      {xLabels !== 'none' ? (
        <XLabels labels={data.map((d) => ({ id: d.id, label: d.label }))} shown={shown} gapClass={gapClass} />
      ) : null}
      <ChartTable
        caption={ariaLabel}
        columns={['Label', ...series.map((s) => s.label), ...(data.some((d) => d.totalDisplay) ? ['Total'] : [])]}
        rows={data.map((d) => ({
          id: d.id,
          cells: [d.label, ...series.map((s) => show(d, s.key)), ...(data.some((x) => x.totalDisplay) ? [d.totalDisplay ?? ''] : [])],
        }))}
      />
    </div>
  )
}
