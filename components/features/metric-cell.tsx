import { cn } from '@/lib/utils'

export type MetricTone = 'default' | 'positive' | 'negative' | 'muted'

const TONE_CLASS: Record<MetricTone, string> = {
  default: 'text-foreground',
  positive: 'text-positive',
  negative: 'text-negative',
  muted: 'text-fg-secondary',
}

interface MetricCellProps {
  label: React.ReactNode
  /** The figure. Pass a string, or an animated number component. */
  value: React.ReactNode
  /** Short supporting line under the figure */
  sub?: React.ReactNode
  tone?: MetricTone
  /** `lg` is the 32px page-level figure, `md` the 24px one for dense groups */
  size?: 'md' | 'lg'
  /** Optional element on the right of the label (info icon, chip) */
  aside?: React.ReactNode
  className?: string
}

/**
 * One figure in a hairline grid. Wrap a group in `<MetricGrid>`: cells share
 * borders, so there is no gap, radius or shadow.
 */
export function MetricCell({ label, value, sub, tone = 'default', size = 'lg', aside, className }: MetricCellProps) {
  return (
    <div className={cn('flex min-h-[124px] flex-col justify-between gap-6 bg-background p-5 md:p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-label text-fg-secondary">{label}</p>
        {aside}
      </div>
      <div>
        <p className={cn('metric-figure tabular whitespace-nowrap', size === 'lg' ? 'text-h4 md:text-h3' : 'text-h5 md:text-h4', TONE_CLASS[tone])}>
          {value}
        </p>
        {sub ? <p className="mt-1 text-p-sm text-fg-gray">{sub}</p> : null}
      </div>
    </div>
  )
}

const COLS: Record<2 | 3 | 4 | 5, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-4',
  // five across leaves ~150px per figure below 1536px, so figures step down one size there
  5: 'grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 xl:max-2xl:[&_.metric-figure]:text-h4',
}

export function MetricGrid({
  columns = 3,
  className,
  children,
}: {
  columns?: 2 | 3 | 4 | 5
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('cell-grid', COLS[columns], className)}>{children}</div>
}
