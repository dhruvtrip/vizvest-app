'use client'

import { useId, useLayoutEffect, useMemo, useRef } from 'react'
import { animate } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import {
  DOTTED_LINE,
  EdgeFade,
  MockChip,
  MockSegmented,
  TickerMark,
  eur,
  revealStyle,
  seeded,
  useReveal,
} from './feature-kit'

/* -------------------------------------------------------------------------- */
/* Trading activity: contribution-style heatmap                               */
/* -------------------------------------------------------------------------- */

const HEAT_COLS = 40
const HEAT_ROWS = 7
/** cell + gap, px */
const HEAT_STEP = 19
const HEAT_LEVEL = ['bg-transparent', 'bg-brand/25', 'bg-brand/45', 'bg-brand/70', 'bg-brand'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']

function buildHeatmap() {
  const rnd = seeded(212)
  const cols: number[][] = []
  for (let c = 0; c < HEAT_COLS; c++) {
    const busy = 0.35 + 0.35 * Math.sin(c / 5) ** 2 // bursts of activity
    const col: number[] = []
    for (let r = 0; r < HEAT_ROWS; r++) {
      const weekend = r >= 5
      const roll = rnd()
      if (weekend) {
        col.push(roll < 0.05 ? 1 : 0)
      } else if (roll < busy) {
        const l = rnd()
        col.push(l < 0.12 ? 4 : l < 0.32 ? 3 : l < 0.62 ? 2 : 1)
      } else {
        col.push(0)
      }
    }
    cols.push(col)
  }
  return cols
}

export function HeatmapVisual() {
  const { ref, shown, reduce } = useReveal()
  const cols = useMemo(buildHeatmap, [])
  const trades = useMemo(() => cols.flat().reduce((a, b) => a + b, 0), [cols])

  return (
    <div ref={ref} className="absolute inset-0 pt-6">
      <div className="flex items-center justify-between gap-4 px-6" style={revealStyle(shown, reduce, 0)}>
        <p className="text-[13px] leading-[18px] text-foreground">Trading activity</p>
        <MockSegmented options={['2025', '2026']} active="2026" />
      </div>

      <div className="relative mt-7 overflow-hidden pl-6">
        {/* month labels */}
        <div className="relative ml-[30px] h-4 text-[11px] leading-4 text-fg-gray">
          {MONTHS.map((m, i) => (
            <span key={m} className="absolute top-0" style={{ left: Math.round(i * 4.35) * HEAT_STEP }}>
              {m}
            </span>
          ))}
        </div>
        <div className="mt-2 flex">
          <div className="flex w-[30px] flex-none flex-col gap-[3px] text-[10px] leading-4 text-fg-gray">
            {['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, i) => (
              <span key={i} className="h-4">
                {d}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {cols.map((col, c) => (
              <div key={c} className="flex flex-col gap-[3px]">
                {col.map((level, r) => (
                  <span key={r} className="relative h-4 w-4 overflow-hidden rounded-[3px] bg-surface-3">
                    {level > 0 ? (
                      <span
                        className={cn('absolute inset-0', HEAT_LEVEL[level])}
                        style={{
                          opacity: shown ? 1 : 0,
                          transition: 'opacity 400ms var(--ease-house)',
                          transitionDelay: reduce ? '0ms' : `${200 + c * 22 + r * 12}ms`,
                        }}
                      />
                    ) : null}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <EdgeFade side="right" />
      </div>

      <div className="mt-5 flex items-center gap-2 px-6 text-[11px] leading-4 text-fg-gray" style={revealStyle(shown, reduce, 300)}>
        <span>Less</span>
        <span className="flex gap-[3px]">
          {HEAT_LEVEL.map((cls, i) => (
            <span key={i} className="relative h-2.5 w-2.5 overflow-hidden rounded-[2px] bg-surface-3">
              <span className={cn('absolute inset-0', cls)} />
            </span>
          ))}
        </span>
        <span>More</span>
        <span className="mx-2 h-3 w-px bg-border" />
        <span className="tabular">
          <span className="text-fg-secondary">{trades}</span> trades
          <span className="hidden sm:inline">
            , most on <span className="text-fg-secondary">Tuesdays</span>
          </span>
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Performance: P&L figure, chip and sparkline                                */
/* -------------------------------------------------------------------------- */

const PNL_TOTAL = 4144.36

function buildPnl() {
  const n = 52
  const rnd = seeded(7)
  const pts: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const trend = PNL_TOTAL * Math.pow(t, 1.2)
    const wave = 380 * Math.sin(i * 0.42) * (0.3 + t)
    const dip = i > 26 && i < 36 ? -900 * Math.sin(((i - 26) / 10) * Math.PI) : 0
    pts.push(trend + wave + dip + (rnd() - 0.5) * 220)
  }
  pts[0] = 0
  pts[n - 1] = PNL_TOTAL
  return pts
}

export function PnlVisual() {
  const { ref, shown, reduce } = useReveal()
  const valueRef = useRef<HTMLSpanElement>(null)
  const gradId = useId()
  const pts = useMemo(buildPnl, [])

  const { line, area, end } = useMemo(() => {
    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const x = (i: number) => (i / (pts.length - 1)) * 100
    const y = (v: number) => 92 - ((v - min) / (max - min)) * 80
    const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ')
    return { line, area: `${line} L100,100 L0,100 Z`, end: { x: 100, y: y(pts[pts.length - 1]) } }
  }, [pts])

  // Count up once on reveal
  useLayoutEffect(() => {
    const el = valueRef.current
    if (!el) return
    if (reduce) {
      el.textContent = eur(PNL_TOTAL)
      return
    }
    if (!shown) {
      el.textContent = eur(0)
      return
    }
    const controls = animate(0, PNL_TOTAL, {
      duration: 1.4,
      ease: EASE.outQuart,
      onUpdate: (v) => {
        el.textContent = eur(v)
      },
    })
    return () => controls.stop()
  }, [shown, reduce])

  return (
    <div ref={ref} className="absolute inset-0">
      <div className="flex items-center justify-between px-6 pt-6">
        <p className="text-[13px] leading-[18px] text-fg-secondary">Total return</p>
        <MockSegmented options={['1M', '6M', '1Y', 'All']} active="1Y" />
      </div>
      <div className="mt-3 px-6">
        <div className="flex items-center gap-3">
          <span ref={valueRef} className="tabular text-[36px] font-medium leading-[44px] tracking-[-1.2px] text-foreground">
            {eur(PNL_TOTAL)}
          </span>
          <MockChip tone="positive" className="h-6 rounded-full px-2 text-[12px]">
            <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            24.5%
          </MockChip>
        </div>
        <p className="tabular mt-1 text-[12px] leading-4 text-fg-gray">On {eur(16912.04)} invested</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[150px]">
        {[0.2, 0.5, 0.8].map((p) => (
          <div key={p} className="absolute inset-x-0 h-px" style={{ ...DOTTED_LINE, top: `${p * 100}%` }} />
        ))}
        <div className="absolute bottom-0 left-0 right-6 top-0">
          <div
            className="absolute inset-0"
            style={{
              clipPath: shown ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: reduce ? 'none' : 'clip-path 1400ms var(--ease-out-quart) 100ms',
            }}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-ink))" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="hsl(var(--chart-ink))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gradId})`} />
              <path
                d={line}
                fill="none"
                stroke="hsl(var(--chart-ink))"
                strokeWidth={1.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          {/* end marker */}
          <span
            className="absolute bottom-0 w-px"
            style={{
              left: `${end.x}%`,
              top: `${end.y}%`,
              backgroundImage: 'repeating-linear-gradient(180deg, hsl(var(--border-hover)) 0 3px, transparent 3px 6px)',
              opacity: shown ? 1 : 0,
              transition: 'opacity 300ms ease-out',
              transitionDelay: reduce ? '0ms' : '1400ms',
            }}
          />
          <span
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-ink ring-[3px] ring-background"
            style={{
              left: `${end.x}%`,
              top: `${end.y}%`,
              opacity: shown ? 1 : 0,
              transition: 'opacity 300ms ease-out',
              transitionDelay: reduce ? '0ms' : '1400ms',
            }}
          />
        </div>
        <EdgeFade side="bottom" className="h-12" />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Tax & fees: cost breakdown                                                  */
/* -------------------------------------------------------------------------- */

const COSTS = [
  { label: 'Currency conversion fees', value: 47.82, swatch: 'bg-foreground' },
  { label: 'Withholding tax, US dividends', value: 15.6, swatch: 'bg-fg-secondary' },
  { label: 'Withholding tax, EU dividends', value: 4.75, swatch: 'bg-fg-tertiary' },
]
const COST_TOTAL = COSTS.reduce((a, c) => a + c.value, 0)

export function FeesVisual() {
  const { ref, shown, reduce } = useReveal()

  return (
    <div ref={ref} className="absolute inset-0">
      <div className="absolute inset-x-6 top-6 rounded-xl bg-surface-1 shadow-demo-surface" style={revealStyle(shown, reduce, 0, 12)}>
        <div className="flex items-start justify-between gap-4 p-4">
          <div>
            <p className="text-[12px] leading-4 text-fg-secondary">Costs this year</p>
            <p className="tabular mt-1 text-[24px] font-medium leading-8 tracking-[-0.6px] text-foreground">{eur(COST_TOTAL)}</p>
          </div>
          <p className="tabular mt-0.5 text-right text-[12px] leading-4 text-fg-gray">
            1.6% of your
            <br />
            <span className="text-positive">+{eur(PNL_TOTAL)}</span> gain
          </p>
        </div>

        {/* composition bar */}
        <div className="flex gap-0.5 px-4 pb-4">
          {COSTS.map((c, i) => (
            <span
              key={c.label}
              className={cn('h-1.5 origin-left rounded-[2px]', c.swatch)}
              style={{
                width: `${(c.value / COST_TOTAL) * 100}%`,
                transform: shown ? 'scaleX(1)' : 'scaleX(0)',
                transition: reduce ? 'none' : 'transform 700ms var(--ease-out-quart)',
                transitionDelay: reduce ? '0ms' : `${250 + i * 120}ms`,
              }}
            />
          ))}
        </div>

        {COSTS.map((c, i) => (
          <div
            key={c.label}
            className="flex items-center gap-3 border-t border-border px-4 py-3 text-[13px] leading-[18px]"
            style={revealStyle(shown, reduce, 200 + i * 100, 6)}
          >
            <span className={cn('h-2 w-2 flex-none rounded-[2px]', c.swatch)} />
            <span className="text-fg-secondary">{c.label}</span>
            <span className="tabular ml-auto text-foreground">{eur(c.value)}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 border-t border-border px-4 py-3 text-[13px] leading-[18px]">
          <span className="text-fg-secondary">Net return after costs</span>
          <span className="tabular ml-auto text-positive">+{eur(PNL_TOTAL)}</span>
        </div>
      </div>
      <EdgeFade side="bottom" className="md:h-12" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Dividends: monthly income bar chart card                                    */
/* -------------------------------------------------------------------------- */

const DIVIDENDS = [
  { m: 'Dec', v: 148 },
  { m: 'Jan', v: 52 },
  { m: 'Feb', v: 61 },
  { m: 'Mar', v: 139 },
  { m: 'Apr', v: 72 },
  { m: 'May', v: 80 },
  { m: 'Jun', v: 161 },
  { m: 'Jul', v: 88 },
  { m: 'Aug', v: 79 },
  { m: 'Sep', v: 174 },
  { m: 'Oct', v: 104 },
  { m: 'Nov', v: 126.6 },
]
const DIV_TOTAL = DIVIDENDS.reduce((a, d) => a + d.v, 0)
const DIV_MAX = 200

export function DividendVisual() {
  const { ref, shown, reduce } = useReveal()

  return (
    <div ref={ref} className="absolute inset-0">
      <div className="absolute bottom-6 left-6 right-[-60px] top-6 overflow-hidden rounded-2xl bg-surface-2 shadow-demo-surface">
        <div className="p-5 md:p-6">
          <p className="text-[12px] leading-4 text-fg-secondary">Dividend income, last 12 months</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="tabular text-[28px] font-medium leading-9 tracking-[-0.8px] text-foreground">{eur(DIV_TOTAL)}</span>
            <MockChip tone="positive">
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
              18.2%
            </MockChip>
          </div>
        </div>

        <div className="absolute bottom-11 left-5 right-[108px] top-[112px] md:left-6 md:top-[124px]">
          {[0, 0.25, 0.5, 0.75].map((p) => (
            <div key={p} className="absolute inset-x-0 h-px" style={{ ...DOTTED_LINE, top: `${p * 100}%` }} />
          ))}
          <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
          <div className="absolute inset-0 flex items-end justify-between">
            {DIVIDENDS.map((d, i) => {
              const current = i === DIVIDENDS.length - 1
              return (
                <div key={d.m} className="relative flex h-full w-2.5 flex-col items-center justify-end md:w-3">
                  <span
                    className={cn('w-full origin-bottom rounded-[4px]', current ? 'bg-chart-ink/35' : 'bg-chart-ink')}
                    style={{
                      height: `${(d.v / DIV_MAX) * 100}%`,
                      transform: shown ? 'scaleY(1)' : 'scaleY(0)',
                      transition: reduce ? 'none' : 'transform 700ms var(--ease-out-quart)',
                      transitionDelay: reduce ? '0ms' : `${150 + i * 50}ms`,
                    }}
                  />
                  <span className="absolute -bottom-6 text-[10px] leading-3 text-fg-gray">{d.m}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <EdgeFade side="right" className="w-[72px]" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Stock analysis: transaction list                                           */
/* -------------------------------------------------------------------------- */

const TRADES = [
  { t: 'NVDA', name: 'NVIDIA', date: '14 Nov', side: 'BUY', qty: '3.00', amount: 421.86 },
  { t: 'AAPL', name: 'Apple', date: '12 Nov', side: 'BUY', qty: '2.50', amount: 512.4 },
  { t: 'TSLA', name: 'Tesla', date: '07 Nov', side: 'SELL', qty: '1.80', amount: 548.12 },
  { t: 'MSFT', name: 'Microsoft', date: '03 Nov', side: 'BUY', qty: '1.20', amount: 463.9 },
  { t: 'VUSA', name: 'Vanguard S&P 500', date: '28 Oct', side: 'BUY', qty: '6.00', amount: 582.74 },
  { t: 'GOOGL', name: 'Alphabet', date: '21 Oct', side: 'SELL', qty: '4.00', amount: 598.08 },
] as const

export function TradesVisual() {
  const { ref, shown, reduce } = useReveal()

  return (
    <div ref={ref} className="absolute inset-0">
      <div className="absolute inset-x-6 top-6 rounded-xl bg-surface-1 shadow-demo-surface" style={revealStyle(shown, reduce, 0, 12)}>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-[13px] leading-[18px] text-foreground">Transactions</p>
          <MockSegmented options={['All', 'Buys', 'Sells']} active="All" />
        </div>
        {TRADES.map((tr, i) => (
          <div
            key={tr.t}
            className="flex items-center gap-3 border-t border-border px-4 py-2.5"
            style={revealStyle(shown, reduce, 150 + i * 80, 6)}
          >
            <TickerMark ticker={tr.t} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] leading-[18px] text-foreground">{tr.name}</p>
              <p className="tabular truncate text-[11px] leading-4 text-fg-gray">
                {tr.date} · {tr.qty}
                <span className="hidden sm:inline"> shares</span>
                <span className="sm:hidden"> sh</span>
              </p>
            </div>
            <MockChip tone={tr.side === 'BUY' ? 'positive' : 'negative'} className="w-10 justify-center">
              {tr.side === 'BUY' ? 'Buy' : 'Sell'}
            </MockChip>
            <span className="tabular w-[72px] text-right text-[13px] leading-[18px] text-foreground">{eur(tr.amount)}</span>
          </div>
        ))}
      </div>
      <EdgeFade side="bottom" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Multi-currency: conversion rows into the base currency                      */
/* -------------------------------------------------------------------------- */

const FX = [
  { code: 'USD', from: '$1,240.00', rate: 0.9206, amount: 1240 },
  { code: 'GBP', from: '£860.50', rate: 1.1712, amount: 860.5 },
  { code: 'GBX', from: '42,150p', rate: 0.011712, amount: 42150 },
  { code: 'CHF', from: 'CHF 515.00', rate: 1.0634, amount: 515 },
  { code: 'CAD', from: 'CA$730.00', rate: 0.6581, amount: 730 },
]

export function CurrencyVisual() {
  const { ref, shown, reduce } = useReveal()

  return (
    <div ref={ref} className="absolute inset-0 pt-6">
      <div className="flex items-center justify-between gap-4 px-6" style={revealStyle(shown, reduce, 0)}>
        <p className="text-[13px] leading-[18px] text-fg-secondary">Base currency</p>
        <span className="inline-flex h-8 items-center gap-2 rounded-field bg-surface-3 px-3 text-[13px] leading-[18px] text-foreground shadow-field">
          EUR
          <span className="text-fg-gray">Euro</span>
          <ChevronDown className="h-3.5 w-3.5 text-fg-gray" strokeWidth={1.5} />
        </span>
      </div>
      <div className="mt-5 border-t border-border">
        {FX.map((fx, i) => (
          <div
            key={fx.code}
            className="flex items-center gap-3 border-b border-border px-6 py-3 text-[13px] leading-[18px]"
            style={revealStyle(shown, reduce, 120 + i * 90, 6)}
          >
            <span className="w-9 flex-none rounded-sm bg-surface-4 py-0.5 text-center text-[11px] leading-4 text-fg-secondary">
              {fx.code}
            </span>
            <span className="tabular min-w-0 flex-1 truncate text-fg-secondary">{fx.from}</span>
            <span className="tabular hidden text-[11px] text-fg-gray sm:inline">× {fx.rate.toFixed(fx.rate < 0.1 ? 6 : 4)}</span>
            <ArrowRight className="h-3.5 w-3.5 flex-none text-fg-tertiary" strokeWidth={1.5} />
            <span className="tabular w-[84px] text-right text-foreground">{eur(fx.amount * fx.rate)}</span>
          </div>
        ))}
      </div>
      <EdgeFade side="bottom" className="h-16" />
    </div>
  )
}
