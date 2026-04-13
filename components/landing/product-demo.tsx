'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { HandCoins, TrendingUp, Eye } from 'lucide-react'

const HEATMAP_CELLS = [
  0.4, 0.5, 0.75, 1, 0.5, 0.75, 1, 0.75, 0.4, 0.5, 0.75, 1,
]

export function ProductDemo() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Top-left: Next Dividend — flies from center-right and down
  const tlOpacity = useTransform(scrollYProgress, [0.25, 0.42], [0, 1])
  const tlX = useTransform(scrollYProgress, [0.25, 0.48], [240, 0])
  const tlY = useTransform(scrollYProgress, [0.25, 0.48], [80, 0])
  const tlRotate = useTransform(scrollYProgress, [0.25, 0.48], [0, -4])

  // Top-right: Most Traded — flies from center-left and down
  const trOpacity = useTransform(scrollYProgress, [0.28, 0.45], [0, 1])
  const trX = useTransform(scrollYProgress, [0.28, 0.51], [-240, 0])
  const trY = useTransform(scrollYProgress, [0.28, 0.51], [80, 0])
  const trRotate = useTransform(scrollYProgress, [0.28, 0.51], [0, 3])

  // Bottom-left: Trading Activity — flies from center-right and up
  const blOpacity = useTransform(scrollYProgress, [0.31, 0.48], [0, 1])
  const blX = useTransform(scrollYProgress, [0.31, 0.54], [240, 0])
  const blY = useTransform(scrollYProgress, [0.31, 0.54], [-80, 0])
  const blRotate = useTransform(scrollYProgress, [0.31, 0.54], [0, 3])

  // Bottom-right: Realized P&L — flies from center-left and up
  const brOpacity = useTransform(scrollYProgress, [0.34, 0.51], [0, 1])
  const brX = useTransform(scrollYProgress, [0.34, 0.57], [-240, 0])
  const brY = useTransform(scrollYProgress, [0.34, 0.57], [-80, 0])
  const brRotate = useTransform(scrollYProgress, [0.34, 0.57], [0, -4])

  return (
    <section
      ref={ref}
      className="relative -mt-16 pb-24 lg:pb-32"
      aria-label="Product demo"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
        {/* Header */}
        <motion.div
          className="text-center mb-10 lg:mb-14 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6"
          >
            <Eye className="w-3 h-3" aria-hidden="true" />
            Product tour
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight mb-3 text-foreground">
            Real numbers. Real clarity.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground/80 max-w-xl mx-auto">
            Your trading history, rebuilt as a dashboard you&apos;ll actually want to open.
          </p>
        </motion.div>

        {/* Demo layout */}
        <div className="relative">
          {/* Desktop satellite cards — scroll-driven fly-out */}
          <div className="hidden lg:block">
            {/* Top-left: Next Dividend */}
            <motion.div
              style={{ x: tlX, y: tlY, rotate: tlRotate, opacity: tlOpacity }}
              className="absolute -left-2 xl:left-4 top-8 z-20 w-56"
            >
              <div className="rounded-2xl bg-[#14141A] border border-brand/20 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(51,190,84,0.15)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center">
                    <HandCoins className="w-3.5 h-3.5 text-brand" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#8A8A92] tracking-wider">
                    NEXT DIVIDEND
                  </span>
                </div>
                <p className="text-xl font-mono font-semibold text-white">€31.23</p>
                <p className="text-[11px] text-[#8A8A92] mt-1">JPM · highest dividend payer</p>
              </div>
            </motion.div>

            {/* Top-right: Most Traded */}
            <motion.div
              style={{ x: trX, y: trY, rotate: trRotate, opacity: trOpacity }}
              className="absolute -right-2 xl:right-4 top-8 z-20 w-60"
            >
              <div className="rounded-2xl bg-[#14141A] border border-brand/20 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(51,190,84,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-semibold text-white">NVDA</span>
                  <span className="px-2.5 py-1 rounded-full bg-brand text-[9px] font-mono font-bold text-[#0A0A0F] tracking-wider">
                    BUY
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xs font-mono font-medium text-white">100 shares · €92.90</span>
                  <span className="text-[9px] font-mono text-[#6A6A72]">most traded</span>
                </div>
              </div>
            </motion.div>

            {/* Bottom-left: Trading Activity */}
            <motion.div
              style={{ x: blX, y: blY, rotate: blRotate, opacity: blOpacity }}
              className="absolute -left-2 xl:left-4 bottom-2 z-20 w-56"
            >
              <div className="rounded-2xl bg-[#14141A] border border-brand/20 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(51,190,84,0.15)]">
                <p className="text-[10px] font-mono font-medium text-[#8A8A92] tracking-wider mb-1">
                  TRADING ACTIVITY
                </p>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-2xl font-mono font-semibold text-white">73%</span>
                  <span className="text-[11px] text-[#8A8A92] pb-0.5">win rate · 200W / 74L</span>
                </div>
                <div className="flex gap-[3px]" aria-hidden="true">
                  {HEATMAP_CELLS.map((opacity, i) => (
                    <div
                      key={i}
                      className="h-4 flex-1 rounded-[3px]"
                      style={{ backgroundColor: `rgba(51, 190, 84, ${opacity})` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Bottom-right: Realized P&L */}
            <motion.div
              style={{ x: brX, y: brY, rotate: brRotate, opacity: brOpacity }}
              className="absolute -right-2 xl:right-4 bottom-2 z-20 w-56"
            >
              <div className="rounded-2xl bg-[#14141A] border border-brand/20 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(51,190,84,0.15)]">
                <p className="text-[10px] font-mono font-medium text-[#8A8A92] tracking-wider mb-1">
                  REALIZED P&L
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold text-brand">+€422.53</span>
                  <TrendingUp className="w-4 h-4 text-brand mb-1" />
                </div>
                <p className="text-[11px] text-[#8A8A92] mt-1">19 winning positions closed</p>
              </div>
            </motion.div>
          </div>

          {/* Main Dashboard Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative z-10 mx-auto max-w-3xl"
          >
            <div className="rounded-2xl lg:rounded-[20px] bg-[#14141A] border border-[#26262E] p-4 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
              {/* Toolbar */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-mono text-[#6A6A72] tracking-wider mb-1">
                    TOTAL DIVIDEND INCOME
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-2xl sm:text-3xl font-mono font-semibold text-white">
                      €14.49
                    </span>
                    <span className="text-xs font-mono font-medium text-brand pb-0.5">
                      +20 payments
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#26262E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#26262E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
              </div>

              {/* Chart Image */}
              <div className="rounded-xl overflow-hidden mb-4">
                <Image
                  src="/assets/dividends-chart-preview.png"
                  alt="Cumulative dividend income chart showing growth from €0 to €14.49 between February and November 2021"
                  width={1134}
                  height={348}
                  className="w-full h-auto"
                />
              </div>

              {/* Bottom Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'BUY VOLUME', value: '€150,776.29', color: 'text-white' },
                  { label: 'REALIZED P&L', value: '+€4,212.53', color: 'text-brand' },
                  { label: 'DIVIDENDS', value: '€14.49', color: 'text-white' },
                  { label: 'POSITIONS', value: '35', color: 'text-white' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-lg bg-[#0A0A0F] border border-[#26262E] p-2.5 sm:p-3"
                  >
                    <p className="text-[8px] sm:text-[9px] font-mono text-[#6A6A72] tracking-wider mb-1">
                      {label}
                    </p>
                    <p className={`text-sm sm:text-base font-mono font-semibold ${color}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mobile satellites — stacked below main card */}
          <div className="lg:hidden mt-4 space-y-3 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="rounded-2xl bg-[#14141A] border border-brand/20 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center">
                  <HandCoins className="w-3.5 h-3.5 text-brand" />
                </div>
                <span className="text-[10px] font-mono font-medium text-[#8A8A92] tracking-wider">
                  NEXT DIVIDEND
                </span>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-xl font-mono font-semibold text-white">€31.23</span>
                <span className="text-[11px] text-[#8A8A92] pb-0.5">JPM · highest dividend payer</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="rounded-2xl bg-[#14141A] border border-brand/20 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-semibold text-white">NVDA</span>
                <span className="px-2.5 py-1 rounded-full bg-brand text-[9px] font-mono font-bold text-[#0A0A0F] tracking-wider">
                  BUY
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xs font-mono font-medium text-white">100 shares · €92.90</span>
                <span className="text-[9px] font-mono text-[#6A6A72]">most traded</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="rounded-2xl bg-[#14141A] border border-brand/20 p-4"
            >
              <p className="text-[10px] font-mono font-medium text-[#8A8A92] tracking-wider mb-1">
                TRADING ACTIVITY
              </p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-2xl font-mono font-semibold text-white">73%</span>
                <span className="text-[11px] text-[#8A8A92] pb-0.5">win rate · 200W / 74L</span>
              </div>
              <div className="flex gap-[3px]" aria-hidden="true">
                {HEATMAP_CELLS.map((opacity, i) => (
                  <div
                    key={i}
                    className="h-4 flex-1 rounded-[3px]"
                    style={{ backgroundColor: `rgba(51, 190, 84, ${opacity})` }}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="rounded-2xl bg-[#14141A] border border-brand/20 p-4"
            >
              <p className="text-[10px] font-mono font-medium text-[#8A8A92] tracking-wider mb-1">
                REALIZED P&L
              </p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-mono font-semibold text-brand">+€422.53</span>
                <TrendingUp className="w-4 h-4 text-brand mb-1" />
              </div>
              <p className="text-[11px] text-[#8A8A92] mt-1">19 winning positions closed</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
