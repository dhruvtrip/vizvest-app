import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * X labels under a row of columns: one slot per column, matching the plot's
 * gap and gutter. The first label hugs the left edge, the last the right
 * edge, the rest sit centred under their column.
 */
export function XLabels({
  labels,
  shown,
  gutter = 0,
  gapClass = 'gap-1',
}: {
  labels: { id: string; label: string }[]
  shown: Set<number>
  gutter?: number
  gapClass?: string
}) {
  const last = labels.length - 1
  return (
    <div aria-hidden className={cn('mt-2 flex h-4 justify-center', gapClass)} style={{ paddingLeft: gutter }}>
      {labels.map((l, i) => (
        <span key={l.id} className="relative min-w-0 max-w-[120px] flex-1">
          {shown.has(i) ? (
            <span
              className={cn(
                'absolute top-0 whitespace-nowrap text-2xs text-muted-foreground',
                labels.length === 1
                  ? 'left-1/2 -translate-x-1/2'
                  : i === 0
                    ? 'left-0'
                    : i === last
                      ? 'right-0'
                      : 'left-1/2 -translate-x-1/2'
              )}
            >
              {l.label}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

/** X labels under a line: positioned along the points (0 to 100%). */
export function PointLabels({ labels, shown, gutter = 0 }: { labels: { id: string; label: string }[]; shown: Set<number>; gutter?: number }) {
  const last = labels.length - 1
  return (
    <div aria-hidden className="relative mt-2 h-4" style={{ marginLeft: gutter }}>
      {labels.map((l, i) =>
        shown.has(i) ? (
          <span
            key={l.id}
            className={cn(
              'absolute top-0 whitespace-nowrap text-2xs text-muted-foreground',
              last <= 0 ? 'right-0' : i === 0 ? 'left-0' : i === last ? 'right-0' : '-translate-x-1/2'
            )}
            style={last > 0 && i !== 0 && i !== last ? { left: `${(i / last) * 100}%` } : undefined}
          >
            {l.label}
          </span>
        ) : null
      )}
    </div>
  )
}
