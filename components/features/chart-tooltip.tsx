import { cn } from '@/lib/utils'

export interface ChartTooltipRow {
  name?: string
  value: string
  /** CSS colour of the mark this row describes. Text itself stays in text tokens. */
  color?: string
}

/**
 * Tooltip surface for every Recharts chart. Use from a `content` render prop:
 *   <Tooltip content={({ active, payload, label }) => active && payload?.length
 *     ? <ChartTooltip title={label} rows={[{ value: fmt(payload[0].value) }]} /> : null} />
 */
export function ChartTooltip({
  title,
  rows,
  className,
}: {
  title?: React.ReactNode
  rows: ChartTooltipRow[]
  className?: string
}) {
  return (
    <div className={cn('rounded-field border border-border bg-surface-1 px-3 py-2', className)}>
      {title ? <p className="mb-1 text-label text-fg-secondary">{title}</p> : null}
      <div className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            {row.color ? (
              <span aria-hidden="true" className="h-2 w-2 flex-none rounded-[2px]" style={{ background: row.color }} />
            ) : null}
            {row.name ? <span className="text-label text-fg-secondary">{row.name}</span> : null}
            <span className="tabular ml-auto text-p-sm font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Shared Recharts styling so every chart reads as one system. */
export const CHART = {
  grid: { stroke: 'hsl(var(--border))', strokeDasharray: '4 4', vertical: false },
  axisTick: { fill: 'hsl(var(--fg-gray))', fontSize: 12 },
  cursorBar: { fill: 'rgb(255 255 255 / 0.04)' },
  cursorLine: { stroke: 'hsl(var(--border-hover))', strokeWidth: 1 },
  ink: 'hsl(var(--chart-ink))',
  positive: 'hsl(var(--positive))',
  negative: 'hsl(var(--negative))',
  series: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `hsl(var(--chart-${n}))`),
} as const
