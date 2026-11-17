'use client'

import { useLayoutEffect, useRef } from 'react'
import { Check } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface SuccessCheckProps {
  /** Icon size in px. */
  size?: number
  className?: string
  /** Accessible name, e.g. "File uploaded". Without it the mark is decorative. */
  label?: string
}

/**
 * Success mark that plays once on mount (transitions.dev "Success check"):
 * fade, rotate upright, settle with a small bob and draw the tick.
 * Colour comes from `currentColor`.
 */
export function SuccessCheck({ size = 24, className, label }: SuccessCheckProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const path = el?.querySelector('svg path')
    if (!el || !(path instanceof SVGPathElement)) return
    // Dash length from the path's real length. Icon strokes do not scale
    // (vector-effect: non-scaling-stroke), so dashes are measured on screen:
    // convert the length from icon units to rendered px.
    let length = path.getTotalLength()
    if (getComputedStyle(path).vectorEffect === 'non-scaling-stroke') {
      const matrix = path.getCTM()
      if (matrix) length *= Math.hypot(matrix.a, matrix.b)
    }
    const dash = String(Math.ceil(length) + 1)
    path.style.strokeDasharray = dash
    path.style.strokeDashoffset = dash
    // Replay from a clean state: out, reflow, in.
    el.setAttribute('data-state', 'out')
    void el.offsetWidth // force reflow so keyframes restart
    el.setAttribute('data-state', 'in')
  }, [])

  return (
    <span
      ref={ref}
      className={cn('t-success-check', className)}
      data-state="out"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Check size={size} strokeWidth={size >= 32 ? 2.5 : 2} />
    </span>
  )
}
