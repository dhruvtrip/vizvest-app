'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import {
  AreaTrend,
  BarRows,
  ChartCard,
  ColumnPlot,
  Donut,
  HeatLegend,
  KpiTile,
  Legend,
  heatFill,
  type BarRow,
  type ColumnDatum,
  type Segment,
} from '@/components/charts'
import { PanelSwap, SlidingTabs } from '@/components/motion'
import { useReducedMotionSafe } from '@/components/motion/use-reduced-motion-safe'
import { Activity, HandCoins, LayoutDashboard } from '@/components/icons'

type View = 'portfolio' | 'dividends' | 'activity'

const views: { value: View; label: string; icon: React.ReactNode }[] = [
  { value: 'portfolio', label: 'Portfolio', icon: <LayoutDashboard size={14} strokeWidth={2} className="max-[379px]:hidden" /> },
  { value: 'dividends', label: 'Dividends', icon: <HandCoins size={14} strokeWidth={2} className="max-[379px]:hidden" /> },
  { value: 'activity', label: 'Activity', icon: <Activity size={14} strokeWidth={2} className="max-[379px]:hidden" /> },
]

const euro = (value: number, digits = 2) =>
  `€${Math.abs(value).toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
const signed = (value: number) => `${value >= 0 ? '+' : '-'}${euro(value)}`

/* Sample figures. One made-up portfolio, consistent across the three views. */

const allocation: Segment[] = [
  { id: 'NVDA', label: 'NVDA', value: 6240, display: '24%', color: 1 },
  { id: 'MSFT', label: 'MSFT', value: 4940, display: '19%', color: 2 },
  { id: 'ASML', label: 'ASML', value: 4160, display: '16%', color: 3 },
  { id: 'JPM', label: 'JPM', value: 3380, display: '13%', color: 4 },
  { id: 'KO', label: 'KO', value: 2600, display: '10%', color: 5 },
  { id: 'other', label: 'Other', value: 4680, display: '18%', color: 6 },
]

const realised: BarRow[] = [
  ['NVDA', 'Nvidia', 1941.15],
  ['MSFT', 'Microsoft', 812.4],
  ['JPM', 'JPMorgan Chase', 544.02],
  ['ASML', 'ASML Holding', 318.75],
  ['KO', 'Coca-Cola', 96.21],
  ['TSLA', 'Tesla', -142.33],
  ['PYPL', 'PayPal', -388.6],
].map(([id, note, value]) => ({
  id: id as string,
  label: id as string,
  note: note as string,
  value: value as number,
  display: signed(value as number),
}))

const monthLabels = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const monthlyIncome = [62.4, 88.1, 71.3, 104.6, 96.2, 83.5, 121.8, 109.4, 97.7, 138.9, 142.1, 168.2]

const dividendsByMonth: ColumnDatum[] = monthlyIncome.map((value, index) => ({
  id: monthLabels[index],
  label: `${monthLabels[index]} ${index < 2 ? 2025 : 2026}`,
  value,
  display: euro(value),
}))

const cumulativeIncome = monthlyIncome.map((_, index) => {
  const total = monthlyIncome.slice(0, index + 1).reduce((sum, value) => sum + value, 0)
  return {
    id: monthLabels[index],
    label: `${monthLabels[index]} ${index < 2 ? 2025 : 2026}`,
    value: total,
    display: euro(total),
  }
})

const tradesByWeekday: BarRow[] = [
  ['Monday', 48],
  ['Tuesday', 57],
  ['Wednesday', 51],
  ['Thursday', 44],
  ['Friday', 69],
].map(([label, value]) => ({
  id: label as string,
  label: label as string,
  value: value as number,
  display: `${value}`,
}))

// 26 weeks of weekdays. Fixed pattern, so server and client render the same grid.
const heat: (0 | 1 | 2 | 3 | 4)[] = Array.from({ length: 26 * 5 }, (_, index) => {
  const wave = (index * 37 + (index % 7) * 11 + Math.floor(index / 9) * 5) % 17
  if (wave < 7) return 0
  if (wave < 11) return 1
  if (wave < 14) return 2
  if (wave < 16) return 3
  return 4
})

/**
 * A working miniature of the dashboard with sample data. It is always drawn
 * in the dark theme because it sits on the dark panel.
 */
export function ProductPreview() {
  const [view, setView] = useState<View>('portfolio')
  // Hovering a legend entry lights its ring segment, and the other way round.
  const [activeHolding, setActiveHolding] = useState<string | null>(null)

  // The tabs advance on their own so visitors see there is more than one
  // view. Hover, focus, scrolling away or a hidden browser tab pause it; the
  // first time a visitor picks a tab (or taps the card) it stops for good.
  const cardRef = useRef<HTMLDivElement>(null)
  const panelsRef = useRef<HTMLDivElement>(null)
  const [auto, setAuto] = useState(true)
  const pointerType = useRef('mouse')
  const [hovering, setHovering] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [hidden, setHidden] = useState(false)
  const inView = useInView(cardRef, { amount: 0.3 })
  const reduced = useReducedMotionSafe()
  const cycling = auto && !reduced

  useEffect(() => {
    const update = () => setHidden(document.visibilityState === 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  // While cycling, hold the panel area at the tallest view seen so far, so
  // the page below does not jump on every switch.
  const [minHeight, setMinHeight] = useState(0)
  useLayoutEffect(() => {
    const el = panelsRef.current
    // Without an observer the lock is never set, so there is nothing to release.
    if (!cycling || !el || typeof ResizeObserver === 'undefined') return
    let width = el.offsetWidth
    const observer = new ResizeObserver(() => {
      // A new width resets the lock: the tallest view differs by layout.
      const reset = el.offsetWidth !== width
      width = el.offsetWidth
      const panel = el.firstElementChild as HTMLElement | null
      const height = panel?.offsetHeight ?? 0
      setMinHeight((prev) => (reset ? height : Math.max(prev, height)))
    })
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => {
      observer.disconnect()
      // Cycling stopped: release the height lock in the same layout pass.
      setMinHeight(0)
    }
  }, [cycling])

  const advance = () => setView((current) => views[(views.findIndex((v) => v.value === current) + 1) % views.length].value)
  const choose = (next: View) => {
    setAuto(false)
    setView(next)
  }

  return (
    <div className="dark">
      <div
        ref={cardRef}
        className="rounded-3xl border border-white/[0.08] bg-background/85 p-3 text-foreground shadow-lift backdrop-blur-xl sm:p-5 lg:p-6"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setHovering(true)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setHovering(false)
        }}
        onPointerDown={(e) => {
          pointerType.current = e.pointerType
        }}
        onClick={(e) => {
          // Any click on a tab hands over control, even on the one showing.
          // On touch, which has no hover to pause with, any tap on the card
          // does too. Click, not pointerdown, so a scroll that starts here does not.
          const onTab = (e.target as Element).closest('[role="tab"]') !== null
          if (onTab || pointerType.current !== 'mouse') setAuto(false)
        }}
        onFocus={() => setFocusWithin(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false)
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 px-1">
            <h2 className="text-sm font-medium">Portfolio</h2>
            <p className="figure truncate text-xs font-normal text-muted-foreground">
              6 Jan 2025 to 30 Oct 2026 · base currency EUR
            </p>
          </div>
          <SlidingTabs
            aria-label="Preview a dashboard view"
            idPrefix="preview"
            items={views}
            value={view}
            onValueChange={choose}
            size="sm"
            progress={cycling ? { paused: hovering || focusWithin || !inView || hidden, onDone: advance } : null}
          />
        </div>

        <div ref={panelsRef} className="mt-4" style={minHeight ? { minHeight } : undefined}>
          <PanelSwap activeKey={view}>
            <div role="tabpanel" id={`preview-panel-${view}`} aria-labelledby={`preview-tab-${view}`}>
              {view === 'portfolio' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
                    <KpiTile label="Buy volume" value="€91,608.29" sub="Total bought" />
                    <KpiTile label="Realised profit" value="+€3,181.60" sub="7 positions closed" tone="up" />
                    <KpiTile label="Net dividends" value="€1,284.20" sub="53 payments" />
                    <KpiTile label="Currency fees" value="€167.59" sub="Conversion costs" />
                  </div>
                  <div className="grid gap-3 lg:grid-cols-5">
                    <ChartCard title="Allocation by holding" color={1} note="Net invested" className="lg:col-span-2">
                      <div className="flex flex-col items-center gap-5 py-1 sm:flex-row sm:justify-center lg:flex-col">
                        <Donut
                          segments={allocation}
                          aria-label="Share of net invested by holding"
                          size={164}
                          thickness={18}
                          activeId={activeHolding}
                          onActiveChange={setActiveHolding}
                        >
                          <span className="figure text-lg font-semibold tracking-tight">€26,000</span>
                          <span className="text-2xs font-normal text-muted-foreground">net invested</span>
                        </Donut>
                        <Legend
                          className="max-w-[17rem] justify-center"
                          activeId={activeHolding}
                          onActiveChange={setActiveHolding}
                          items={allocation.map((segment) => ({
                            id: segment.id,
                            label: segment.label,
                            color: segment.color,
                            value: segment.display,
                          }))}
                        />
                      </div>
                    </ChartCard>
                    <ChartCard
                      title="Realised profit by stock"
                      color={2}
                      note="Closed trades"
                      className="hidden sm:block lg:col-span-3"
                    >
                      <BarRows rows={realised} color={2} signed aria-label="Realised profit and loss by stock" maxRows={5} />
                    </ChartCard>
                  </div>
                </div>
              )}

              {view === 'dividends' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
                    <KpiTile label="Net dividends" value="€1,284.20" sub="Reached your account" tone="up" />
                    <KpiTile label="Withholding tax" value="€226.62" sub="Taken at source" />
                    <KpiTile label="Payments" value="53" sub="From 9 companies" />
                    <KpiTile label="Average payment" value="€24.23" sub="Per payment" />
                  </div>
                  <div className="grid gap-3 lg:grid-cols-5">
                    <ChartCard title="Dividends by month" color={2} note="Last 12 months" className="lg:col-span-3">
                      <ColumnPlot
                        data={dividendsByMonth}
                        color={2}
                        aria-label="Net dividend income for each of the last 12 months"
                        reference={{ value: 101.15, label: 'median €101' }}
                        emphasize={(datum) => datum.value >= 138}
                        xLabels="auto"
                      />
                    </ChartCard>
                    <ChartCard
                      title="Income so far"
                      color={4}
                      note="Cumulative"
                      className="hidden sm:block lg:col-span-2"
                    >
                      <AreaTrend
                        data={cumulativeIncome}
                        color={4}
                        aria-label="Cumulative net dividend income over the last 12 months"
                        height={168}
                        xLabels="ends"
                      />
                    </ChartCard>
                  </div>
                </div>
              )}

              {view === 'activity' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4">
                    <KpiTile label="Trades" value="269" sub="188 buys, 81 sells" />
                    <KpiTile label="Win rate" value="73%" sub="59 of 81 sells in profit" tone="up" />
                    <KpiTile label="Longest streak" value="9 days" sub="7 to 17 Apr 2026" />
                    <KpiTile label="Busiest month" value="Apr 2026" sub="30 trades" />
                  </div>
                  <div className="grid gap-3 lg:grid-cols-5">
                    <ChartCard title="Trading days" color={3} note="Last 26 weeks" className="lg:col-span-3">
                      <div
                        role="img"
                        aria-label="Calendar heatmap of trades per weekday over the last 26 weeks"
                        className="grid grid-flow-col grid-rows-5 gap-[3px]"
                      >
                        {heat.map((level, index) => (
                          <span
                            key={index}
                            style={{ background: heatFill(level, 3) }}
                            className="aspect-square rounded-[3px]"
                          />
                        ))}
                      </div>
                      <HeatLegend color={3} className="mt-3" />
                    </ChartCard>
                    <ChartCard
                      title="Trades by weekday"
                      color={5}
                      note="All time"
                      className="hidden sm:block lg:col-span-2"
                    >
                      <BarRows rows={tradesByWeekday} color={5} emphasis="max" aria-label="Number of trades on each weekday" />
                    </ChartCard>
                  </div>
                </div>
              )}
            </div>
          </PanelSwap>
        </div>
      </div>
    </div>
  )
}
