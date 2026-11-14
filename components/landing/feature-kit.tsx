'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useInView, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { DUR, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Small kit shared by the landing page's miniature product mocks.
 * Mocks are decorative (aria-hidden) and animate once when scrolled into view.
 */

/**
 * Reduced-motion flag that is false for the server render and the hydration pass,
 * then follows the user preference. Branching styles on the raw preference during
 * hydration leaves the server's blur/transform styles stuck on the element.
 */
export function useReducedMotionSafe() {
  const prefers = useReducedMotion() ?? false
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && prefers
}

/** Ref + "has entered the viewport once" + reduced-motion flag */
export function useReveal<T extends Element = HTMLDivElement>(margin = '0px 0px -15% 0px') {
  const ref = useRef<T>(null)
  const shown = useInView(ref, { once: true, margin: margin as `${number}px` })
  const reduce = useReducedMotionSafe()
  return { ref, shown, reduce }
}

/**
 * Inline style for a one-shot blur-in driven by a CSS transition.
 * Under reduced motion only opacity changes, with no delay.
 */
export function revealStyle(shown: boolean, reduce: boolean, delayMs = 0, rise = 8): CSSProperties {
  if (reduce) {
    return { opacity: shown ? 1 : 0, transition: 'opacity 200ms ease-out' }
  }
  return {
    opacity: shown ? 1 : 0,
    filter: shown ? 'blur(0px)' : 'blur(4px)',
    transform: shown ? 'none' : `translateY(${rise}px)`,
    transitionProperty: 'opacity, filter, transform',
    transitionDuration: '600ms',
    transitionTimingFunction: 'var(--ease-house)',
    transitionDelay: `${delayMs}ms`,
  }
}

/** Edge fade into the page canvas. */
export function EdgeFade({ side, className }: { side: 'right' | 'bottom' | 'left'; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute z-10 from-transparent to-background',
        side === 'right' && 'inset-y-0 right-0 w-[120px] bg-gradient-to-r',
        side === 'left' && 'inset-y-0 left-0 w-10 bg-gradient-to-l',
        side === 'bottom' && 'inset-x-0 bottom-0 h-[96px] bg-gradient-to-b',
        className
      )}
    />
  )
}

/** Small rounded label used inside mocks (BUY, SELL, +24.5%) */
export function MockChip({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: 'neutral' | 'positive' | 'negative'
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'tabular inline-flex h-5 items-center gap-1 rounded-sm px-1.5 text-[11px] leading-none',
        tone === 'neutral' && 'bg-surface-4 text-fg-secondary',
        tone === 'positive' && 'bg-positive/15 text-positive',
        tone === 'negative' && 'bg-negative/15 text-negative',
        className
      )}
    >
      {children}
    </span>
  )
}

/** Ticker monogram square */
export function TickerMark({ ticker, className }: { ticker: string; className?: string }) {
  return (
    <span
      className={cn(
        'grid h-7 w-7 flex-none place-items-center rounded-md bg-surface-4 text-[10px] font-medium leading-none tracking-[-0.2px] text-foreground',
        className
      )}
    >
      {ticker.slice(0, 4)}
    </span>
  )
}

/** Segmented control look-alike (static) */
export function MockSegmented({ options, active, className }: { options: string[]; active: string; className?: string }) {
  return (
    <span className={cn('inline-flex gap-0.5 rounded-lg bg-surface-1 p-[3px] shadow-demo-surface', className)}>
      {options.map((o) => (
        <span
          key={o}
          className={cn(
            'rounded-md px-2 py-1 text-[11px] leading-[14px]',
            o === active ? 'bg-surface-5 text-foreground' : 'text-fg-gray'
          )}
        >
          {o}
        </span>
      ))}
    </span>
  )
}

/** Dotted horizontal guide used in mock charts */
export const DOTTED_LINE: CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--border-strong)) 0 4px, transparent 4px 8px)',
}

/** Deterministic PRNG so server and client render the same mock data */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const EUR = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })
export const eur = (n: number) => EUR.format(n)

/**
 * One-shot blur-in on scroll for landing blocks (same values as BlurReveal:
 * 600ms ease-out-quad, 24px rise, 8px blur). Under reduced motion the rise and
 * blur resolve instantly and only opacity fades, and the hydration pass never
 * branches on the preference.
 */
export function Reveal({
  delay = 0,
  children,
  ...props
}: Omit<HTMLMotionProps<'div'>, 'initial' | 'whileInView' | 'transition'> & { delay?: number }) {
  const reduce = useReducedMotionSafe()
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={
        reduce
          ? { duration: DUR.quick, y: { duration: 0 }, filter: { duration: 0 } }
          : { duration: DUR.reveal, delay, ease: EASE.house }
      }
      {...props}
    >
      {children}
    </motion.div>
  )
}
