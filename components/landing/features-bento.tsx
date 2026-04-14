'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

const features = [
  {
    eyebrow: 'TRADING ACTIVITY',
    title: 'Track every trade, every day',
    description: 'Visualize your trading patterns with an interactive activity heatmap.',
    className: 'md:col-span-1',
    badge: 'New',
    showHeatmap: true,
  },
  {
    eyebrow: 'PERFORMANCE',
    title: 'Full P&L at a glance',
    description: 'Track your gains and losses over time with detailed analytics.',
    className: 'md:col-span-1',
    showPercentage: true,
    percentage: '+24.5%'
  },
  {
    eyebrow: 'TAX & FEES',
    title: 'See what trading actually costs',
    description: 'Every commission, FX spread, and withholding tax tallied automatically — so you know your real return, not the headline one.',
    className: 'h-full',
    showCostBreakdown: true,
    costs: [
      { label: 'FEES PAID', value: '€47.82', tone: 'neutral' as const },
      { label: 'FX COSTS', value: '€12.14', tone: 'neutral' as const },
      { label: 'WITHHOLDING TAX', value: '€8.21', tone: 'neutral' as const },
      { label: 'NET RETURN', value: '+€4,144.36', tone: 'positive' as const },
    ]
  },
  {
    eyebrow: 'DIVIDEND TRACKING',
    title: 'Watch your income compound',
    description: 'Monitor dividend income, yields, and payment schedules.',
    className: 'md:col-span-1',
    badge: 'Popular',
    showYield: true,
    yieldValue: '3.8%'
  },
  {
    eyebrow: 'STOCK ANALYSIS',
    title: 'All trades in one view',
    description: 'View individual stocks with full transaction history.',
    className: 'md:col-span-1',
    showTransactions: true,
    transactions: [
      { type: 'BUY', ticker: 'AAPL' },
      { type: 'BUY', ticker: 'MSFT' },
      { type: 'SELL', ticker: 'TSLA' },
      { type: 'BUY', ticker: 'GOOGL' },
      { type: 'SELL', ticker: 'NVDA' },
    ]
  },
  {
    eyebrow: 'MULTI-CURRENCY',
    title: 'Trade across currencies natively',
    description: 'USD, EUR, GBP, CHF and more — normalized automatically.',
    className: 'h-full',
    compact: true,
    currencies: ['USD', 'GBX', 'GBP', 'EUR', 'CHF', 'CAD']
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isCardInView = useInView(cardRef, { margin: '-50px' })

  // Performance tile: animate -2 → +25 → pause → -2 → pause → loop
  const [perfValue, setPerfValue] = useState(-2)
  const perfPhaseRef = useRef<'up' | 'pause-high' | 'down' | 'pause-low'>('up')
  const perfPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!feature.showPercentage || !isCardInView) return

    const interval = setInterval(() => {
      const phase = perfPhaseRef.current

      if (phase === 'pause-high' || phase === 'pause-low') return

      setPerfValue(prev => {
        const step = 0.3
        if (phase === 'up') {
          const next = +(prev + step).toFixed(1)
          if (next >= 25) {
            perfPhaseRef.current = 'pause-high'
            perfPauseTimerRef.current = setTimeout(() => {
              perfPhaseRef.current = 'down'
            }, 1200)
            return 25
          }
          return next
        } else {
          const next = +(prev - step).toFixed(1)
          if (next <= -2) {
            perfPhaseRef.current = 'pause-low'
            perfPauseTimerRef.current = setTimeout(() => {
              perfPhaseRef.current = 'up'
            }, 1200)
            return -2
          }
          return next
        }
      })
    }, 70)

    return () => {
      clearInterval(interval)
      if (perfPauseTimerRef.current) clearTimeout(perfPauseTimerRef.current)
    }
  }, [feature.showPercentage, isCardInView])

  // Dividend tile: animate yield 0% → 5% → 0%
  const [yieldValue, setYieldValue] = useState(0)
  const yieldDirectionRef = useRef<'up' | 'down'>('up')

  useEffect(() => {
    if (!feature.showYield || !isCardInView) return
    const interval = setInterval(() => {
      setYieldValue(prev => {
        const step = 0.1
        if (yieldDirectionRef.current === 'up') {
          const next = +(prev + step).toFixed(1)
          if (next >= 5) { yieldDirectionRef.current = 'down'; return 5 }
          return next
        } else {
          const next = +(prev - step).toFixed(1)
          if (next <= 0) { yieldDirectionRef.current = 'up'; return 0 }
          return next
        }
      })
    }, 120)
    return () => clearInterval(interval)
  }, [feature.showYield, isCardInView])

  // Trading Activity heatmap: cascading fill animation
  const HEATMAP_ROWS = 7
  const HEATMAP_COLS = 14
  const HEATMAP_TOTAL = HEATMAP_ROWS * HEATMAP_COLS
  const [heatmapCells, setHeatmapCells] = useState<number[]>(() => new Array(HEATMAP_TOTAL).fill(0))
  const [heatmapPoppedCell, setHeatmapPoppedCell] = useState<number | null>(null)
  const heatmapPhaseRef = useRef<'filling' | 'holding' | 'resetting'>('filling')
  const heatmapActivatedRef = useRef(0)
  const heatmapOrderRef = useRef<number[]>([])
  const isHoveredRef = useRef(false)

  // Generate a left-to-right biased random order for cell activation
  const generateFillOrder = () => {
    const indices = Array.from({ length: HEATMAP_TOTAL }, (_, i) => i)
    // Sort by column (left to right) with randomness within each column band
    indices.sort((a, b) => {
      const colA = a % HEATMAP_COLS
      const colB = b % HEATMAP_COLS
      // Add randomness: band of ~3 columns can intermix
      const bandA = Math.floor(colA / 3) + Math.random() * 0.8
      const bandB = Math.floor(colB / 3) + Math.random() * 0.8
      return bandA - bandB
    })
    return indices
  }

  useEffect(() => {
    if (!feature.showHeatmap || !isCardInView) return

    heatmapOrderRef.current = generateFillOrder()
    heatmapActivatedRef.current = 0
    heatmapPhaseRef.current = 'filling'
    setHeatmapCells(new Array(HEATMAP_TOTAL).fill(0))

    const getInterval = () => isHoveredRef.current ? 60 : 150

    let timeoutId: ReturnType<typeof setTimeout>
    let holdTimeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      const phase = heatmapPhaseRef.current

      if (phase === 'filling') {
        const idx = heatmapActivatedRef.current
        if (idx < HEATMAP_TOTAL) {
          const cellIndex = heatmapOrderRef.current[idx]
          // Assign random intensity level 1-4
          const level = Math.random() < 0.15 ? 4 : Math.random() < 0.35 ? 3 : Math.random() < 0.6 ? 2 : 1
          setHeatmapCells(prev => {
            const next = [...prev]
            next[cellIndex] = level
            return next
          })
          setHeatmapPoppedCell(cellIndex)
          setTimeout(() => setHeatmapPoppedCell(null), 200)
          heatmapActivatedRef.current++
        } else {
          // All cells filled, hold
          heatmapPhaseRef.current = 'holding'
          holdTimeoutId = setTimeout(() => {
            heatmapPhaseRef.current = 'resetting'
          }, 1500)
        }
      } else if (phase === 'resetting') {
        // Reset all at once, then restart
        setHeatmapCells(new Array(HEATMAP_TOTAL).fill(0))
        setHeatmapPoppedCell(null)
        heatmapOrderRef.current = generateFillOrder()
        heatmapActivatedRef.current = 0
        heatmapPhaseRef.current = 'filling'
      }

      timeoutId = setTimeout(tick, getInterval())
    }

    timeoutId = setTimeout(tick, getInterval())

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(holdTimeoutId)
    }
  }, [feature.showHeatmap, isCardInView])

  // Stock analysis: sequential badge press
  const [pressedBadgeIndex, setPressedBadgeIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!feature.showTransactions || !isCardInView) return
    const badgeCount = feature.transactions?.length ?? 0
    let current = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const interval = setInterval(() => {
      setPressedBadgeIndex(current)
      timeoutId = setTimeout(() => setPressedBadgeIndex(null), 600)
      current = (current + 1) % badgeCount
    }, 1800)

    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [feature.showTransactions, feature.transactions, isCardInView])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn('relative', feature.className)}
    >
      <Card className={cn(
        'relative h-full overflow-hidden',
        'border-border/50',
        'bg-card/50 backdrop-blur-sm'
      )}>
        <CardContent className={cn(
          'relative z-10 h-full flex flex-col',
          feature.compact ? 'p-4' : 'p-6'
        )}>
          {/* Header */}
          <div className={cn('flex items-start justify-between gap-2', feature.compact ? 'mb-2' : 'mb-3')}>
            <p className="text-[11px] font-mono font-medium text-muted-foreground tracking-[1.2px] uppercase">
              {feature.eyebrow}
            </p>
            {feature.badge && (
              <Badge variant="secondary" className="text-[10px] bg-muted/50 backdrop-blur-sm shrink-0">
                {feature.badge}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div>
            <h3 className={cn(
              'font-normal text-foreground tracking-tight',
              feature.compact ? 'text-sm mb-0' : 'text-lg mb-2'
            )}>
              {feature.title}
            </h3>
            {!feature.compact && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            )}
          </div>

          {/* Feature-specific content */}
          {feature.showPercentage && (
            <div className="mt-4 flex items-center justify-center">
              <span
                className={cn(
                  'text-5xl sm:text-6xl font-light font-mono tracking-tight transition-colors duration-300 tabular-nums',
                  perfValue >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}
              >
                {perfValue >= 0 ? '+' : ''}{perfValue.toFixed(1)}%
              </span>
            </div>
          )}

          {feature.showYield && (
            <div className="mt-4 flex items-center justify-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32" role="img" aria-label={`Yield: ${yieldValue.toFixed(1)}%`}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  <motion.circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="url(#yieldGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    animate={{ pathLength: yieldValue / 10 }}
                    transition={{ duration: 0.08, ease: 'linear' }}
                  />
                  <defs>
                    <linearGradient id="yieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-semibold font-mono text-emerald-500 tabular-nums tracking-tight">
                  {yieldValue.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {feature.showTransactions && feature.transactions && (
            <div className="mt-4 flex flex-wrap gap-2">
              {feature.transactions.map((tx, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  animate={pressedBadgeIndex === i
                    ? { scale: 0.82, y: 2 }
                    : { scale: 1, y: 0 }
                  }
                  transition={pressedBadgeIndex === i
                    ? { type: 'spring', stiffness: 400, damping: 15 }
                    : { type: 'spring', stiffness: 300, damping: 20 }
                  }
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-shadow duration-200',
                    tx.type === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
                    pressedBadgeIndex === i && 'shadow-inner brightness-110'
                  )}
                >
                  <span>{tx.type}</span>
                  <span className="text-muted-foreground font-mono">{tx.ticker}</span>
                </motion.div>
              ))}
            </div>
          )}

          {feature.currencies && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {feature.currencies.map((currency) => (
                <div key={currency} className="px-2 py-0.5 rounded-md bg-muted/50 text-[11px] font-mono text-muted-foreground">
                  {currency}
                </div>
              ))}
            </div>
          )}

          {feature.showCostBreakdown && feature.costs && (
            <div className="mt-5 flex flex-col gap-2">
              {feature.costs.map((cost, i) => (
                <motion.div
                  key={cost.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2.5',
                    cost.tone === 'positive'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border/50 bg-muted/30'
                  )}
                >
                  <p className="text-[10px] font-mono text-muted-foreground tracking-[1.2px]">
                    {cost.label}
                  </p>
                  <p className={cn(
                    'text-sm font-mono font-semibold tabular-nums',
                    cost.tone === 'positive' ? 'text-emerald-500' : 'text-foreground'
                  )}>
                    {cost.value}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {feature.showHeatmap && (
            <div
              className="mt-auto pt-4 border-t border-border/50"
              onMouseEnter={() => { isHoveredRef.current = true }}
              onMouseLeave={() => { isHoveredRef.current = false }}
            >
              <div className="grid gap-[2px] justify-center" style={{ gridTemplateColumns: `repeat(${HEATMAP_COLS}, 8px)` }}>
                {heatmapCells.map((level, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-[8px] h-[8px] rounded-[2px] transition-colors duration-200',
                      level === 0 && 'bg-neutral-200 dark:bg-neutral-800',
                      level === 1 && 'bg-green-400/40',
                      level === 2 && 'bg-green-500/60',
                      level === 3 && 'bg-green-600/80',
                      level === 4 && 'bg-green-700',
                    )}
                    style={{
                      transform: heatmapPoppedCell === i ? 'scale(1.3)' : 'scale(1)',
                      transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-[9px] text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-[2px]">
                  {['bg-neutral-200 dark:bg-neutral-800', 'bg-green-400/40', 'bg-green-500/60', 'bg-green-600/80', 'bg-green-700'].map((color, i) => (
                    <div key={i} className={cn('w-[8px] h-[8px] rounded-[1px]', color)} />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FeaturesBento() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-24 lg:py-32 relative" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30 dark:bg-muted/10" />
      
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 xl:px-24 max-w-7xl relative">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6"
            role="status"
            aria-label="Features section"
          >
            <Zap className="w-3 h-3" aria-hidden="true" />
            Features
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-light mb-4 tracking-tight">
            Everything you need to understand
            <span className="block text-primary">about your investments</span>
          </h2>
          <p className="text-muted-foreground">
            Features that help you see what's actually happening with your portfolio.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 auto-rows-auto md:auto-rows-[280px]">
          {features
            .filter(f => !f.showCostBreakdown && !f.compact)
            .map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          {/* Col 3 stack: Tax & Fees (large) + Multi-Currency (compact) */}
          <div className="md:col-start-3 md:row-start-1 md:row-span-2 flex flex-col gap-4 lg:gap-5 min-h-0">
            {features.filter(f => f.showCostBreakdown).map((feature, index) => (
              <div key={feature.title} className="md:flex-1 md:min-h-0">
                <FeatureCard feature={feature} index={2} />
              </div>
            ))}
            {features.filter(f => f.compact).map((feature, index) => (
              <div key={feature.title} className="shrink-0 h-[120px]">
                <FeatureCard feature={feature} index={5} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
