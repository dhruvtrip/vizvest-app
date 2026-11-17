'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView, animate } from 'framer-motion'
import { KpiTile } from '@/components/charts'
import { Reveal, useReducedMotionSafe } from '@/components/motion'
import { Flame, CalendarDays, Star, Calendar, Gauge } from '@/components/icons'
import { Region, kpiGridFive } from '@/components/features/dashboard-layout'
import type { NormalizedTransaction } from '@/types/trading212'
import { isTradeAction } from '@/lib/transaction-utils'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function toDateKey(time: string): string {
  const d = new Date(time)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function filterTrades(transactions: NormalizedTransaction[]): NormalizedTransaction[] {
  return transactions.filter(
    (t) => isTradeAction(t.Action) && !Number.isNaN(new Date(t.Time).getTime())
  )
}

export function longestStreak(
  transactions: NormalizedTransaction[]
): { days: number; startDate: Date; endDate: Date } | null {
  const trades = filterTrades(transactions)
  if (trades.length === 0) return null

  const uniqueDays = Array.from(new Set(trades.map((t) => toDateKey(t.Time)))).sort()
  let maxDays = 1
  let maxStart = uniqueDays[0]
  let maxEnd = uniqueDays[0]
  let curDays = 1
  let curStart = uniqueDays[0]

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      curDays += 1
    } else {
      curDays = 1
      curStart = uniqueDays[i]
    }
    if (curDays > maxDays) {
      maxDays = curDays
      maxStart = curStart
      maxEnd = uniqueDays[i]
    }
  }

  return { days: maxDays, startDate: new Date(maxStart), endDate: new Date(maxEnd) }
}

export function busiestDay(
  transactions: NormalizedTransaction[]
): { count: number; date: Date } | null {
  const trades = filterTrades(transactions)
  if (trades.length === 0) return null

  const counts = new Map<string, number>()
  for (const t of trades) {
    const key = toDateKey(t.Time)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let bestKey = ''
  let bestCount = -1
  for (const [key, count] of counts) {
    if (count > bestCount || (count === bestCount && key < bestKey)) {
      bestCount = count
      bestKey = key
    }
  }
  return { count: bestCount, date: new Date(bestKey) }
}

export function favoriteDay(
  transactions: NormalizedTransaction[]
): { day: string; percentage: number } | null {
  const trades = filterTrades(transactions)
  if (trades.length === 0) return null

  const buckets = new Array(7).fill(0)
  for (const t of trades) {
    buckets[new Date(t.Time).getDay()] += 1
  }

  let bestIdx = 0
  for (let i = 1; i < 7; i++) {
    if (buckets[i] > buckets[bestIdx]) bestIdx = i
  }

  return {
    day: WEEKDAYS[bestIdx],
    percentage: Math.round((buckets[bestIdx] / trades.length) * 100),
  }
}

export function mostActiveMonth(
  transactions: NormalizedTransaction[]
): { label: string; count: number } | null {
  const trades = filterTrades(transactions)
  if (trades.length === 0) return null

  const counts = new Map<string, number>()
  for (const t of trades) {
    const d = new Date(t.Time)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let bestKey = ''
  let bestCount = -1
  for (const [key, count] of counts) {
    if (count > bestCount || (count === bestCount && key < bestKey)) {
      bestCount = count
      bestKey = key
    }
  }

  const [year, month] = bestKey.split('-').map(Number)
  const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  return { label, count: bestCount }
}

export function tradesPerActiveDay(transactions: NormalizedTransaction[]): number {
  const trades = filterTrades(transactions)
  if (trades.length === 0) return 0
  const uniqueDays = new Set(trades.map((t) => toDateKey(t.Time))).size
  return Math.round((trades.length / uniqueDays) * 10) / 10
}

export interface TradingStats {
  longestStreak: { days: number; startDate: Date; endDate: Date } | null
  busiestDay: { count: number; date: Date } | null
  favoriteDay: { day: string; percentage: number } | null
  mostActiveMonth: { label: string; count: number } | null
  tradesPerActiveDay: number
}

export function computeStats(transactions: NormalizedTransaction[]): TradingStats | null {
  const trades = filterTrades(transactions)
  if (trades.length === 0) return null
  return {
    longestStreak: longestStreak(transactions),
    busiestDay: busiestDay(transactions),
    favoriteDay: favoriteDay(transactions),
    mostActiveMonth: mostActiveMonth(transactions),
    tradesPerActiveDay: tradesPerActiveDay(transactions),
  }
}

interface TradingStatsBentoProps {
  transactions: NormalizedTransaction[]
  className?: string
}

/** Counts up from 0 the first time it scrolls into view; shows the value at once under reduced motion. */
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const reduced = useReducedMotionSafe()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, reduced])

  return (
    <span ref={ref}>
      <span aria-hidden="true">{display.toFixed(decimals)}</span>
      <span className="sr-only">{value.toFixed(decimals)}</span>
    </span>
  )
}

/** "April 2026" to "Apr 2026", so the month fits a tile beside other figures. */
const shortMonthLabel = (label: string) => label.replace(/^([A-Za-z]{3})[A-Za-z]*/, '$1')

const Unit = ({ children }: { children: React.ReactNode }) => (
  <span className="ms-1 text-sm font-normal text-muted-foreground">{children}</span>
)

const iconProps = { size: 14, className: 'text-muted-foreground' } as const

export function TradingStatsBento({ transactions, className }: TradingStatsBentoProps) {
  const stats = computeStats(transactions)
  if (!stats) return null

  const dateRange = stats.longestStreak
    ? `${stats.longestStreak.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${stats.longestStreak.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '—'

  const busiestDateLabel = stats.busiestDay
    ? stats.busiestDay.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const streakDays = stats.longestStreak?.days ?? 0
  const busiestCount = stats.busiestDay?.count ?? 0

  return (
    <Region
      id="activity-highlights"
      label="Highlights"
      action="All time, not affected by the year filter"
      className={className}
    >
      <Reveal className={kpiGridFive} data-testid="trading-stats-bento">
        <KpiTile
          icon={<Flame {...iconProps} />}
          label="Longest streak"
          value={
            <>
              <AnimatedNumber value={streakDays} />
              <Unit>{streakDays === 1 ? 'day' : 'days'}</Unit>
            </>
          }
          sub={dateRange}
          hint="Most trading days in a row, counting calendar days."
        />
        <KpiTile
          icon={<CalendarDays {...iconProps} />}
          label="Busiest day"
          value={
            <>
              <AnimatedNumber value={busiestCount} />
              <Unit>{busiestCount === 1 ? 'trade' : 'trades'}</Unit>
            </>
          }
          sub={busiestDateLabel}
        />
        <KpiTile
          icon={<Star {...iconProps} />}
          label="Favourite day"
          value={stats.favoriteDay?.day ?? '—'}
          sub={stats.favoriteDay ? `${stats.favoriteDay.percentage}% of trades` : '—'}
        />
        <KpiTile
          icon={<Calendar {...iconProps} />}
          label="Most active month"
          value={stats.mostActiveMonth ? shortMonthLabel(stats.mostActiveMonth.label) : '—'}
          sub={stats.mostActiveMonth ? `${stats.mostActiveMonth.count} trades` : '—'}
        />
        <KpiTile
          icon={<Gauge {...iconProps} />}
          label="Trades per active day"
          value={<AnimatedNumber value={stats.tradesPerActiveDay} decimals={1} />}
          sub="Average on days you traded"
          // Fifth of five: in the two-column layout it takes the whole last row so its label never truncates.
          className="min-[380px]:max-md:col-span-2"
        />
      </Reveal>
    </Region>
  )
}
