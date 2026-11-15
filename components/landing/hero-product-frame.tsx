'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { Activity, Calendar, DollarSign, FileText, LayoutGrid, Upload } from 'lucide-react'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* --------------------------------------------------------------------------
   Sample data (EUR). Plausible figures for a mid-sized Trading 212 account.
   -------------------------------------------------------------------------- */

const eur = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' })
const fmt = (v: number) => eur.format(v)
const fmtSigned = (v: number) => `+${eur.format(v)}`

const METRICS = [
  { label: 'Buy volume', value: 51200, sub: 'Total bought' },
  { label: 'Sell volume', value: 44661.68, sub: 'Total sold' },
  { label: 'Realized P&L', value: 4034.66, sub: '1 position closed', positive: true },
  { label: 'Total dividends', value: 336.31, sub: 'Dividend income' },
  { label: 'Currency fees', value: 110.82, sub: 'Conversion costs' },
  { label: 'Total deposits', value: 23500, sub: '23 deposits made' },
] as const

const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const DIVIDENDS = [14.2, 31.85, 12.4, 16.75, 34.1, 15.6, 19.3, 38.45, 18.9, 22.15, 41.8, 24.6]
const DIVIDENDS_TOTAL = DIVIDENDS.reduce((a, b) => a + b, 0)

const HOLDINGS = [
  { ticker: 'ASML', name: 'ASML Holding', value: 1360.85 },
  { ticker: 'JNJ', name: 'Johnson & Johnson', value: 981.19 },
  { ticker: 'NVDA', name: 'Nvidia', value: 936.87 },
  { ticker: 'MSFT', name: 'Microsoft', value: 898.7 },
  { ticker: 'KO', name: 'Coca-Cola', value: 669.96 },
  { ticker: 'PEP', name: 'PepsiCo', value: 537.12 },
]
const HOLDINGS_TOTAL = 6490.19

const NAV = [
  { label: 'Upload', icon: Upload },
  { label: 'Portfolio', icon: LayoutGrid, active: true },
  { label: 'Dividends', icon: DollarSign },
  { label: 'Trading activity', icon: Activity },
]

/* --------------------------------------------------------------------------
   Chart geometry: a smooth monotone-ish line through the monthly values
   -------------------------------------------------------------------------- */

const VB_W = 600
const VB_H = 200
const Y_MAX = 50

const points = DIVIDENDS.map((v, i) => ({
  x: (i / (DIVIDENDS.length - 1)) * VB_W,
  y: VB_H - (v / Y_MAX) * VB_H,
}))

