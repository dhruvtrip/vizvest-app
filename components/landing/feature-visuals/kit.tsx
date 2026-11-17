'use client'

import { useEffect, useRef, useState } from 'react'
import { useOnScreen } from '@/components/motion'
import { cn } from '@/lib/utils'

/* Shared by the feature sketches: sample-data helpers, the scroll-in reveal
   and the small text styles every sketch uses. */

export const euro = (value: number, digits = 2) =>
  `€${Math.abs(value).toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`

export const signedEuro = (value: number) => `${value >= 0 ? '+' : '-'}${euro(value)}`

/** Deterministic random numbers, so the server and the browser draw the same sample data. */
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

/** Ref for a sketch's root, and whether it has scrolled into view yet. */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const shown = useOnScreen(ref, { once: true })
  return { ref, shown }
}

/**
 * Root of a sketch. Its `Line`s rise in one after another the first time it
 * is on screen (transitions.dev "Texts reveal"). Chart tooltips stay inside it.
 */
export function VisualRoot({
  rootRef,
  shown,
  className,
  children,
}: {
  rootRef: React.Ref<HTMLDivElement>
  shown: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      ref={rootRef}
      data-vz-bounds=""
      className={cn('t-stagger relative flex min-h-[19.5rem] flex-col sm:min-h-[21rem]', shown && 'is-shown', className)}
    >
      {children}
    </div>
  )
}

/** One block of a sketch. `raised` keeps a chart tooltip above the lines after it. */
export function Line({
  index = 0,
  raised = false,
  className,
  children,
}: {
  index?: number
  raised?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn('t-stagger-line', raised && 'relative z-10', className)}
      style={{ transitionDelay: `calc(var(--stagger-stagger) * ${index * 2})` }}
    >
      {children}
    </div>
  )
}

export function VisualLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('text-sm font-medium leading-5', className)}>{children}</p>
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/**
 * Counts from zero to `target` once `start` turns true. The server renders
 * the final figure, and under reduced motion it never moves.
 */
export function useCountUp(target: number, start: boolean, duration = 1200): number {
  const [value, setValue] = useState(target)

  useEffect(() => {
    if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      setValue(target * easeOutQuart(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, start, duration])

  return value
}
