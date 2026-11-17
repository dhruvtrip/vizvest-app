'use client'

import { useMemo, useRef, useState } from 'react'
import { ChartTooltip, ChartTooltipBody, HeatLegend, heatFill, heatLevel } from '@/components/charts'
import { NumberChange, SlidingTabs } from '@/components/motion'
import { Line, VisualLabel, VisualRoot, seeded, useReveal } from './kit'

type Year = '2025' | '2026'

const YEARS: { value: Year; label: string }[] = [
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
]

const WEEKS = 52
const WEEKDAYS = 5
/** Each year is drawn as two rows of 26 weeks, so the cells stay readable on a phone. */
const HALF = WEEKS / 2
const DAY_MS = 86_400_000
/** The sample export ends here, so later days in 2026 are still empty. */
const LAST_DAY = Date.UTC(2026, 9, 30)
const FIRST_MONDAY: Record<Year, number> = { '2025': Date.UTC(2025, 0, 6), '2026': Date.UTC(2026, 0, 5) }
const MOST_TRADES = 4
const COLOR = 3

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri']
const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

interface Day {
  time: number
  count: number
}

/** Weekdays in order, week by week, with bursts of activity. Stops at the end of the year or of the export. */
function buildYear(year: Year): Day[] {
  const rnd = seeded(year === '2025' ? 212 : 2026)
  const days: Day[] = []
  for (let week = 0; week < WEEKS; week++) {
    const busy = 0.28 + 0.42 * Math.sin(week / 5 + (year === '2026' ? 1.4 : 0)) ** 2
    for (let weekday = 0; weekday < WEEKDAYS; weekday++) {
      const time = FIRST_MONDAY[year] + (week * 7 + weekday) * DAY_MS
      const roll = rnd()
      const size = rnd()
      if (time > LAST_DAY || new Date(time).getUTCFullYear() !== Number(year)) continue
      const count = roll < busy ? (size < 0.5 ? 1 : size < 0.78 ? 2 : size < 0.93 ? 3 : 4) : 0
      days.push({ time, count })
    }
  }
  return days
}

const DATA: Record<Year, Day[]> = { '2025': buildYear('2025'), '2026': buildYear('2026') }

function summarise(days: Day[]) {
  const perMonth = new Array<number>(12).fill(0)
  let trades = 0
  let tradingDays = 0
  for (const day of days) {
    trades += day.count
    if (day.count > 0) tradingDays += 1
    perMonth[new Date(day.time).getUTCMonth()] += day.count
  }
  return { trades, tradingDays, busiest: MONTH_NAMES[perMonth.indexOf(Math.max(...perMonth))] }
}

const tradesText = (count: number) => (count === 0 ? 'No trades' : count === 1 ? '1 trade' : `${count} trades`)

