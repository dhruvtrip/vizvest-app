import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tile, TileHeader, TileNote } from '@/components/ui/tile'
import { seriesVar, type SeriesColor } from './palette'

export interface ChartCardProps {
  title: React.ReactNode
  /** Draws the 8px colour key before the title. */
  color?: SeriesColor
  /** Right slot: a segmented control or another small control. */
  action?: React.ReactNode
  /** Right slot: a quiet note such as "avg £120". */
  note?: React.ReactNode
  footnote?: React.ReactNode
  className?: string
  children: React.ReactNode
  headingLevel?: 2 | 3 | 4
}

/**
 * Flat tile that frames one chart: title row with a colour key, a right
 * slot, the chart, an optional footnote. Chart tooltips stay inside it.
 */
export function ChartCard({ title, color, action, note, footnote, className, children, headingLevel = 3 }: ChartCardProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'
  return (
    <Tile data-vz-bounds="" className={cn('relative flex flex-col', className)}>
      <TileHeader className="min-h-8">
        <Heading className="flex min-w-0 items-center gap-2 text-sm font-medium leading-5">
          {color ? <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ background: seriesVar(color) }} /> : null}
          <span className="min-w-0">{title}</span>
        </Heading>
        {note || action ? (
          <div className="flex min-w-0 items-center gap-3">
            {note ? <div className="text-xs font-normal leading-4 text-muted-foreground">{note}</div> : null}
            {action}
          </div>
        ) : null}
      </TileHeader>
      <div className="min-w-0 flex-1">{children}</div>
      {footnote ? <TileNote className="mt-3">{footnote}</TileNote> : null}
    </Tile>
  )
}
