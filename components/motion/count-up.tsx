'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { useReducedMotionSafe } from './use-reduced-motion-safe'

interface CountUpProps {
  value: number
  prefix?: string
  suffix?: string
  /** Seconds. */
  duration?: number
  className?: string
}

/**
 * Counts from 0 to `value` once, the first time it scrolls into view.
 * The final text is rendered on the server and announced as a whole, so
 * screen readers and no-JS visitors never see a partial number.
 */
export function CountUp({ value, prefix = '', suffix = '', duration = 2.5, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const reduced = useReducedMotionSafe()
  const [shown, setShown] = useState(value)
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    if (reduced || value === 0) return
    const controls = animate(0, value, {
      duration,
      ease: [0, 0, 0.58, 1],
      onUpdate: (latest) => setShown(Math.floor(latest)),
      onComplete: () => setShown(value),
    })
    return () => controls.stop()
  }, [inView, reduced, value, duration])

  const final = `${prefix}${value}${suffix}`

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="figure">
        {prefix}
        {shown}
        {suffix}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  )
}