/** A year of trading days. The toggle swaps the year, and hover, a tap or the arrow keys read one day. */
export function HeatmapVisual() {
  const { ref, shown } = useReveal()
  const boxRef = useRef<HTMLDivElement>(null)
  const [year, setYear] = useState<Year>('2026')
  const [active, setActive] = useState<number | null>(null)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })

  const days = DATA[year]
  const summary = useMemo(() => summarise(days), [days])
  const last = days.length - 1
  const activeDay = active !== null ? (days[active] ?? null) : null

  const point = (index: number) => {
    const box = boxRef.current
    const cell = box?.querySelector<HTMLElement>(`[data-day="${index}"]`)
    if (!box || !cell) return
    const c = cell.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    setAnchor({ x: c.left + c.width / 2 - b.left, y: c.top - b.top })
    setActive(index)
  }

  const fromPointer = (event: React.PointerEvent) => {
    const cell = (event.target as Element).closest<HTMLElement>('[data-day]')
    if (cell) point(Number(cell.dataset.day))
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setActive(null)
      return
    }
    const from = active ?? last
    const next =
      event.key === 'ArrowRight' ? from + WEEKDAYS
      : event.key === 'ArrowLeft' ? from - WEEKDAYS
      : event.key === 'ArrowDown' ? from + 1
      : event.key === 'ArrowUp' ? from - 1
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null) return
    event.preventDefault()
    point(Math.min(last, Math.max(0, next)))
  }

  return (
    <VisualRoot rootRef={ref} shown={shown}>
      <Line className="flex items-center justify-between gap-3">
        <VisualLabel>Trading days</VisualLabel>
        <SlidingTabs
          variant="segmented"
          size="sm"
          aria-label="Year"
          items={YEARS}
          value={year}
          onValueChange={(next) => {
            setActive(null)
            setYear(next)
          }}
        />
      </Line>

      <Line index={1} raised className="mt-4">
        <div ref={boxRef} className="relative rounded-xl bg-muted p-3">
          <div
            role="group"
            tabIndex={0}
            aria-label={`Trades on each weekday of ${year}. Use the arrow keys to read each day.`}
            className="rounded-md md:touch-pan-y"
            onPointerMove={fromPointer}
            onPointerDown={fromPointer}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') setActive(null)
            }}
            onFocus={() => point(active ?? last)}
            onBlur={() => setActive(null)}
            onKeyDown={onKeyDown}
          >
            {[0, 1].map((half) => (
              <div key={half} className={half === 1 ? 'mt-3' : undefined}>
                <div aria-hidden="true" className="mb-1.5 grid grid-cols-6 text-2xs text-muted-foreground sm:pl-8">
                  {MONTHS.slice(half * 6, half * 6 + 6).map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
                <div className="flex">
                  <div aria-hidden="true" className="hidden w-8 shrink-0 grid-rows-5 gap-[3px] text-2xs text-muted-foreground sm:grid">
                    {WEEKDAY_LABELS.map((label, row) => (
                      <span key={row} className="flex items-center leading-none">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="grid flex-1 grid-cols-[repeat(26,minmax(0,1fr))] gap-[3px]">
                    {Array.from({ length: WEEKDAYS * HALF }, (_, slot) => {
                      const weekday = Math.floor(slot / HALF)
                      const column = slot % HALF
                      const index = (half * HALF + column) * WEEKDAYS + weekday
                      const day = days[index]
                      if (!day) return <span key={slot} className="aspect-square rounded-[3px] bg-background opacity-40" />
                      return (
                        <span
                          key={slot}
                          data-day={index}
                          data-active={active === index || undefined}
                          className="relative aspect-square rounded-[3px] bg-background outline-1 outline-offset-1 outline-foreground data-[active]:outline"
                        >
                          {shown && day.count > 0 ? (
                            <span
                              key={year}
                              className="fv-heat-fill absolute inset-0 rounded-[inherit]"
                              style={{
                                background: heatFill(heatLevel(day.count, MOST_TRADES), COLOR),
                                animationDelay: `${column * 14 + weekday * 22}ms`,
                              }}
                            />
                          ) : null}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ChartTooltip open={activeDay !== null} x={anchor.x} y={anchor.y}>
            {activeDay ? <ChartTooltipBody label={DAY_FORMAT.format(activeDay.time)} value={tradesText(activeDay.count)} /> : null}
          </ChartTooltip>
          <p className="sr-only" aria-live="polite">
            {activeDay ? `${DAY_FORMAT.format(activeDay.time)}: ${tradesText(activeDay.count)}` : ''}
          </p>
        </div>
      </Line>

      <Line index={2} className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
        <HeatLegend color={COLOR} />
        <p className="text-xs font-normal leading-4 text-muted-foreground">
          <NumberChange value={String(summary.trades)} className="font-medium text-foreground" /> trades on{' '}
          <NumberChange value={String(summary.tradingDays)} className="font-medium text-foreground" /> days, busiest in{' '}
          {summary.busiest}
        </p>
      </Line>
    </VisualRoot>
  )
}