function smoothPath(pts: { x: number; y: number }[]) {
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const t = 0.18
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = p1.y + (p2.y - p0.y) * t
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y.toFixed(1)}`
  }
  return d
}

const LINE = smoothPath(points)
const AREA = `${LINE} L ${VB_W} ${VB_H} L 0 ${VB_H} Z`
const LAST = points[points.length - 1]

/* --------------------------------------------------------------------------
   Count-up: only when the page has just loaded, so a late hydration never
   flicks a visible figure back to zero.
   -------------------------------------------------------------------------- */

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function CountUp({ value, format, delay = 0.7 }: { value: number; format: (v: number) => string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || reduce || performance.now() > 1600) return
    el.textContent = format(0)
    const controls = animate(0, value, {
      duration: 1.4,
      delay,
      ease: EASE.outExpo,
      onUpdate: (v) => {
        el.textContent = format(v)
      },
    })
    return () => {
      controls.stop()
      el.textContent = format(value)
    }
  }, [value, format, delay, reduce])

  return <span ref={ref}>{format(value)}</span>
}

/* --------------------------------------------------------------------------
   The frame
   -------------------------------------------------------------------------- */

/**
 * Frosted product frame with a coded miniature of the Vizvest portfolio
 * dashboard. Decorative: hidden from assistive tech, with a text alternative.
 */
export function HeroProductFrame({ className }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <figure className={cn('relative z-30 m-0', className)}>
      <figcaption className="sr-only">
        Preview of the Vizvest portfolio dashboard: buy and sell volume, realized profit and loss, total dividends,
        currency fees and deposits, a monthly dividend income chart and the largest holdings.
      </figcaption>

      <div
        aria-hidden="true"
        className="relative select-none overflow-clip rounded-lg text-left xl:aspect-[11/6]"
      >
        {/* Frosted glass */}
        <div
          className="reveal-diagonal absolute inset-0 bg-background/50 backdrop-blur-[22px]"
          style={{ animationDuration: '250ms', animationDelay: '50ms' }}
        />

        {/* The app */}
        <div className="reveal-diagonal relative grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[232px_1fr] xl:absolute xl:inset-0 xl:grid-rows-[minmax(0,1fr)]">
          <Sidebar />

          <div className="flex min-h-0 min-w-0 flex-col bg-surface-1/35">
            <TopBar />

            <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5">
              <div>
                <p className="text-[15px] font-medium leading-5 tracking-[-0.2px] text-foreground md:text-[16px]">
                  Portfolio overview
                </p>
                <p className="mt-0.5 text-[12px] leading-4 text-fg-gray">Your portfolio in the selected timeframe</p>
              </div>

              <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 grid-rows-[auto_auto_auto_minmax(0,1fr)] border-l border-t border-border md:grid-cols-3 md:grid-rows-[auto_auto_minmax(0,1fr)]">
                {METRICS.map((m) => (
                  <div key={m.label} className="flex flex-col justify-between gap-3 border-b border-r border-border p-3 md:gap-4 md:p-4">
                    <p className="text-[11px] leading-[14px] text-fg-secondary md:text-[12px]">{m.label}</p>
                    <div>
                      <p
                        className={cn(
                          'tabular whitespace-nowrap text-[15px] font-medium leading-5 tracking-[-0.3px] md:text-[18px] md:leading-7 md:tracking-[-0.4px] lg:text-[20px] xl:text-[22px]',
                          'positive' in m && m.positive ? 'text-positive' : 'text-foreground'
                        )}
                      >
                        <CountUp value={m.value} format={'positive' in m && m.positive ? fmtSigned : fmt} />
                      </p>
                      <p className="mt-0.5 text-[11px] leading-[14px] text-fg-gray">{m.sub}</p>
                    </div>
                  </div>
                ))}

                <DividendChart reduce={!!reduce} />
                <Holdings />
              </div>
            </div>
          </div>
        </div>

        {/* Hairline ring and the light catching the top-left edge */}
        <div className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] shadow-frame">
          <div
            className="absolute inset-0 rounded-[inherit] p-px"
            style={{
              background: 'radial-gradient(420px 260px at 0% 0%, hsl(var(--primary) / 0.35), transparent 70%)',
              WebkitMask: 'linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)',
              WebkitMaskComposite: 'xor',
              mask: 'linear-gradient(black 0 0) content-box exclude, linear-gradient(black 0 0)',
              animation: 'fade-in 1500ms var(--ease-smoothstep) 100ms both',
            }}
          />
        </div>
      </div>
    </figure>
  )
}

function Sidebar() {
  return (
    <aside className="hidden min-h-0 flex-col gap-1 overflow-hidden border-r border-border bg-surface-1/60 px-3 py-4 md:flex">
      <div className="flex items-center gap-2 px-2 pb-3 pt-1.5 text-[13px] font-medium leading-[18px] text-foreground">
        <svg width="14" height="12" viewBox="0 0 18 16" fill="none" className="shrink-0">
          <path d="M0 0h2.9l5.4 16H5.4L0 0Z" fill="currentColor" />
          <path d="M3.9 0h3.7l3.6 10.6L14.6 0H18l-5.3 16H9.3L3.9 0Z" fill="currentColor" />
        </svg>
        Vizvest
      </div>

      {NAV.map(({ label, icon: Icon, active }) => (
        <div
          key={label}
          className={cn(
            'flex items-center gap-2.5 rounded-sm px-2 py-[7px] text-[13px] leading-[18px]',
            active ? 'bg-surface-4 text-foreground' : 'text-fg-secondary'
          )}
        >
          <Icon strokeWidth={1.5} className={cn('size-3.5', active ? 'text-foreground' : 'text-fg-gray')} />
          {label}
        </div>
      ))}

      <p className="px-2 pb-1.5 pt-5 text-[12px] leading-4 text-fg-gray">Files</p>
      {[
        { name: 'export-2025.csv', rows: '742' },
        { name: 'export-2026.csv', rows: '542' },
      ].map((f) => (
        <div key={f.name} className="flex items-center gap-2.5 px-2 py-[7px] text-[12px] leading-4 text-fg-secondary">
          <FileText strokeWidth={1.5} className="size-3.5 text-fg-gray" />
          <span className="truncate">{f.name}</span>
          <span className="tabular ml-auto text-fg-gray">{f.rows}</span>
        </div>
      ))}

      <div className="mt-auto flex items-center gap-2 px-2 pt-4 text-[12px] leading-4 text-fg-secondary">
        <span className="status-dot" />
        Runs in your browser
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <div className="flex h-[46px] shrink-0 items-center gap-2 border-b border-border px-4 md:px-6">
      <span className="flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-[12px] leading-4 text-foreground">
        <Calendar strokeWidth={1.5} className="size-3.5 text-fg-gray" />
        <span className="tabular md:hidden">Jan 2025 – Oct 2026</span>
        <span className="tabular hidden md:inline">Jan 7, 2025 – Oct 30, 2026</span>
      </span>
      <span className="flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-[12px] leading-4 text-foreground">
        <span className="hidden text-fg-gray sm:inline">Base currency</span>
        EUR
      </span>
      <span className="tabular ml-auto hidden text-[12px] leading-4 text-fg-gray lg:inline">1,284 transactions</span>
    </div>
  )
}

function DividendChart({ reduce }: { reduce: boolean }) {
  return (
    <div className="col-span-2 flex min-h-[180px] flex-col md:col-span-3 lg:col-span-2 border-b border-r border-border p-3 md:p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <p className="text-[13px] font-medium leading-[18px] text-foreground">Dividend income</p>
          <p className="hidden text-[11px] leading-[14px] text-fg-gray sm:block">Last 12 months</p>
        </div>
        <p className="tabular text-[13px] leading-[18px] text-foreground">{fmt(DIVIDENDS_TOTAL)}</p>
      </div>

      <div className="relative mt-3 flex min-h-0 flex-1 gap-2">
        {/* y axis */}
        <div className="tabular flex flex-col justify-between pb-5 text-right text-[10px] leading-3 text-fg-gray">
          <span>€50</span>
          <span>€25</span>
          <span>€0</span>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-[110px] flex-1">
            {/* dashed hairline grid */}
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
              {[0, 0.5, 1].map((f) => (
                <line
                  key={f}
                  x1="0"
                  x2={VB_W}
                  y1={f * VB_H}
                  y2={f * VB_H}
                  stroke="hsl(var(--border-strong))"
                  strokeDasharray="3 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={reduce ? { duration: 0 } : { duration: 1.6, delay: 0.9, ease: EASE.outQuart }}
            >
              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hero-div-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-ink))" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="hsl(var(--chart-ink))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={AREA} fill="url(#hero-div-fill)" />
                <path
                  d={LINE}
                  fill="none"
                  stroke="hsl(var(--chart-ink))"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </motion.div>

            {/* end point */}
            <motion.span
              className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground"
              style={{ left: `${(LAST.x / VB_W) * 100}%`, top: `${(LAST.y / VB_H) * 100}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 2.2 }}
            />
          </div>

          {/* x axis */}
          <div className="relative mt-2 h-3 text-[10px] leading-3 text-fg-gray">
            {MONTHS.map((m, i) => (
              <span
                key={m}
                className={cn(
                  'absolute top-0',
                  i === 0 ? 'translate-x-0' : i === MONTHS.length - 1 ? '-translate-x-full' : '-translate-x-1/2',
                  ((i % 2 === 1 && i !== MONTHS.length - 1) || i === MONTHS.length - 2) && 'hidden lg:inline'
                )}
                style={{ left: `${(points[i].x / VB_W) * 100}%` }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Holdings() {
  return (
    <div className="hidden min-h-0 flex-col overflow-hidden border-b border-r border-border lg:flex">
      <div className="flex items-baseline justify-between px-4 pb-2 pt-4">
        <p className="text-[13px] font-medium leading-[18px] text-foreground">Current holdings</p>
        <p className="text-[11px] leading-[14px] text-fg-gray">9 stocks</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {HOLDINGS.map((h) => (
          <div key={h.ticker} className="flex items-center gap-3 border-t border-border px-4 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium leading-4 text-foreground">{h.ticker}</p>
              <p className="truncate text-[11px] leading-[14px] text-fg-gray">{h.name}</p>
            </div>
            <div className="text-right">
              <p className="tabular text-[12px] leading-4 text-foreground">{fmt(h.value)}</p>
              <p className="tabular text-[11px] leading-[14px] text-fg-gray">
                {((h.value / HOLDINGS_TOTAL) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
