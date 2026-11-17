'use client'

import { useState } from 'react'
import { AreaTrend, type AreaDatum } from '@/components/charts'
import { ArrowUpRight } from '@/components/icons'
import { NumberChange, SlidingTabs } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { Line, VisualLabel, VisualRoot, seeded, signedEuro, useReveal } from './kit'

type Range = '1M' | '6M' | '1Y' | 'All'

interface RangeSpec {
  value: Range
  label: string
  points: number
  stepDays: number
  total: number
  gain: string
  sells: number
  seed: number
}

const RANGES: RangeSpec[] = [
  { value: '1M', label: '1M', points: 31, stepDays: 1, total: 286.4, gain: '4.2%', sells: 6, seed: 3 },
  { value: '6M', label: '6M', points: 27, stepDays: 7, total: 1412.8, gain: '9.8%', sells: 31, seed: 5 },
  { value: '1Y', label: '1Y', points: 53, stepDays: 7, total: 2406.35, gain: '12.6%', sells: 58, seed: 7 },
  { value: 'All', label: 'All', points: 48, stepDays: 14, total: 3181.6, gain: '14.1%', sells: 81, seed: 11 },
]

const DAY_MS = 86_400_000
const LAST_DAY = Date.UTC(2026, 9, 30)
const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Running realised profit: a rising trend with a wobble and one drawdown, ending on the range's total. */
function buildSeries({ points, stepDays, total, seed }: RangeSpec): AreaDatum[] {
  const rnd = seeded(seed)
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1)
    const trend = total * Math.pow(t, 1.2)
    const wave = total * 0.08 * Math.sin(t * 22) * (0.3 + t)
    const dip = t > 0.5 && t < 0.7 ? -total * 0.2 * Math.sin(((t - 0.5) / 0.2) * Math.PI) : 0
    const noise = (rnd() - 0.5) * total * 0.05
    const value = i === 0 ? 0 : i === points - 1 ? total : Math.max(0, trend + wave + dip + noise)
    const time = LAST_DAY - (points - 1 - i) * stepDays * DAY_MS
    return { id: String(time), label: DATE_FORMAT.format(time), value, display: signedEuro(value) }
  })
}

const SERIES = Object.fromEntries(RANGES.map((range) => [range.value, buildSeries(range)])) as Record<Range, AreaDatum[]>

/** Realised profit over a period. The toggle redraws the line, and the pointer or arrow keys read any point on it. */
export function PnlVisual() {
  const { ref, shown } = useReveal()
  const [range, setRange] = useState<Range>('1Y')
  const spec = RANGES.find((item) => item.value === range) ?? RANGES[2]

  return (
    <VisualRoot rootRef={ref} shown={shown}>
      <Line className="flex items-center justify-between gap-3">
        <VisualLabel>Realised profit</VisualLabel>
        <SlidingTabs variant="segmented" size="sm" aria-label="Period" items={RANGES} value={range} onValueChange={setRange} />
      </Line>

      <Line index={1} className="mt-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <NumberChange value={signedEuro(spec.total)} className="text-3xl font-semibold leading-9 tracking-tight" />
          <Badge variant="up">
            <ArrowUpRight size={12} strokeWidth={2} />
            <NumberChange value={spec.gain} />
          </Badge>
        </div>
        <p className="mt-1 text-xs font-normal leading-4 text-muted-foreground">
          From <NumberChange value={String(spec.sells)} className="text-foreground" /> closed trades
        </p>
      </Line>

      <Line index={2} raised className="mt-auto pt-4">
        <div className="rounded-xl bg-muted p-3 pt-4">
          {/* A new key per period, so the line draws in again from the left. */}
          <AreaTrend
            key={range}
            data={SERIES[range]}
            color={2}
            aria-label={`Realised profit, ${spec.label === 'All' ? 'all time' : `last ${spec.label}`}`}
            height={128}
            xLabels="ends"
          />
        </div>
      </Line>
    </VisualRoot>
  )
}
