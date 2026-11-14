'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { NormalizedTransaction } from '@/types/trading212'
import { isTradeAction } from '@/lib/transaction-utils'
import { ChartTooltip } from '@/components/features/chart-tooltip'
import { Segmented } from '@/components/features/analysis-kit'

interface TradingHeatmapProps {
  transactions: NormalizedTransaction[]
  className?: string
}

interface DayData {
  date: Date
  count: number
  level: number
}

interface CellData {
  date: Date | null
  count: number
  level: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Width of the day-label column, in px */
const DAY_LABEL_WIDTH = 28
/** Gap between cells, in px */
const CELL_GAP = 2

// Color levels for activity intensity
const getColorClass = (level: number) => {
  switch (level) {
    case 0:
      return 'bg-surface-3'
    case 1:
      return 'bg-brand/25'
    case 2:
      return 'bg-brand/50'
    case 3:
      return 'bg-brand/75'
    case 4:
      return 'bg-brand'
    default:
      return 'bg-surface-3'
  }
}

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

    const existing = activityMap.get(dateKey)
    if (existing) {
      existing.count++
      existing.level = getActivityLevel(existing.count)
    } else {
      activityMap.set(dateKey, {
        date,
        count: 1,
        level: 1
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
    Array.from({ length: totalWeeks }, () => ({
      date: null,
      count: 0,
      level: 0
    }))
  )

  // Track month labels (which week each month starts)
  const monthLabels: { month: number; week: number }[] = []
  const monthWeeks = new Set<number>()

  // Fill grid with days of the year
  for (let day = 0; day < daysInYear; day++) {
    const currentDate = new Date(year, 0, day + 1)
    const currentDayOfWeek = currentDate.getDay()
    // Calculate which week column this day belongs to
    // Day 0 (Jan 1) at firstDayOfWeek should be in week 0
    // So: week = floor((firstDayOfWeek + day) / 7)
    const week = Math.floor((firstDayOfWeek + day) / 7)

    // Check if this is the first day of a month
    // Only add month label if it's the 1st of the month
    const month = currentDate.getMonth()
    const dateOfMonth = currentDate.getDate()
    if (dateOfMonth === 1) {
      // Find if we already have a label for this month
      const existingLabel = monthLabels.find((m) => m.month === month)
      if (!existingLabel) {
        monthLabels.push({ month, week })
      }
    }

    // Get activity for this date
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateOfMonth).padStart(2, '0')}`
    const activity = activityMap.get(dateKey)

    if (activity) {
      cells[currentDayOfWeek][week] = {
        date: currentDate,
        count: activity.count,
        level: activity.level
      }
    } else {
      cells[currentDayOfWeek][week] = {
        date: currentDate,
        count: 0,
        level: 0
      }
    }
  }

  // Sort month labels by week to ensure correct order
  monthLabels.sort((a, b) => a.week - b.week)

  return { cells, monthLabels }
}

export function TradingHeatmap({ transactions, className }: TradingHeatmapProps) {
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

  // Default to most recent year
  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears.length > 0 ? availableYears[0] : new Date().getFullYear()
  )
  // If the parent's year filter removes the selected year, fall back to the most recent one
  const activeYear = availableYears.includes(selectedYear)
    ? selectedYear
    : (availableYears[0] ?? selectedYear)

  // Process transactions for selected year
  const { cells, monthLabels } = useMemo(() => {
    if (availableYears.length === 0) {
      return { cells: [], monthLabels: [] }
    }
    const activityMap = processTransactions(transactions, activeYear)
    return generateGrid(activeYear, activityMap)
  }, [transactions, activeYear, availableYears.length])

  // Calculate total contributions for selected year
  const totalContributions = useMemo(() => {
    const trades = transactions.filter((t) => isTradeAction(t.Action))
    return trades.filter((t) => {
      const date = new Date(t.Time)
      return date.getFullYear() === activeYear
    }).length
  }, [transactions, activeYear])

  const activeDays = useMemo(
    () => cells.reduce((sum, row) => sum + row.filter((c) => c.count > 0).length, 0),
    [cells]
  )

  // Hover / focus state for the tooltip, positioned relative to the frame
  const frameRef = useRef<HTMLDivElement>(null)
  const [hoveredCell, setHoveredCell] = useState<{
    date: Date
    count: number
    x: number
    y: number
  } | null>(null)

  // On narrow screens the calendar scrolls; start at the most recent weeks
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth
  }, [activeYear])

  if (availableYears.length === 0) {
    return null
  }

  const totalWeeks = cells.length > 0 ? cells[0].length : 0
  const gridColumns = `${DAY_LABEL_WIDTH}px repeat(${totalWeeks}, minmax(0, 1fr))`

  const showTooltip = (el: HTMLElement, cell: CellData) => {
    if (!cell.date || !frameRef.current) return
    const rect = el.getBoundingClientRect()
    const frameRect = frameRef.current.getBoundingClientRect()
    const half = 72
    const x = Math.min(
      Math.max(rect.left - frameRect.left + rect.width / 2, half),
      frameRect.width - half
    )
    setHoveredCell({
      date: cell.date,
      count: cell.count,
      x,
      y: rect.top - frameRect.top
    })
  }

  return (
    <section className={cn('min-w-0', className)} aria-labelledby="activity-calendar-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="activity-calendar-heading" className="text-h5 text-foreground">
          Activity calendar
        </h2>
        <p className="tabular text-p-sm text-fg-secondary">
          {totalContributions} {totalContributions === 1 ? 'trade' : 'trades'} in {activeYear}
        </p>
      </div>

      <div ref={frameRef} className="relative border border-border bg-background p-5 md:p-6">
        {/* Year selector and legend */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Select year"
            value={activeYear}
            onChange={setSelectedYear}
            options={availableYears.map((year) => ({
              value: year,
              label: year,
              ariaLabel: `View trading activity for ${year}`
            }))}
          />
          <p className="tabular text-label text-fg-gray">
            {activeDays} active {activeDays === 1 ? 'day' : 'days'}
          </p>
        </div>

        {/* Scrolls sideways inside the frame on narrow screens */}
        <div
          ref={scrollRef}
          className="-mx-5 overflow-x-auto overscroll-x-contain px-5 pb-1 md:mx-0 md:px-0"
          onScroll={() => setHoveredCell(null)}
        >
          <div className="min-w-[720px]">
            {/* Month labels */}
            <div
              className="mb-2 grid"
              style={{ gridTemplateColumns: gridColumns, columnGap: CELL_GAP }}
              role="row"
              aria-label="Month labels"
            >
              {monthLabels.map((label) => {
                const monthName = MONTHS[label.month]
                return (
                  <div
                    key={label.month}
                    className="row-start-1 whitespace-nowrap text-label text-fg-gray"
                    style={{ gridColumnStart: label.week + 2 }}
                    role="columnheader"
                    aria-label={monthName}
                  >
                    {monthName}
                  </div>
                )
              })}
            </div>

            {/* Day labels + cells: 7 rows, one column per week */}
            <div
              className="grid grid-flow-col"
              style={{
                gridTemplateColumns: gridColumns,
                gridTemplateRows: 'repeat(7, auto)',
                gap: CELL_GAP
              }}
              role="grid"
              aria-label={`Trading activity in ${activeYear}`}
            >
              {DAYS.map((day, idx) => (
                <div key={day} className="relative" role="rowheader" aria-label={day}>
                  {(idx === 1 || idx === 3 || idx === 5) && (
                    <span className="absolute inset-y-0 left-0 flex items-center text-label text-fg-gray">
                      {day}
                    </span>
                  )}
                </div>
              ))}

              {cells[0]?.map((_, weekIdx) =>
                cells.map((row, dayIdx) => {
                  const cell = row[weekIdx]
                  if (!cell || !cell.date) {
                    return <div key={`${dayIdx}-${weekIdx}`} className="aspect-square" aria-hidden="true" />
                  }

                  const dateStr = cell.date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })
                  const activityLevel = cell.count === 0
                    ? 'no trades'
                    : `${cell.count} ${cell.count === 1 ? 'trade' : 'trades'}`

                  return (
                    <div
                      key={`${dayIdx}-${weekIdx}`}
                      className={cn(
                        'aspect-square rounded-[2px] transition-shadow duration-100 ease-out',
                        'hover:shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.6)]',
                        cell.count > 0 ? 'cursor-pointer' : 'cursor-default',
                        getColorClass(cell.level)
                      )}
                      onMouseEnter={(e) => showTooltip(e.currentTarget, cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onFocus={(e) => showTooltip(e.currentTarget, cell)}
                      onBlur={() => setHoveredCell(null)}
                      role="gridcell"
                      tabIndex={cell.count > 0 ? 0 : -1}
                      aria-label={`${dateStr}: ${activityLevel}`}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          className="mt-4 flex items-center justify-end gap-2 text-label text-fg-gray"
          role="group"
          aria-label="Activity intensity legend"
        >
          <span>Less</span>
          <div className="flex gap-[2px]" role="presentation" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={cn('h-2.5 w-2.5 rounded-[2px]', getColorClass(level))} />
            ))}
          </div>
          <span>More</span>
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div
            className="pointer-events-none absolute z-50 whitespace-nowrap"
            style={{
              left: hoveredCell.x,
              top: hoveredCell.y - 8,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <ChartTooltip
              title={hoveredCell.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
              rows={[{
                value: `${hoveredCell.count} ${hoveredCell.count === 1 ? 'trade' : 'trades'}`
              }]}
            />
          </div>
        )}
      </div>
    </section>
  )
}
