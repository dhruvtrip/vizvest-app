'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface WordRotatorProps {
  words: readonly string[]
  /** Milliseconds each word stays. Default 3000. */
  interval?: number
  className?: string
}

/**
 * Words stacked in place, cross-fading through a 20px blur every 3s.
 * Pauses when the tab is hidden. Screen readers get the full list once.
 */
export function WordRotator({ words, interval = 3000, className }: WordRotatorProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length < 2) return
    const id = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % words.length)
    }, interval)
    return () => window.clearInterval(id)
  }, [words.length, interval])

  return (
    <span className={cn('relative grid', className)}>
      <span className="sr-only">{words.join(', ')}</span>
      {words.map((word, i) => (
        <span
          key={word}
          aria-hidden="true"
          className={cn(
            // Words stay on one line wherever they fit; on the narrowest phones a long word wraps
            // instead of overflowing, and every word is centred in the (stable) tallest row.
            'col-start-1 row-start-1 self-center text-balance text-center min-[360px]:whitespace-nowrap',
            'transition-[opacity,filter] [transition-duration:600ms] ease-in-out',
            i === index ? 'opacity-100 blur-0' : 'opacity-0 blur-[20px]'
          )}
        >
          {word}
        </span>
      ))}
    </span>
  )
}
