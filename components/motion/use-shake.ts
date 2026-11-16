'use client'

import { useCallback, useEffect, useRef } from 'react'
import { readCssMs } from './css-time'

/**
 * Replays the transitions.dev "Error state shake" on an element. Attach `ref`
 * to whatever owns the visible border and call `shake()` on a failed submit.
 * The error look (border colour, message) stays with the caller. Under
 * reduced motion the shake does not run, so pair it with a visible message.
 */
export function useShake<T extends HTMLElement>(): { ref: React.RefObject<T | null>; shake: () => void } {
  const ref = useRef<T | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const shake = useCallback(() => {
    const el = ref.current
    if (!el) return
    window.clearTimeout(timer.current)
    el.classList.add('t-input')
    // Replay the shake from a clean baseline.
    el.classList.remove('is-shaking')
    void el.offsetWidth // force reflow
    el.classList.add('is-shaking')
    const shakeMs = readCssMs(el, '--shake-dur-a', 80) * 2 + readCssMs(el, '--shake-dur-b', 60) * 2
    timer.current = window.setTimeout(() => {
      el.classList.remove('is-shaking', 't-input')
    }, shakeMs + 20)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { ref, shake }
}
