'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useReducedMotionSafe } from '@/components/motion/use-reduced-motion-safe'
import { finite, useGrowPhase } from './internal'
import { seriesVar, toneVar, type SeriesColor } from './palette'
import { ChartEmpty } from './chart-states'

export type BarRow = {
  id: string
  label: string
  note?: string
  value: number
  display: string
  delta?: { display: string; tone: 'up' | 'down' | 'neutral' }
  lowConfidence?: boolean
}

export interface BarRowsProps {
  rows: BarRow[]
  color: SeriesColor
  'aria-label': string
  /** Values can be negative: bars grow left / right from a zero baseline in up / down colours. */
  signed?: boolean
  /** Dashed marker across every track (an average, a target). */
  reference?: { value: number; label: string }
  /** Row drawn at full colour: the largest value, none, or a row id. */
  emphasis?: 'max' | 'none' | string
  selectedId?: string | null
  /** Rows become buttons only when provided. */
  onSelect?: (id: string) => void
  /** Inline detail under the selected row. */
  renderDetail?: (row: BarRow) => React.ReactNode
  /** Label column width in px. It moves above the bar in very narrow containers. */
  labelWidth?: number
  /** Shows the first N rows with a "Show all" toggle. */
  maxRows?: number
  className?: string
}

const FILL_ALPHA = 0.42
const HATCH_ALPHA = 0.55
const ROW_H = 38

/**
 * Ranked bar rows: label and note, a 20px track, value and delta. The
 * leading row is drawn at full colour, the rest at 42% of the same hue,
 * low-confidence rows hatched. A dashed marker shows the reference.
 */
