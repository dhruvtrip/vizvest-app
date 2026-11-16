'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { readCssMs } from './css-time'

export type DotLoaderPattern = 'scan' | 'twinkle' | 'orbit' | 'pulse'

export interface DotLoaderProps {
  pattern?: DotLoaderPattern
  /** Read by screen readers. */
  label?: string
  className?: string
}

// Per-dot delay tables from the snippet: the pattern is just a delay table.
const RING = [1, 2, 7, 11, 14, 13, 8, 4]
const INNER = [5, 6, 9, 10]
const TWINKLE = [7, 2, 11, 5, 14, 9, 0, 12, 3, 15, 6, 10, 13, 1, 8, 4]
const DEFAULT_CYCLE = 1200

/** Delay in ms for each dot, or null when the dot holds steady. */
function delayFor(pattern: DotLoaderPattern, idx: number, cycle: number): number | null {
  const col = idx % 4
  if (pattern === 'scan') return Math.round(col * (cycle / 10))
  if (pattern === 'twinkle') return Math.round(TWINKLE[idx] * (cycle / 16))
  if (pattern === 'orbit') {
    const k = RING.indexOf(idx)
    return k === -1 ? null : Math.round(k * (cycle / 8))
  }
  const ring = INNER.includes(idx) ? 0 : 1
  return Math.round(ring * (cycle * 0.16))
}

/**
 * Tiny 4x4 dot-matrix loader (transitions.dev "Matrix dot loader"). Dots use
 * `currentColor`. It is a status region: `label` is announced, the dots are
 * hidden from assistive tech.
 */
export function DotLoader({ pattern = 'scan', label = 'Loading', className }: DotLoaderProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [cycle, setCycle] = useState(DEFAULT_CYCLE)

  // Keep the delays in step with --matrix-cycle (the server uses the default).
  useEffect(() => {
    if (ref.current) setCycle(readCssMs(ref.current, '--matrix-cycle', DEFAULT_CYCLE))
  }, [])

  return (
    <span role="status" className={cn('inline-flex items-center', className)}>
      <span ref={ref} className="t-matrix" data-variant={pattern} aria-hidden="true">
        {Array.from({ length: 16 }, (_, idx) => {
          const delay = delayFor(pattern, idx, cycle)
          return (
            <i
              key={idx}
              style={
                delay === null
                  ? { animation: 'none' }
                  : ({ '--d': String(delay) } as React.CSSProperties)
              }
            />
          )
        })}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
