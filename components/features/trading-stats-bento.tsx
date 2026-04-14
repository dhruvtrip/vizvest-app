'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Flame, Zap, CalendarDays, TrendingUp, Activity } from 'lucide-react'
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
  index: number
  highlight?: boolean
  className?: string
}

function StatTile({ icon, label, value, subtext, index, highlight = false, className }: StatTileProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors h-full">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
            {icon}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
              className={cn(
                'text-2xl sm:text-3xl font-mono font-semibold tabular-nums tracking-tight',
                highlight ? 'text-brand' : 'text-foreground'
              )}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground truncate">{subtext}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
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
    <div className={cn('space-y-4', className)} data-testid="trading-stats-bento">
      <div>
        <p className="text-[11px] font-mono font-medium uppercase tracking-[1.5px] text-muted-foreground">
          All-Time Highlights
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Based on your full trade history, ignoring year filters
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile
          index={0}
          icon={<Flame className="w-4 h-4" />}
          label="Longest streak"
          value={
            <>
              <AnimatedNumber value={stats.longestStreak?.days ?? 0} />{' '}
              <span className="text-sm font-normal text-muted-foreground">days</span>
            </>
          }
          subtext={dateRange}
          highlight
        />
        <StatTile
          index={1}
          icon={<Zap className="w-4 h-4" />}
          label="Busiest day"
          value={
            <>
              <AnimatedNumber value={stats.busiestDay?.count ?? 0} />{' '}
              <span className="text-sm font-normal text-muted-foreground">trades</span>
            </>
          }
          subtext={busiestDateLabel}
        />
        <StatTile
          index={2}
          icon={<CalendarDays className="w-4 h-4" />}
          label="Favorite day"
          value={stats.favoriteDay?.day ?? '—'}
          subtext={stats.favoriteDay ? `${stats.favoriteDay.percentage}% of trades` : '—'}
        />
        <StatTile
          index={3}
          icon={<TrendingUp className="w-4 h-4" />}
          label="Most active month"
          value={stats.mostActiveMonth?.label ?? '—'}
          subtext={stats.mostActiveMonth ? `${stats.mostActiveMonth.count} trades` : '—'}
        />
        <StatTile
          index={4}
          className="sm:col-span-2 lg:col-span-1"
          icon={<Activity className="w-4 h-4" />}
          label="Trades per active day"
          value={<AnimatedNumber value={stats.tradesPerActiveDay} decimals={1} />}
          subtext="avg on active days"
        />
      </div>
    </div>
  )
}
