'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { isTradeAction, isBuyAction } from '@/lib/transaction-utils'
import {
  ChartCard,
  ChartTooltip,
  ChartTooltipRow,
  HeatLegend,
  heatFill,
  type HeatLevel
} from '@/components/charts'
import { TextSwap } from '@/components/motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from '@/components/icons'

interface TradingHeatmapProps {
  transactions: NormalizedTransaction[]
  className?: string
  /** Formats a day's traded volume (base currency) for the tooltip. Volume is left out without it. */
  formatVolume?: (amount: number) => string
}

interface DayData {
  date: Date
  count: number
  level: number
  buys: number
  sells: number
  volume: number
}

interface CellData {
  date: Date | null
  count: number
  level: number
  buys: number
  sells: number
  volume: number
  /** Day of the year, from 0. -1 for the padding cells before Jan 1 and after Dec 31. */
  day: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Heatmap hue: chart-3 is trading activity across the app. */
const HEAT_COLOR = 3
/** Hover opens the tooltip after this delay; moving between days while it is open is instant. */
const OPEN_DELAY_MS = 100

const EMPTY_CELL: CellData = { date: null, count: 0, level: 0, buys: 0, sells: 0, volume: 0, day: -1 }

// Calculate activity level from count
const getActivityLevel = (count: number): number => {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

// Get first day of year and its day of week
const getFirstDayOfYear = (year: number): { date: Date; dayOfWeek: number } => {
  const firstDay = new Date(year, 0, 1)
  const dayOfWeek = firstDay.getDay()
  return { date: firstDay, dayOfWeek }
}

// Get number of days in year
const getDaysInYear = (year: number): number => {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365
}

// Process transactions to get activity by date
function processTransactions(
  transactions: NormalizedTransaction[],
  year: number
): Map<string, DayData> {
  const activityMap = new Map<string, DayData>()

  // Filter to only buy/sell trades (Market and Limit orders)
  const trades = transactions.filter((t) => isTradeAction(t.Action))

  // Group by date
  for (const trade of trades) {
    const date = new Date(trade.Time)
    if (date.getFullYear() !== year) continue

    // Normalize to date string (YYYY-MM-DD)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    // Display-only split for the tooltip
    const isBuy = isBuyAction(trade.Action)
    const volume = Math.abs(trade.totalInBaseCurrency || 0)

    const existing = activityMap.get(dateKey)
    if (existing) {
      existing.count++
      existing.level = getActivityLevel(existing.count)
      existing.buys += isBuy ? 1 : 0
      existing.sells += isBuy ? 0 : 1
      existing.volume += volume
    } else {
      activityMap.set(dateKey, {
        date,
        count: 1,
        level: 1,
        buys: isBuy ? 1 : 0,
        sells: isBuy ? 0 : 1,
        volume
      })
    }
  }

  return activityMap
}

// Generate grid cells for the year
function generateGrid(year: number, activityMap: Map<string, DayData>): {
  cells: CellData[][]
  monthLabels: { month: number; week: number }[]
} {
  const { dayOfWeek: firstDayOfWeek } = getFirstDayOfYear(year)
  const daysInYear = getDaysInYear(year)

  // Calculate total weeks needed (including partial first week)
  const totalWeeks = Math.ceil((firstDayOfWeek + daysInYear) / 7)

  // Initialize grid: 7 rows (days of week) × totalWeeks columns
  const cells: CellData[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: totalWeeks }, () => ({ ...EMPTY_CELL }))
  )

  // Track month labels (which week each month starts)
  const monthLabels: { month: number; week: number }[] = []

