'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpToLine,
  Coins,
  CopyMinus,
  Crosshair,
  Files,
  Globe,
  Hash,
  History,
  Landmark,
  Percent,
  Receipt,
  Scale,
  ShieldMinus,
  ShoppingBag,
  Tag,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { Container, GridGuides } from '@/components/layout/container'
import { EASE } from '@/lib/motion'

/**
 * Everything here is read by the real parser: transaction types from
 * lib/transaction-utils.ts, columns from lib/csv-validator.ts, conversion from
 * lib/currency-normalizer.ts, merging from lib/csv-merger.ts and history checks
 * from lib/partial-data-detector.ts.
 */
const ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: 'Market buy', icon: ShoppingBag },
  { label: 'Dividends', icon: Coins },
  { label: 'Withholding tax', icon: Receipt },
  { label: 'Market sell', icon: Tag },
  { label: 'Deposits', icon: Landmark },
  { label: 'Exchange rates', icon: Globe },

  { label: 'Limit buy', icon: ArrowDownToLine },
  { label: 'Interest on cash', icon: Percent },
  { label: 'Conversion fees', icon: ArrowLeftRight },
  { label: 'Limit sell', icon: ArrowUpToLine },
  { label: 'Multiple exports', icon: Files },
  { label: 'Base currency', icon: Scale },

  { label: 'Stop limit buy', icon: Crosshair },
  { label: 'Duplicate rows', icon: CopyMinus },
  { label: 'Realized results', icon: Target },
  { label: 'Stop sell', icon: ShieldMinus },
  { label: 'Partial history', icon: History },
  { label: 'ISIN and ticker', icon: Hash },
]

const CELLS = 6
const INTERVAL = 3000

export function ProofStrip() {
  const reduce = useReducedMotion()
  const gridRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || reduce) return
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.intersectionRatio >= 0.2), { threshold: [0, 0.2] })
    io.observe(grid)
    const id = window.setInterval(() => {
      if (visible && !document.hidden) setStep((s) => s + 1)
    }, INTERVAL)
    return () => {
      io.disconnect()
      window.clearInterval(id)
    }
  }, [reduce])

  return (
    <section aria-labelledby="proof-strip-title" className="relative">
      <GridGuides />
      <Container className="pb-20 pt-16 md:pb-[120px] md:pt-24">
        <div className="flex items-center px-6 pb-6 md:h-[72px] md:pb-0">
          <h2 id="proof-strip-title" className="text-p text-foreground">
            Reads everything in your Trading 212 export
          </h2>
        </div>

        <p className="sr-only">
          Vizvest reads market, limit and stop orders, deposits, dividends, interest on cash, withholding tax,
          currency conversion fees and exchange rates, and merges several exports with duplicate rows removed.
        </p>
        <div ref={gridRef} aria-hidden="true" className="cell-grid grid-cols-3 md:grid-cols-6">
          {Array.from({ length: CELLS }, (_, i) => {
            const item = ITEMS[(i + step * CELLS) % ITEMS.length]
            return (
              <div key={i} className="relative h-20 overflow-hidden md:h-[97px]">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={item.label}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2 text-center text-label font-medium text-foreground md:flex-row md:px-4 md:text-p-sm md:font-medium"
                    initial={{ opacity: 0, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(6px)' }}
                    transition={{ duration: 0.5, ease: EASE.swap, delay: i * 0.055 }}
                  >
                    <item.icon strokeWidth={1.5} className="size-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </motion.span>
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
