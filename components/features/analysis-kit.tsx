'use client'

/**
 * Small building blocks shared by the analysis views (stock detail,
 * dividends, trading activity): title block, section header, chart cell,
 * segmented control, sortable table header, table frame and footer.
 */

import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHART } from '@/components/features/chart-tooltip'

/* ---------- Page structure ---------- */

export function ViewHeader({
  title,
  description,
  aside,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-h4 text-foreground md:text-h3">{title}</h1>
        {description ? <p className="mt-1 text-p-sm text-fg-secondary">{description}</p> : null}
      </div>
      {aside}
    </div>
  )
}

export function SectionHeader({
  title,
  meta,
  id,
  as: Heading = 'h2',
  className,
}: {
  title: React.ReactNode
  meta?: React.ReactNode
  id?: string
  as?: 'h2' | 'h3'
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1', className)}>
      <Heading id={id} className="text-h5 text-foreground">
        {title}
      </Heading>
      {meta ? <p className="tabular text-p-sm text-fg-secondary">{meta}</p> : null}
    </div>
  )
}

/* ---------- Charts ---------- */

/**
 * One chart in a hairline cell. Place inside a `.cell-grid` so neighbouring
 * cells share borders. The plot mounts when it first scrolls into view so the
 * Recharts entrance runs where the reader can see it.
 */
export function ChartCell({
  title,
  sub,
  action,
  height,
  label,
  footer,
  className,
  children,
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  action?: React.ReactNode
  /** Plot height in px (axis labels included) */
  height: number
  /** Accessible summary of the chart */
  label?: string
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })

  return (
    <div className={cn('flex min-w-0 flex-col bg-background p-5 md:p-6', className)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-p text-foreground">{title}</h3>
          {sub ? <p className="mt-0.5 text-p-sm text-fg-secondary">{sub}</p> : null}
        </div>
        {action}
      </div>
      <div
        ref={ref}
        className="tabular -mx-1"
        style={{ height }}
        role={label ? 'img' : undefined}
        aria-label={label}
      >
        {inView ? children : null}
      </div>
      {footer}
    </div>
  )
}

/** A row of small figures under a chart, separated from it by a hairline. */
export function ChartFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-4">{children}</div>
  )
}

export function ChartFooterStat({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-label text-fg-secondary">{label}</p>
      <div className="tabular mt-1 flex items-center gap-2 text-p-sm text-foreground">{children}</div>
    </div>
  )
}

/** Shared axis props: no axis or tick lines, 12px grey ticks. */
export const AXIS_X = {
  tick: CHART.axisTick,
  tickLine: false,
  axisLine: false,
  tickMargin: 10,
  minTickGap: 12,
} as const

export const AXIS_Y = {
  tick: CHART.axisTick,
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  width: 60,
} as const

export const CHART_MARGIN = { top: 8, right: 4, bottom: 0, left: 0 }

/** Entrance for Recharts marks: short, ease-out. */
export const CHART_ANIMATION = {
  animationDuration: 500,
  animationEasing: 'ease-out',
  animationBegin: 0,
} as const

/**
 * Axis tick label: currency symbol plus a clean number. Whole numbers drop
 * the decimals, ten thousand and over go compact (12K).
 */
export function formatAxisCurrency(value: number, symbol: string): string {
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    notation: abs >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: abs >= 10_000 ? 1 : 2,
    minimumFractionDigits: 0,
  }).format(abs)
  return `${value < 0 ? '-' : ''}${symbol}${formatted}`
}

/* ---------- Controls ---------- */

/** Small segmented control: surface-3 track, surface-5 active segment. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: React.ReactNode; ariaLabel?: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex flex-none rounded-lg bg-surface-3 p-[3px] shadow-demo-surface', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            aria-label={option.ariaLabel}
            className={cn(
              'tabular h-7 rounded-[5px] px-3 text-label transition-[color,background-color] duration-150 ease-out',
              active ? 'bg-surface-5 text-foreground' : 'text-fg-secondary hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Tables ---------- */

export type SortDirection = 'asc' | 'desc'

/** Header button for a sortable numeric column (right-aligned). */
export function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: React.ReactNode
  active: boolean
  direction: SortDirection
  onClick: () => void
}) {
  const Icon = !active ? ChevronsUpDown : direction === 'desc' ? ChevronDown : ChevronUp
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ml-auto -mr-1 inline-flex items-center gap-1 rounded-xs px-1 py-0.5 transition-colors duration-150 ease-out hover:text-foreground',
        active ? 'text-foreground' : 'text-fg-secondary'
      )}
    >
      {label}
      <Icon aria-hidden="true" className={cn('h-3.5 w-3.5', !active && 'text-fg-gray')} strokeWidth={1.5} />
    </button>
  )
}

/**
 * Hairline frame for a table. Wide tables scroll sideways inside the frame.
 * The first and last columns sit 24px in, aligned with chart cells.
 */
export function TableFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'relative min-w-0 border border-border bg-background',
        // hint that a wide table scrolls sideways inside its frame
        "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-6 after:bg-gradient-to-l after:from-background after:content-[''] lg:after:hidden",
        '[&>div:first-child]:overscroll-x-contain',
        '[&_td:first-child]:pl-5 [&_th:first-child]:pl-5 md:[&_td:first-child]:pl-6 md:[&_th:first-child]:pl-6',
        '[&_td:last-child]:pr-5 [&_th:last-child]:pr-5 md:[&_td:last-child]:pr-6 md:[&_th:last-child]:pr-6',
        className
      )}
    >
      {children}
    </div>
  )
}

/** "x–y of n" label and pagination under a table, inside its frame. */
export function TableFooterBar({
  start,
  end,
  total,
  noun,
  children,
}: {
  start: number
  end: number
  total: number
  noun?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row md:px-6">
      <p className="tabular text-p-sm text-fg-secondary">
        {start}–{end} of {total}
        {noun ? ` ${noun}` : ''}
      </p>
      {children}
    </div>
  )
}

/* ---------- Small marks ---------- */

const MARK_TONE = {
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-warning',
  info: 'bg-info',
  brand: 'bg-brand',
  neutral: 'bg-fg-gray',
} as const

/** 6px square status mark. Colour is never the only cue: pair it with a label. */
export function StatusMark({ tone, className }: { tone: keyof typeof MARK_TONE; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('inline-block h-1.5 w-1.5 flex-none rounded-[1px]', MARK_TONE[tone], className)} />
  )
}

/** Quiet empty state in a hairline cell. */
export function EmptyCell({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border border-border px-6 py-12 text-center">
      <p className="text-p-sm text-foreground">{title}</p>
      {description ? <p className="mt-1 text-p-sm text-fg-secondary">{description}</p> : null}
    </div>
  )
}
