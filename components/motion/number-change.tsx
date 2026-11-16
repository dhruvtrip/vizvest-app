'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface NumberChangeProps {
  /** The formatted figure, e.g. "£12,480.20" or "+4.2%". */
  value: string
  className?: string
}

interface ChangeState {
  value: string
  prev: string | null
  /** Bumped on every change so changed digits mount fresh. */
  generation: number
  /** 1 when the figure went up, -1 when it went down. */
  direction: 1 | -1
}

/** Best-effort numeric reading of a formatted figure, for the direction only. */
function numericValue(text: string): number {
  const negative = /[-−–(]/.test(text)
  const digits = parseFloat(text.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(digits)) return NaN
  return negative ? -digits : digits
}

function directionOf(prev: string, next: string): 1 | -1 {
  const a = numericValue(prev)
  const b = numericValue(next)
  return Number.isFinite(a) && Number.isFinite(b) && b < a ? -1 : 1
}

/**
 * Quiet per-digit cross-fade when a formatted figure changes
 * (transitions.dev "Number subtle change"). Only the characters that changed
 * move, rising when the figure goes up and falling when it goes down.
 * Screen readers get the plain value.
 */
export function NumberChange({ value, className }: NumberChangeProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [state, setState] = useState<ChangeState>({ value, prev: null, generation: 0, direction: 1 })

  if (state.value !== value) {
    setState({
      value,
      prev: state.value,
      generation: state.generation + 1,
      direction: directionOf(state.value, value),
    })
  }

  // Replay: remove .is-animating, reflow, re-add it.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || state.generation === 0) return
    el.classList.remove('is-animating')
    void el.offsetHeight // force reflow
    el.classList.add('is-animating')
  }, [state.generation])

  const { prev, generation } = state
  const next = state.value
  let digits: React.ReactNode = next

  if (prev !== null) {
    const sameLength = prev.length === next.length
    digits = [...next].map((ch, i) => {
      if (sameLength && prev[i] === ch) return ch
      return (
        <span key={`${generation}-${i}`} className="t-subtle-slot">
          {sameLength ? (
            <span className="t-subtle-old" aria-hidden="true">
              {prev[i]}
            </span>
          ) : null}
          <span className="t-subtle-new">{ch}</span>
        </span>
      )
    })
  }

  return (
    <span className={cn('figure whitespace-nowrap', className)}>
      <span className="sr-only">{next}</span>
      <span
        ref={ref}
        aria-hidden="true"
        className="t-subtle-number"
        style={{ '--subtle-dir': String(state.direction) } as React.CSSProperties}
      >
        {digits}
      </span>
    </span>
  )
}