export function BarRows({
  rows,
  color,
  'aria-label': ariaLabel,
  signed = false,
  reference,
  emphasis = 'max',
  selectedId = null,
  onSelect,
  renderDetail,
  labelWidth = 96,
  maxRows,
  className,
}: BarRowsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = React.useState(false)
  const reduced = useReducedMotionSafe()
  const visible = maxRows && !expanded ? rows.slice(0, maxRows) : rows
  const { phase, step } = useGrowPhase(rootRef, visible.length)

  // Scale: unsigned runs 0..max (with the reference); signed runs min..max with a zero baseline.
  const values = rows.map((r) => finite(r.value))
  const refValue = reference ? finite(reference.value) : null
  const hi = Math.max(0, ...values, refValue ?? 0)
  const lo = signed ? Math.min(0, ...values, refValue ?? 0) : 0
  const span = hi - lo || 1
  const pad = signed ? 1 : 1.04
  const domainLo = lo * pad
  const domainSpan = (hi - lo) * pad || span
  const pct = (v: number) => ((v - domainLo) / domainSpan) * 100
  const zero = pct(0)

  const emphasisId = React.useMemo(() => {
    if (emphasis === 'none') return null
    if (emphasis !== 'max') return emphasis
    let best: BarRow | null = null
    for (const r of rows) if (!r.lowConfidence && (!best || finite(r.value) > finite(best.value))) best = r
    return best && finite(best.value) !== 0 ? best.id : null
  }, [emphasis, rows])

  if (rows.length === 0) {
    return (
      <div className={className}>
        <ChartEmpty height={ROW_H * 3} />
      </div>
    )
  }

  const interactive = typeof onSelect === 'function'

  return (
    <div
      ref={rootRef}
      data-phase={phase}
      style={{ '--vz-step': `${step}ms`, '--vz-label': `${labelWidth}px`, '--vz-zero': `${zero}%` } as React.CSSProperties}
      className={cn('vz-chart vz-cq', className)}
    >
      <ul
        aria-label={ariaLabel}
        className="vz-plot grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 [@container(min-width:280px)]:grid-cols-[var(--vz-label)_minmax(0,1fr)_auto]"
      >
        {visible.map((row, i) => {
          const v = finite(row.value)
          const neg = signed && v < 0
          const left = signed ? (neg ? pct(v) : zero) : 0
          const width = signed ? Math.abs(pct(v) - zero) : pct(v)
          const lead = row.id === emphasisId
          const selected = selectedId === row.id
          const hue = signed ? toneVar(neg ? 'down' : 'up', lead ? 1 : FILL_ALPHA) : seriesVar(color, lead ? 1 : FILL_ALPHA)
          const hatch = row.lowConfidence
            ? signed
              ? toneVar(neg ? 'down' : 'up', HATCH_ALPHA)
              : seriesVar(color, HATCH_ALPHA)
            : undefined

          const content = (
            <>
              <span className="col-span-2 min-w-0 pt-1 [@container(min-width:280px)]:col-span-1 [@container(min-width:280px)]:pt-0">
                <span className="block truncate text-[0.8125rem] font-normal leading-4" title={row.label}>
                  {row.label}
                </span>
                {row.note ? (
                  <span className="mt-0.5 block truncate text-2xs text-muted-foreground" title={row.note}>
                    {row.note}
                  </span>
                ) : null}
              </span>
              <span aria-hidden className="relative h-5 rounded-[3px] bg-background">
                <span
                  className={cn('vz-mark vz-grow-x absolute inset-y-0 rounded-[3px]', hatch && 'vz-hatch')}
                  style={
                    {
                      '--vz-w': `${width}%`,
                      '--vz-l': `${left}%`,
                      '--vz-i': i,
                      background: hatch ? undefined : hue,
                      '--vz-hatch': hatch,
                    } as React.CSSProperties
                  }
                />
                {signed && zero > 0 && zero < 100 ? (
                  <i className="absolute -inset-y-1 w-px bg-muted-foreground/60" style={{ left: `${zero}%` }} />
                ) : null}
                {reference ? (
                  <i
                    className="absolute -inset-y-1 border-l border-dashed border-foreground opacity-55"
                    style={{ left: `${pct(finite(reference.value))}%` }}
                  />
                ) : null}
              </span>
              <span className="min-w-[2.75rem] text-right">
                <span className="figure block whitespace-nowrap text-xs font-medium leading-4">{row.display}</span>
                {row.delta ? (
                  <span
                    className={cn(
                      'figure mt-0.5 block whitespace-nowrap text-2xs',
                      row.delta.tone === 'up' && 'text-up',
                      row.delta.tone === 'down' && 'text-down',
                      row.delta.tone === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {row.delta.display}
                  </span>
                ) : null}
              </span>
            </>
          )

          const rowClass = cn(
            'col-span-full grid grid-cols-subgrid items-center gap-y-1 rounded-[4px] -mx-2 px-2 py-1.5 min-h-[38px]',
            interactive && 'cursor-pointer text-left transition-colors duration-150 ease-ui hover:bg-tile-hover',
            selected && 'ring-1 ring-inset ring-foreground'
          )

          return (
            <li key={row.id} className="col-span-full grid grid-cols-subgrid">
              {interactive ? (
                <button
                  type="button"
                  className={rowClass}
                  aria-pressed={renderDetail ? undefined : selected}
                  aria-expanded={renderDetail ? selected : undefined}
                  onClick={() => onSelect?.(row.id)}
                >
                  {content}
                </button>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
              {renderDetail ? (
                <AnimatePresence initial={false}>
                  {selected ? (
                    <motion.div
                      key="detail"
                      className="col-span-full overflow-hidden"
                      initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={reduced ? { opacity: 0, transition: { duration: 0.15 } } : { height: 0, opacity: 0, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="pb-2 pt-1">{renderDetail(row)}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              ) : null}
            </li>
          )
        })}
      </ul>
      {reference ? (
        <p className="sr-only">
          {reference.label}: {reference.value}
        </p>
      ) : null}
      {maxRows && rows.length > maxRows ? (
        <div className="mt-2">
          <Button variant="ghost" size="sm" className="-ms-3" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
            {expanded ? 'Show fewer' : `Show all ${rows.length}`}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
