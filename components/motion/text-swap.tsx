'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { readCssMs } from './css-time'

export interface TextSwapProps {
  text: string
  className?: string
  /** Announce the new text politely to screen readers. */
  live?: boolean
}

/**
 * Swaps text in place (transitions.dev "Text states swap"): the old text
 * leaves upward with a blur, the new text rises in from below. The first
 * render shows the text as is.
 */
export function TextSwap({ text, className, live = false }: TextSwapProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(text)
  const entering = useRef(false)

  // Phase 1: the old text exits; after --text-swap-dur the new one is set.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (text === shown) {
      // Switched back before the exit finished: let it return in place.
      el.classList.remove('is-exit')
      return
    }
    el.classList.add('is-exit')
    const timer = window.setTimeout(() => {
      entering.current = true
      setShown(text)
    }, readCssMs(el, '--text-swap-dur', 150))
    return () => window.clearTimeout(timer)
  }, [text, shown])

  // Phases 2 and 3: jump below without a transition, reflow, then rise in.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !entering.current) return
    entering.current = false
    el.classList.remove('is-exit')
    el.classList.add('is-enter-start')
    void el.offsetHeight // force reflow so the next change transitions
    el.classList.remove('is-enter-start')
  }, [shown])

  return (
    <span
      ref={ref}
      className={cn('t-text-swap', className)}
      aria-live={live ? 'polite' : undefined}
      aria-atomic={live ? true : undefined}
    >
      {shown}
    </span>
  )
}
