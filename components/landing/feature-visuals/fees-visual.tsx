'use client'

import { useState } from 'react'
import { StackedMeter, seriesVar, type Segment } from '@/components/charts'
import { NumberChange } from '@/components/motion'
import { cn } from '@/lib/utils'
import { Line, VisualLabel, VisualRoot, euro, signedEuro, useReveal } from './kit'

const REALISED = 3181.6

const costs: Segment[] = [
  { id: 'fx', label: 'Currency conversion fees', value: 167.59, display: euro(167.59), color: 5 },
  { id: 'us', label: 'US withholding tax', value: 181.3, display: euro(181.3), color: 6 },
  { id: 'eu', label: 'EU withholding tax', value: 45.32, display: euro(45.32), color: 1 },
]

const total = costs.reduce((sum, cost) => sum + cost.value, 0)
const share = (value: number, whole: number) => `${((value / whole) * 100).toFixed(1)}%`

/** What trading cost, split into its parts. Hover or focus a row to light its part of the bar and read its share; a click keeps it lit. */
export function FeesVisual() {
  const { ref, shown } = useReveal()
  const [hovered, setHovered] = useState<string | null>(null)
  const [barHovered, setBarHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const lit = barHovered ?? hovered ?? pinned
  const largest = costs.reduce((a, b) => (b.value > a.value ? b : a))
  const inFocus = costs.find((cost) => cost.id === lit) ?? largest

  return (
    <VisualRoot rootRef={ref} shown={shown}>
      <Line className="flex items-start justify-between gap-4">
        <div>
          <VisualLabel>Costs so far</VisualLabel>
          <p className="figure mt-1 text-3xl font-semibold leading-9 tracking-tight">{euro(total)}</p>
        </div>
        <p className="text-right text-xs font-normal leading-4 text-muted-foreground">
          {share(total, REALISED)} of your
          <br />
          <span className="figure text-up">{signedEuro(REALISED)}</span> profit
        </p>
      </Line>

      <Line index={1} raised className="mt-4">
        <div className="rounded-xl bg-muted p-3">
          <p className="mb-3 flex items-baseline justify-between gap-3 text-xs font-normal leading-4">
            <span className="min-w-0 truncate text-muted-foreground">{lit ? inFocus.label : `Largest: ${inFocus.label}`}</span>
            <NumberChange value={share(inFocus.value, total)} className="font-medium" />
          </p>
          <StackedMeter
            segments={costs}
            aria-label="Costs by type"
            legend={false}
            activeId={hovered ?? pinned}
            onActiveChange={setBarHovered}
          />
        </div>
      </Line>

      <Line index={2} className="mt-auto pt-3">
        <ul className="rounded-xl bg-background px-2 sm:px-3">
          {costs.map((cost) => {
            const on = lit === cost.id
            return (
              <li key={cost.id} className="border-t border-border/60 first:border-t-0">
                <button
                  type="button"
                  aria-pressed={pinned === cost.id}
                  className="flex w-full items-center gap-2.5 rounded-md py-2.5 text-left text-sm font-normal"
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setHovered(cost.id)
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') setHovered(null)
                  }}
                  onFocus={() => setHovered(cost.id)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setPinned(pinned === cost.id ? null : cost.id)}
                >
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-[2px] transition-opacity duration-150 ease-ui"
                    style={{ background: seriesVar(cost.color), opacity: lit && !on ? 0.25 : 1 }}
                  />
                  <span className={cn('min-w-0 flex-1 truncate transition-colors duration-150 ease-ui', on ? 'text-foreground' : 'text-muted-foreground')}>
                    {cost.label}
                  </span>
                  <span className="figure whitespace-nowrap">{cost.display}</span>
                </button>
              </li>
            )
          })}
          <li className="flex items-center gap-2.5 border-t border-border/60 py-2.5 text-sm font-normal">
            <span className="min-w-0 flex-1 truncate text-muted-foreground">Left after costs</span>
            <span className="figure whitespace-nowrap text-up">{signedEuro(REALISED - total)}</span>
          </li>
        </ul>
      </Line>
    </VisualRoot>
  )
}
