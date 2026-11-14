'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView, animate } from 'framer-motion'
import { Flame, Zap, CalendarDays, TrendingUp, Activity } from 'lucide-react'
import { StaggerIn, StaggerItem } from '@/components/motion/blur-reveal'
import { SectionHeader } from '@/components/features/analysis-kit'
import type { NormalizedTransaction } from '@/types/trading212'
import { isTradeAction } from '@/lib/transaction-utils'
import { cn } from '@/lib/utils'

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

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value])

  return <span ref={ref}>{display.toFixed(decimals)}</span>
}

interface StatTileProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  subtext: string
  className?: string
}

function StatTile({ icon, label, value, subtext, className }: StatTileProps) {
  return (
    <StaggerItem className={cn('flex min-h-[184px] flex-col justify-between gap-8 bg-background p-5 md:p-6', className)}>
      <div
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-fg-secondary shadow-demo-surface [&_svg]:h-4 [&_svg]:w-4"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="tabular text-h4 text-foreground">{value}</p>
        <p className="mt-1 text-p-sm text-fg-secondary">{label}</p>
        <p className="mt-0.5 truncate text-label text-fg-gray">{subtext}</p>
      </div>
    </StaggerItem>
  )
}

function Unit({ children }: { children: React.ReactNode }) {
  return <span className="text-p-sm text-fg-secondary">{children}</span>
}

export function TradingStatsBento({ transactions, className }: TradingStatsBentoProps) {
  const stats = computeStats(transactions)
  if (!stats) return null

  const dateRange = stats.longestStreak
    ? `${stats.longestStreak.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${stats.longestStreak.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '—'

  const busiestDateLabel = stats.busiestDay
    ? stats.busiestDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <section
      className={cn('min-w-0', className)}
      data-testid="trading-stats-bento"
      aria-labelledby="trading-highlights-heading"
    >
      <SectionHeader
        id="trading-highlights-heading"
        title="All-time highlights"
        meta="Full trade history, ignoring the year filter"
      />

      <StaggerIn className="cell-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <StatTile
          icon={<Flame strokeWidth={1.5} />}
          label="Longest streak"
          value={
            <>
              <AnimatedNumber value={stats.longestStreak?.days ?? 0} /> <Unit>days</Unit>
            </>
          }
          subtext={dateRange}
        />
        <StatTile
          icon={<Zap strokeWidth={1.5} />}
          label="Busiest day"
          value={
            <>
              <AnimatedNumber value={stats.busiestDay?.count ?? 0} /> <Unit>trades</Unit>
            </>
          }
          subtext={busiestDateLabel}
        />
        <StatTile
          icon={<CalendarDays strokeWidth={1.5} />}
          label="Favorite day"
          value={stats.favoriteDay?.day ?? '—'}
          subtext={stats.favoriteDay ? `${stats.favoriteDay.percentage}% of trades` : '—'}
        />
        <StatTile
          icon={<TrendingUp strokeWidth={1.5} />}
          label="Most active month"
          value={stats.mostActiveMonth?.label ?? '—'}
          subtext={stats.mostActiveMonth ? `${stats.mostActiveMonth.count} trades` : '—'}
        />
        <StatTile
          className="col-span-2 xl:col-span-1"
          icon={<Activity strokeWidth={1.5} />}
          label="Trades per active day"
          value={<AnimatedNumber value={stats.tradesPerActiveDay} decimals={1} />}
          subtext="Average on days you traded"
        />
      </StaggerIn>
    </section>
  )
}
