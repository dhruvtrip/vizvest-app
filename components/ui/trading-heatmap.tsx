'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { NormalizedTransaction } from '@/types/trading212'
import { isTradeAction } from '@/lib/transaction-utils'

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

// Color levels for activity intensity
const getColorClass = (level: number) => {
  switch (level) {
    case 0:
      return 'bg-neutral-200 dark:bg-slate-900'
    case 1:
      return 'bg-green-400/40 dark:bg-green-400/30'
    case 2:
      return 'bg-green-500/60 dark:bg-green-500/50'
    case 3:
      return 'bg-green-600/80 dark:bg-green-600/70'
    case 4:
      return 'bg-green-700/100 dark:bg-green-700/90'
    default:
      return 'bg-neutral-200 dark:bg-slate-900'
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

  // Process transactions for selected year
  const { cells, monthLabels } = useMemo(() => {
    if (availableYears.length === 0) {
      return { cells: [], monthLabels: [] }
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

  // Hover state for tooltip
  const [hoveredCell, setHoveredCell] = useState<{
    date: Date
    count: number
    x: number
    y: number
  } | null>(null)

  if (availableYears.length === 0) {
    return null
  }

  const totalWeeks = cells.length > 0 ? cells[0].length : 0
  
  // Calculate fixed width for heatmap (cell width + gap) * number of weeks
  const cellWidth = 11
  const cellGap = 2
  const weekWidth = cellWidth + cellGap
  const heatmapWidth = totalWeeks * weekWidth
  const dayLabelWidth = 20 // Width for day-of-week labels

  // #region agent log
  // Instrumentation for debugging scroll issue
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const heatmapContentRef = useRef<HTMLDivElement>(null)
  const parentContainerRef = useRef<HTMLDivElement>(null)
  const [needsScroll, setNeedsScroll] = useState(false)
  
  const logDimensions = () => {
    if (scrollContainerRef.current && heatmapContentRef.current && parentContainerRef.current) {
      const containerRect = scrollContainerRef.current.getBoundingClientRect()
      const contentRect = heatmapContentRef.current.getBoundingClientRect()
      const parentRect = parentContainerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const hasOverflow = contentRect.width > containerRect.width
      const scrollWidth = scrollContainerRef.current.scrollWidth
      const clientWidth = scrollContainerRef.current.clientWidth
      const computedStyle = window.getComputedStyle(scrollContainerRef.current)
      const overflowX = computedStyle.overflowX
      const contentNeedsSpace = dayLabelWidth + heatmapWidth
      const shouldShowScroll = scrollWidth > clientWidth && contentNeedsSpace > viewportWidth * 0.9
      
      setNeedsScroll(shouldShowScroll)
      
      fetch('http://127.0.0.1:7242/ingest/0c5783f2-38ee-4263-aa6c-488395854699', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'trading-heatmap.tsx:245',
          message: 'Scroll container dimensions',
          data: {
            viewportWidth,
            parentContainerWidth: parentRect.width,
            containerWidth: containerRect.width,
            contentWidth: contentRect.width,
            calculatedHeatmapWidth: heatmapWidth,
            calculatedTotalWidth: dayLabelWidth + heatmapWidth,
            scrollWidth,
            clientWidth,
            hasOverflow,
            overflowX,
            totalWeeks,
            weekWidth,
            gap: 16,
            shouldShowScroll,
            contentNeedsSpace
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'post-fix',
          hypothesisId: 'A'
        })
      }).catch(() => {})
    }
  }
  
  useEffect(() => {
    logDimensions()
    const resizeObserver = new ResizeObserver(() => {
      logDimensions()
    })
    
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current)
    }
    if (parentContainerRef.current) {
      resizeObserver.observe(parentContainerRef.current)
    }
    
    window.addEventListener('resize', logDimensions)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', logDimensions)
    }
  }, [heatmapWidth, dayLabelWidth, totalWeeks, weekWidth, cells])
  // #endregion

  return (
    <Card className={cn('border-border/50 bg-card/50 backdrop-blur-sm', className)}>
      <CardContent className="pt-6">
        {/* Header aligned with heatmap */}
        <div className="flex items-start gap-4 min-w-0 mb-4">
          <div className="flex-1 min-w-0">
            <div className="mx-auto" style={{ width: `${dayLabelWidth + heatmapWidth}px` }}>
              <CardTitle className="text-sm font-semibold text-foreground">
                Trading Activity
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {totalContributions} {totalContributions === 1 ? 'trade' : 'trades'} in {selectedYear}
              </CardDescription>
            </div>
          </div>
          {/* Year selector spacer to match layout */}
          <div className="flex-shrink-0" style={{ width: '0px' }} aria-hidden="true" />
        </div>
        
        {/* Centered container for heatmap and year selector */}
        <div className="flex justify-center">
          <div ref={parentContainerRef} className="flex items-start gap-2 min-w-0">
            {/* Scrollable heatmap container */}
            <div 
              ref={scrollContainerRef}
              className={cn(
                "min-w-0",
                needsScroll ? "overflow-x-auto" : "overflow-x-visible"
              )}
            onScroll={() => {
              // #region agent log
              if (scrollContainerRef.current) {
                const scrollLeft = scrollContainerRef.current.scrollLeft
                const scrollWidth = scrollContainerRef.current.scrollWidth
                const clientWidth = scrollContainerRef.current.clientWidth
                const maxScroll = scrollWidth - clientWidth
                const isScrollable = scrollWidth > clientWidth
                
                fetch('http://127.0.0.1:7242/ingest/0c5783f2-38ee-4263-aa6c-488395854699', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    location: 'trading-heatmap.tsx:268',
                    message: 'Scroll event detected',
                    data: {
                      scrollLeft,
                      scrollWidth,
                      clientWidth,
                      maxScroll,
                      isScrollable,
                      hasScrollbar: isScrollable
                    },
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'B'
                  })
                }).catch(() => {})
              }
              // #endregion
            }}
          >
            {/* Main heatmap grid */}
            <div 
              ref={heatmapContentRef}
              className="relative flex-shrink-0 mx-auto" 
              id="heatmap-container"
              style={{ width: `${dayLabelWidth + heatmapWidth}px` }}
            >
            {/* Month labels */}
            <div 
              className="relative mb-1" 
              style={{ marginLeft: `${dayLabelWidth}px`, height: '14px' }}
              role="row"
              aria-label="Month labels"
            >
              {monthLabels.map((label) => {
                const monthName = MONTHS[label.month]
                const leftPosition = label.week * weekWidth
                
                return (
                  <div
                    key={label.month}
                    className="absolute text-[10px] text-muted-foreground whitespace-nowrap"
                    style={{
                      left: `${leftPosition}px`
                    }}
                    role="columnheader"
                    aria-label={monthName}
                  >
                    {monthName}
                  </div>
                )
              })}
            </div>

            {/* Grid with day labels */}
            <div className="flex gap-1">
              {/* Day of week labels */}
              <div className="flex flex-col gap-1 pt-0.5" role="rowgroup" aria-label="Day of week">
                {DAYS.map((day, idx) => {
                  // Only show Mon, Wed, Fri (indices 1, 3, 5)
                  if (idx === 1 || idx === 3 || idx === 5) {
                    return (
                      <div
                        key={day}
                        className="text-[10px] text-muted-foreground h-[11px] leading-[11px]"
                        role="rowheader"
                        aria-label={day}
                      >
                        {day}
                      </div>
                    )
                  }
                  return <div key={day} className="h-[11px]" aria-hidden="true" />
                })}
              </div>

              {/* Heatmap grid */}
              <div className="flex-shrink-0" style={{ width: `${heatmapWidth}px` }}>
                <div className="flex gap-[2px]">
                  {cells[0]?.map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-[2px]">
                      {cells.map((row, dayIdx) => {
                        const cell = row[weekIdx]
                        if (!cell || !cell.date) {
                          return <div key={`${dayIdx}-${weekIdx}`} className="w-[11px] h-[11px]" />
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
                          <motion.div
                            key={`${dayIdx}-${weekIdx}`}
                            className={cn(
                              'w-[11px] h-[11px] rounded-[2px] transition-all relative',
                              cell.count > 0 ? 'cursor-pointer' : 'cursor-default',
                              getColorClass(cell.level),
                              'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
                              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
                            )}
                            onMouseEnter={(e) => {
                              if (cell.date) {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const container = document.getElementById('heatmap-container')
                                if (container) {
                                  const containerRect = container.getBoundingClientRect()
                                  setHoveredCell({
                                    date: cell.date,
                                    count: cell.count,
                                    x: rect.left - containerRect.left + rect.width / 2,
                                    y: rect.top - containerRect.top
                                  })
                                }
                              }
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                            onFocus={(e) => {
                              if (cell.date) {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const container = document.getElementById('heatmap-container')
                                if (container) {
                                  const containerRect = container.getBoundingClientRect()
                                  setHoveredCell({
                                    date: cell.date,
                                    count: cell.count,
                                    x: rect.left - containerRect.left + rect.width / 2,
                                    y: rect.top - containerRect.top
                                  })
                                }
                              }
                            }}
                            onBlur={() => setHoveredCell(null)}
                            whileHover={{ scale: 1.2, zIndex: 10 }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            role="gridcell"
                            tabIndex={cell.count > 0 ? 0 : -1}
                            aria-label={`${dateStr}: ${activityLevel}`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground" role="group" aria-label="Activity intensity legend">
                  <span>Less</span>
                  <div className="flex gap-[2px]" role="presentation" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn('w-[11px] h-[11px] rounded-[2px]', getColorClass(level))}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* Tooltip */}
            {hoveredCell && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute z-50 px-2 py-1.5 text-xs bg-popover border border-border rounded-md shadow-lg pointer-events-none whitespace-nowrap"
                style={{
                  left: `${hoveredCell.x}px`,
                  top: `${hoveredCell.y - 32}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-medium text-popover-foreground">
                  {hoveredCell.count} {hoveredCell.count === 1 ? 'trade' : 'trades'} on{' '}
                  {hoveredCell.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </motion.div>
            )}
            </div>
          </div>

            {/* Year selector - always visible */}
            <div className="flex flex-col gap-1 flex-shrink-0" role="group" aria-label="Select year">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors text-right',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  selectedYear === year
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                aria-label={`View trading activity for ${year}`}
                aria-pressed={selectedYear === year}
              >
                {year}
              </button>
            ))}
          </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
