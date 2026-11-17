'use client'

import { ColumnPlot, type ColumnDatum } from '@/components/charts'
import { ArrowUpRight } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Line, VisualLabel, VisualRoot, euro, useReveal } from './kit'

const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const income = [62.4, 88.1, 71.3, 104.6, 96.2, 83.5, 121.8, 109.4, 97.7, 138.9, 142.1, 168.2]

const byMonth: ColumnDatum[] = income.map((value, index) => ({
  id: months[index],
  label: `${months[index]} ${index < 2 ? 2025 : 2026}`,
  value,
  display: euro(value),
}))

const total = income.reduce((sum, value) => sum + value, 0)

/** Net dividend income by month. The columns rise on reveal, and hover, a tap or the arrow keys read one month. */
export function DividendVisual() {
  const { ref, shown } = useReveal()

  return (
    <VisualRoot rootRef={ref} shown={shown}>
      <Line>
        <VisualLabel>Net dividends, last 12 months</VisualLabel>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="figure text-3xl font-semibold leading-9 tracking-tight">{euro(total)}</p>
          <Badge variant="up">
            <ArrowUpRight size={12} strokeWidth={2} />
            <span className="figure">18.2%</span>
          </Badge>
        </div>
      </Line>

      <Line index={1} raised className="mt-4">
        <div className="rounded-xl bg-muted p-3 pt-4">
          <ColumnPlot
            data={byMonth}
            color={4}
            aria-label="Net dividend income for each of the last 12 months"
            height={152}
            emphasize={(datum) => datum.value >= 138}
            xLabels="auto"
          />
        </div>
      </Line>

      <Line index={2} className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-3 text-xs font-normal leading-4 text-muted-foreground">
        <p>
          <span className="figure text-foreground">53</span> payments
          <span className="max-sm:hidden">
            {' '}
            from <span className="figure text-foreground">9</span> companies
          </span>
        </p>
        <p>
          <span className="figure text-foreground">{euro(226.62)}</span> withheld<span className="max-sm:hidden"> at source</span>
        </p>
      </Line>
    </VisualRoot>
  )
}
