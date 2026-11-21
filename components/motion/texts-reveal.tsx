'use client'

import { Children, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface TextsRevealProps {
  /** Each direct child is one line (headline, supporting line, actions). */
  children: React.ReactNode
  className?: string
  /** Seconds to wait before the first line starts, like `Reveal`. */
  delay?: number
}

/**
 * Staggered entrance for stacked lines (transitions.dev "Texts reveal"):
 * each line rises in with a blur, --stagger-stagger after the one before.
 * Plays once on mount. The server and the first client render both output
 * the resting hidden state, and the lines are shown only after hydration,
 * so nothing flashes visible and then hides again. Under reduced motion the
 * lines only fade.
 */
export function TextsReveal({ children, className, delay = 0 }: TextsRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    void ref.current?.offsetHeight // the hidden state is committed before it flips
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe entrance: SSR and first client render stay hidden, then flip after mount
    setShown(true)
  }, [])

  const lines = Children.toArray(children)

  return (
    <div ref={ref} className={cn('t-stagger', shown && 'is-shown', className)}>
      {lines.map((line, index) => (
        <div
          key={index}
          className={`t-stagger-line t-stagger-line--${index + 1}`}
          style={{ transitionDelay: `calc(var(--stagger-stagger) * ${index} + ${delay}s)` }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}