  // Fill grid with days of the year
  for (let day = 0; day < daysInYear; day++) {
    const currentDate = new Date(year, 0, day + 1)
    const currentDayOfWeek = currentDate.getDay()
    // Day 0 (Jan 1) at firstDayOfWeek is in week 0, so week = floor((firstDayOfWeek + day) / 7)
    const week = Math.floor((firstDayOfWeek + day) / 7)

    // Only add a month label on the 1st of the month
    const month = currentDate.getMonth()
    const dateOfMonth = currentDate.getDate()
    if (dateOfMonth === 1) {
      const existingLabel = monthLabels.find((m) => m.month === month)
      if (!existingLabel) {
        monthLabels.push({ month, week })
      }
    }

    // Get activity for this date
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateOfMonth).padStart(2, '0')}`
    const activity = activityMap.get(dateKey)

    cells[currentDayOfWeek][week] = {
      date: currentDate,
      count: activity?.count ?? 0,
      level: activity?.level ?? 0,
      buys: activity?.buys ?? 0,
      sells: activity?.sells ?? 0,
      volume: activity?.volume ?? 0,
      day
    }
  }

  // Sort month labels by week to ensure correct order
  monthLabels.sort((a, b) => a.week - b.week)

  return { cells, monthLabels }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const tooltipDate = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

const cellLabel = (cell: CellData) => {
  if (!cell.date) return ''
  const date = cell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  if (cell.count === 0) return `${date}: no trades`
  return `${date}: ${plural(cell.count, 'trade', 'trades')}, ${plural(cell.buys, 'buy', 'buys')}, ${plural(cell.sells, 'sell', 'sells')}`
}

/**
 * Calendar of trades per day for one year, coloured on the chart-3 heat
 * scale. When the transactions span several years it pages between them
 * (most recent first); a single year shows without the pager.
 */
export function TradingHeatmap({ transactions, className, formatVolume }: TradingHeatmapProps) {
  // Extract unique years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    const trades = transactions.filter((t) => isTradeAction(t.Action))
    for (const trade of trades) {
      const date = new Date(trade.Time)
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear())
      }
    }
    return Array.from(years).sort((a, b) => b - a) // Most recent first
  }, [transactions])

  // The year the pager moved to. New transactions (the page's year filter
  // changed) send the calendar back to the most recent year.
  const [pagedYear, setPagedYear] = useState<number | null>(null)
  const [seenTransactions, setSeenTransactions] = useState(transactions)
  if (seenTransactions !== transactions) {
    setSeenTransactions(transactions)
    setPagedYear(null)
  }
  const selectedYear =
    pagedYear !== null && availableYears.includes(pagedYear)
      ? pagedYear
      : availableYears.length > 0
        ? availableYears[0]
        : new Date().getFullYear()
  const yearIndex = availableYears.indexOf(selectedYear)
  const olderYear = yearIndex >= 0 ? availableYears[yearIndex + 1] : undefined
  const newerYear = yearIndex > 0 ? availableYears[yearIndex - 1] : undefined

  // Process transactions for selected year
  const { cells, monthLabels } = useMemo(() => {
    if (availableYears.length === 0) {
      return { cells: [] as CellData[][], monthLabels: [] as { month: number; week: number }[] }
    }
    const activityMap = processTransactions(transactions, selectedYear)
    return generateGrid(selectedYear, activityMap)
  }, [transactions, selectedYear, availableYears.length])

  // Calculate total contributions for selected year
  const totalContributions = useMemo(() => {
    const trades = transactions.filter((t) => isTradeAction(t.Action))
    return trades.filter((t) => {
      const date = new Date(t.Time)
      return date.getFullYear() === selectedYear
    }).length
  }, [transactions, selectedYear])

  // Display data: the grid by week, every real day by its index, and the most recent active day.
  const { weeks, byDay, activeDays, lastActiveDay } = useMemo(() => {
    const totalWeeks = cells.length > 0 ? cells[0].length : 0
    const weekList: CellData[][] = Array.from({ length: totalWeeks }, (_, w) => cells.map((row) => row[w]))
    const dayList: CellData[] = []
    let active = 0
    let last = -1
    for (const week of weekList) {
      for (const cell of week) {
        if (cell.day < 0) continue
        dayList[cell.day] = cell
        if (cell.count > 0) {
          active++
          last = Math.max(last, cell.day)
        }
      }
    }
    return { weeks: weekList, byDay: dayList, activeDays: active, lastActiveDay: last }
  }, [cells])

  const monthAtWeek = useMemo(() => new Map(monthLabels.map((m) => [m.week, m.month])), [monthLabels])

  // Keyboard: one day is in the tab order; arrow keys move it.
  const [focusDay, setFocusDay] = useState<number | null>(null)
  const tabDay =
    focusDay !== null && focusDay < byDay.length ? focusDay : lastActiveDay >= 0 ? lastActiveDay : Math.max(0, byDay.length - 1)

  // Tooltip: opens after a short delay from a day with trades, then follows
  // the pointer or focus from day to day without fading again.
  const boxRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Array<HTMLDivElement | null>>([])
  const openTimer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const [tipDay, setTipDay] = useState<number | null>(null)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })

  const clearTimer = () => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
  }

  const hide = () => {
    clearTimer()
    setOpen(false)
    setActiveDay(null)
  }

  const anchorTo = (el: HTMLElement, box: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    setAnchor({ x: r.left + r.width / 2 - b.left, y: r.top - b.top })
  }

  // Scrolling the calendar keeps the tooltip on its day, and closes it once the day leaves the view.
  const followScroll = () => {
    if (activeDay === null) return
    const el = cellRefs.current[activeDay]
    const box = boxRef.current
    const scroller = scrollRef.current
    if (!el || !box || !scroller) return hide()
    const r = el.getBoundingClientRect()
    const s = scroller.getBoundingClientRect()
    if (r.right < s.left || r.left > s.right) return hide()
    anchorTo(el, box)
  }

  const showDay = (day: number, immediate: boolean) => {
    const cell = byDay[day]
    const el = cellRefs.current[day]
    const box = boxRef.current
    if (!cell || !el || !box) return
    if (!open && cell.count === 0 && !immediate) {
      // Only a day with trades opens the tooltip on hover.
      clearTimer()
      setActiveDay(null)
      return
    }
    anchorTo(el, box)
    setActiveDay(day)
    setTipDay(day)
    if (open || immediate) {
      clearTimer()
      setOpen(true)
    } else if (openTimer.current === null) {
      openTimer.current = window.setTimeout(() => {
        openTimer.current = null
        setOpen(true)
      }, OPEN_DELAY_MS)
    }
  }

  // Close on a press outside the calendar (touch has no pointer leave).
  useEffect(() => {
    if (activeDay === null) return
    const onDown = (e: PointerEvent) => {
      const box = boxRef.current
      if (box && e.target instanceof Node && !box.contains(e.target)) hide()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  })

  useEffect(() => {
    const timer = openTimer
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  // On narrow screens the calendar scrolls inside its card: start on the most recent weeks.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [selectedYear, weeks.length])

  if (availableYears.length === 0) {
    return null
  }

  const dayFromEvent = (target: EventTarget | null): number | null => {
    if (!(target instanceof Element)) return null
    const el = target.closest<HTMLElement>('[data-day]')
    if (!el) return null
    const day = Number(el.dataset.day)
    return Number.isFinite(day) ? day : null
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const day = dayFromEvent(e.target)
    if (day === null) return
    if (e.key === 'Escape') {
      hide()
      return
    }
    const last = byDay.length - 1
    let next: number | null = null
    if (e.key === 'ArrowUp') next = day - 1
    else if (e.key === 'ArrowDown') next = day + 1
    else if (e.key === 'ArrowLeft') next = day - 7
    else if (e.key === 'ArrowRight') next = day + 7
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    next = Math.max(0, Math.min(last, next))
    if (next !== day) cellRefs.current[next]?.focus()
  }

  const tip = tipDay !== null ? byDay[tipDay] : undefined
  const pager = availableYears.length > 1

  return (
    <ChartCard
      title="Trades per day"
      color={HEAT_COLOR}
      className={className}
      note={pager ? plural(totalContributions, 'trade', 'trades') : `${plural(totalContributions, 'trade', 'trades')} in ${selectedYear}`}
      action={
        pager ? (
          <div className="flex items-center gap-0.5" role="group" aria-label="Calendar year">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={olderYear ? `Show ${olderYear}` : 'Previous year'}
              disabled={olderYear === undefined}
              onClick={() => olderYear !== undefined && setPagedYear(olderYear)}
            >
              <ChevronLeft size={16} />
            </Button>
            <TextSwap text={String(selectedYear)} live className="figure min-w-[2.25rem] text-center text-xs font-medium" />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={newerYear ? `Show ${newerYear}` : 'Next year'}
              disabled={newerYear === undefined}
              onClick={() => newerYear !== undefined && setPagedYear(newerYear)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        ) : undefined
      }
    >
      <div ref={boxRef} className="relative">
        <div
          ref={scrollRef}
          className="-m-1.5 overflow-x-auto overscroll-x-contain p-1.5"
          onScroll={followScroll}
        >
          <div className="flex min-w-fit gap-2">
            {/* Weekday labels: Mon, Wed, Fri */}
            <div className="sticky -left-1.5 z-[1] -ms-1.5 flex w-9 shrink-0 flex-col bg-tile ps-1.5" aria-hidden>
              <div className="mb-1 h-4" />
              <div className="grid flex-1 grid-rows-7 gap-[3px]">
                {DAYS.map((day, idx) => (
                  <div key={day} className="flex items-center text-2xs leading-none text-muted-foreground">
                    {idx === 1 || idx === 3 || idx === 5 ? day : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              {/* Month labels */}
              <div className="mb-1 flex h-4 gap-[3px]" aria-hidden>
                {weeks.map((_, weekIdx) => {
                  const month = monthAtWeek.get(weekIdx)
                  return (
                    <div key={weekIdx} className="relative min-w-[11px] flex-1">
                      {month !== undefined ? (
                        <span className="absolute left-0 top-0 whitespace-nowrap text-2xs leading-4 text-muted-foreground">
                          {MONTHS[month]}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              {/* Days */}
              <div
                role="group"
                aria-label={`Trades per day in ${selectedYear}: ${plural(totalContributions, 'trade', 'trades')} on ${plural(activeDays, 'day', 'days')}. Arrow keys move between days.`}
                className="flex gap-[3px]"
                onPointerMove={(e) => {
                  const day = dayFromEvent(e.target)
                  if (day !== null && day !== activeDay) showDay(day, e.pointerType !== 'mouse')
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') hide()
                }}
                onFocus={(e) => {
                  const day = dayFromEvent(e.target)
                  if (day === null) return
                  setFocusDay(day)
                  showDay(day, true)
                }}
                onBlur={(e) => {
                  if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) hide()
                }}
                onKeyDown={onKeyDown}
              >
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex min-w-[11px] flex-1 flex-col gap-[3px]">
                    {week.map((cell, dayIdx) => {
                      if (!cell.date || cell.day < 0) {
                        return <div key={dayIdx} className="aspect-square w-full" aria-hidden />
                      }
                      return (
                        <div
                          key={dayIdx}
                          ref={(el) => {
                            cellRefs.current[cell.day] = el
                          }}
                          data-day={cell.day}
                          data-active={activeDay === cell.day ? 'true' : undefined}
                          role="img"
                          aria-label={cellLabel(cell)}
                          tabIndex={cell.day === tabDay ? 0 : -1}
                          className={cn(
                            'aspect-square w-full rounded-[3px] transition-[background-color,box-shadow] duration-300 ease-smooth-out',
                            'data-[active=true]:ring-1 data-[active=true]:ring-foreground/70',
                            cell.count > 0 ? 'cursor-pointer' : 'cursor-default'
                          )}
                          style={{ background: heatFill(cell.level as HeatLevel, HEAT_COLOR) }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ChartTooltip open={open && tip !== undefined} x={anchor.x} y={anchor.y}>
          {tip?.date ? (
            <div className="min-w-[9rem] space-y-1">
              <div className="text-2xs text-muted-foreground">{tooltipDate(tip.date)}</div>
              <div className="figure text-sm font-medium leading-5">
                {tip.count === 0 ? 'No trades' : plural(tip.count, 'trade', 'trades')}
              </div>
              {tip.count > 0 ? (
                <>
                  <ChartTooltipRow color={1} label="Buys" value={tip.buys} />
                  <ChartTooltipRow color={6} label="Sells" value={tip.sells} />
                  {formatVolume ? (
                    <div className="border-t border-border pt-1">
                      <ChartTooltipRow label="Volume" value={formatVolume(tip.volume)} />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </ChartTooltip>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="figure text-xs font-normal text-muted-foreground">
          {plural(activeDays, 'active day', 'active days')} in {selectedYear}
        </p>
        <HeatLegend color={HEAT_COLOR} />
      </div>
    </ChartCard>
  )
}
