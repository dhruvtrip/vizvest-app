import * as React from 'react'
import { cn } from '@/lib/utils'
import { heatFill, type HeatLevel } from './heat-scale'
import type { SeriesColor } from './palette'

export interface HeatLegendProps {
  color: SeriesColor
  lessLabel?: string
  moreLabel?: string
  className?: string
}

const LEVELS: HeatLevel[] = [0, 1, 2, 3, 4]

/** "Less [five steps] More" key for a calendar heatmap. */
export function HeatLegend({ color, lessLabel = 'Less', moreLabel = 'More', className }: HeatLegendProps) {
  return (
    <div className={cn('flex items-center gap-1.5 text-2xs text-muted-foreground', className)}>
      <span>{lessLabel}</span>
      <span aria-hidden className="flex gap-0.5">
        {LEVELS.map((l) => (
          <span key={l} className="size-2.5 rounded-[2px]" style={{ background: heatFill(l, color) }} />
        ))}
      </span>
      <span>{moreLabel}</span>
    </div>
  )
}
