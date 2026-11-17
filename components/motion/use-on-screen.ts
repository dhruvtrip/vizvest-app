'use client'

import { useEffect, useState, type RefObject } from 'react'

interface OnScreenOptions {
  /** Turn true the first time the element is seen and stay true. */
  once?: boolean
  /** Share of the element that has to be visible, 0 to 1. */
  amount?: number
}

/**
 * Whether an element is on screen. It reports `false` on the server and on
 * the first client render, so it is safe to branch on during hydration.
 */
export function useOnScreen<T extends Element>(
  ref: RefObject<T | null>,
  { once = false, amount = 0.15 }: OnScreenOptions = {}
): boolean {
  const [onScreen, setOnScreen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setOnScreen(true))
      return () => cancelAnimationFrame(frame)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting)
        if (visible) {
          setOnScreen(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setOnScreen(false)
        }
      },
      { threshold: amount }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, once, amount])

  return onScreen
}
