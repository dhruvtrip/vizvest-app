'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowUpRight, Check, FileSpreadsheet, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DOTTED_LINE, EdgeFade, MockChip, MockSegmented, TickerMark, eur, seeded, useReducedMotionSafe } from './feature-kit'

/** Flips to true one frame after mount so CSS transitions can run on a fresh panel. */
function useMounted() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return on
}

const CARD = 'absolute inset-x-6 top-6 rounded-2xl bg-surface-2 shadow-demo-surface'

/* -------------------------------------------------------------------------- */
/* 01 Upload: drop zone with a staged, validated file                          */
/* -------------------------------------------------------------------------- */

export function UploadStepVisual() {
  const on = useMounted()
  const reduce = useReducedMotionSafe()

  return (
    <div className="absolute inset-0">
      <div className={cn(CARD, 'p-4 md:p-5')}>
        <div className="flex items-center justify-between">
          <p className="text-[13px] leading-[18px] text-foreground">Upload your data</p>
          <MockChip>Trading 212</MockChip>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-hover px-4 py-8 text-center md:py-10">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-4 text-foreground">
            <Upload className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-[13px] leading-[18px] text-foreground">Drop your CSV export here</p>
          <p className="mt-1 text-[12px] leading-4 text-fg-gray">CSV only, up to 5 MB</p>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl bg-surface-3 shadow-field">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-surface-4 text-fg-secondary">
              <FileSpreadsheet className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] leading-[18px] text-foreground">trading212-export.csv</p>
              <p className="tabular truncate text-[11px] leading-4 text-fg-gray">412 KB · 1,284 rows</p>
            </div>
            <MockChip tone="positive">
              <Check className="h-3 w-3" strokeWidth={2} />
              Valid
            </MockChip>
          </div>
          <div className="h-0.5 bg-surface-4">
            <div
              className="h-full origin-left bg-brand"
              style={{
                transform: on || reduce ? 'scaleX(1)' : 'scaleX(0)',
                transition: reduce ? 'none' : 'transform 700ms var(--ease-out-quart) 120ms',
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[12px] leading-4 text-fg-gray">Processed in your browser</p>
          <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-[13px] font-medium leading-[18px] text-primary-foreground">
            Continue
          </span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 02 Explore: portfolio overview                                              */
/* -------------------------------------------------------------------------- */

const OVERVIEW = [
  { label: 'Portfolio value', value: eur(24816.4) },
  { label: 'Total return', value: `+${eur(4144.36)}`, tone: 'positive' as const },
  { label: 'Dividends, 12 months', value: eur(1284.6) },
  { label: 'Positions', value: '14' },
]

const HOLDINGS = [
  { t: 'VUSA', name: 'Vanguard S&P 500', weight: 22.4, value: 5558.87 },
  { t: 'AAPL', name: 'Apple', weight: 18.2, value: 4516.58 },
  { t: 'MSFT', name: 'Microsoft', weight: 14.6, value: 3623.19 },
  { t: 'ASML', name: 'ASML Holding', weight: 9.4, value: 2332.74 },
  { t: 'NVDA', name: 'NVIDIA', weight: 7.1, value: 1761.96 },
]

export function ExploreStepVisual() {
  const on = useMounted()
  const reduce = useReducedMotionSafe()

  return (
    <div className="absolute inset-0">
      <div className={cn(CARD, 'overflow-hidden')}>
        <div className="flex items-center justify-between px-4 py-3 md:px-5">
          <p className="text-[13px] leading-[18px] text-foreground">Portfolio</p>
          <MockSegmented options={['Overview', 'Dividends', 'Activity']} active="Overview" />
        </div>
        <div className="grid grid-cols-2 border-t border-border">
          {OVERVIEW.map((m, i) => (
            <div
              key={m.label}
              className={cn('px-4 py-3 md:px-5', i % 2 === 1 && 'border-l border-border', i > 1 && 'border-t border-border')}
            >
              <p className="text-[11px] leading-4 text-fg-gray">{m.label}</p>
              <p
                className={cn(
                  'tabular mt-1 text-[17px] font-medium leading-6 tracking-[-0.3px] md:text-[20px] md:leading-7',
                  m.tone === 'positive' ? 'text-positive' : 'text-foreground'
                )}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 pb-1 pt-3 text-[11px] leading-4 text-fg-gray md:px-5">
          <span>Holdings</span>
          <span>Weight</span>
        </div>
        {HOLDINGS.map((h, i) => (
          <div key={h.t} className="flex items-center gap-3 px-4 py-2 md:px-5">
            <TickerMark ticker={h.t} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] leading-[18px] text-foreground">{h.name}</p>
              <p className="tabular text-[11px] leading-4 text-fg-gray">{eur(h.value)}</p>
            </div>
            <span className="hidden h-1 w-20 overflow-hidden rounded-full bg-surface-4 sm:block">
              <span
                className="block h-full origin-left rounded-full bg-chart-ink"
                style={{
                  width: `${(h.weight / 25) * 100}%`,
                  transform: on || reduce ? 'scaleX(1)' : 'scaleX(0)',
                  transition: reduce ? 'none' : `transform 600ms var(--ease-out-quart) ${80 + i * 60}ms`,
                }}
              />
            </span>
            <span className="tabular w-11 text-right text-[13px] leading-[18px] text-foreground">{h.weight.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <EdgeFade side="bottom" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 03 Track: cumulative dividend income line                                   */
/* -------------------------------------------------------------------------- */

function buildDividendGrowth() {
  // 36 months of cumulative dividends: payouts grow as the portfolio grows
  const rnd = seeded(31)
  const out: number[] = []
  let total = 0
  for (let m = 0; m < 36; m++) {
    const quarter = m % 3 === 2 ? 1.9 : 1
    total += (8 + m * 2.2) * quarter * (0.85 + rnd() * 0.3)
    out.push(total)
  }
  return out
}

export function TrackStepVisual() {
  const on = useMounted()
  const reduce = useReducedMotionSafe()
  const gradId = useId()
  const series = useMemo(buildDividendGrowth, [])
  const last = series[series.length - 1]

  const { line, area, end } = useMemo(() => {
    const max = last * 1.3
    const x = (i: number) => (i / (series.length - 1)) * 100
    const y = (v: number) => 100 - (v / max) * 100
    const line = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ')
    return { line, area: `${line} L100,100 L0,100 Z`, end: { x: 100, y: y(last) } }
  }, [series, last])

  return (
    <div className="absolute inset-0">
      <div className={cn(CARD, 'bottom-6 overflow-hidden p-4 md:p-5')}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] leading-4 text-fg-secondary">Dividends received, all time</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="tabular text-[28px] font-medium leading-9 tracking-[-0.8px] text-foreground">{eur(last)}</span>
              <MockChip tone="positive">
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                38.4% YoY
              </MockChip>
            </div>
          </div>
          <MockSegmented options={['1Y', '3Y', 'All']} active="3Y" className="hidden sm:inline-flex" />
        </div>

        <div className="absolute bottom-10 left-4 right-4 top-[104px] md:left-5 md:right-5">
          {[0, 1 / 3, 2 / 3].map((p) => (
            <div key={p} className="absolute inset-x-0 h-px" style={{ ...DOTTED_LINE, top: `${p * 100}%` }} />
          ))}
          <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
          <div
            className="absolute inset-0"
            style={{
              clipPath: on || reduce ? 'inset(-8px 0 0 0)' : 'inset(-8px 100% 0 0)',
              transition: reduce ? 'none' : 'clip-path 1100ms var(--ease-out-quart) 100ms',
            }}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-ink))" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="hsl(var(--chart-ink))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gradId})`} />
              <path d={line} fill="none" stroke="hsl(var(--chart-ink))" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <span
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-ink ring-[3px] ring-surface-2"
            style={{ left: `${end.x}%`, top: `${end.y}%`, opacity: on || reduce ? 1 : 0, transition: 'opacity 200ms ease-out 1000ms' }}
          />
          {/* tooltip on the latest point */}
          <div
            className="absolute"
            style={{ left: `${end.x}%`, top: `${end.y}%`, transform: 'translate(calc(-100% + 8px), calc(-100% - 14px))', opacity: on || reduce ? 1 : 0, transition: 'opacity 200ms ease-out 1050ms' }}
          >
            <div className="rounded-field border border-border bg-surface-1 px-3 py-2">
              <p className="text-[11px] leading-4 text-fg-secondary">Nov 2026</p>
              <p className="tabular text-[13px] font-medium leading-[18px] text-foreground">{eur(last)}</p>
            </div>
          </div>
          <div className="absolute inset-x-0 -bottom-6 flex justify-between text-[10px] leading-3 text-fg-gray">
            <span>Dec 2023</span>
            <span>Dec 2024</span>
            <span>Dec 2025</span>
            <span>Nov 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}
