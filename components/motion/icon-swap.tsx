'use client'

import { cn } from '@/lib/utils'

export interface IconSwapProps {
  /** false shows `from`, true shows `to`. */
  swapped: boolean
  from: React.ReactNode
  to: React.ReactNode
  className?: string
}

/**
 * Two icons in one slot (transitions.dev "Icon swap"). Both stay in the DOM
 * and cross-fade with blur and scale; under reduced motion only the fade
 * runs. Give the surrounding control its own label.
 */
export function IconSwap({ swapped, from, to, className }: IconSwapProps) {
  return (
    <span className={cn('t-icon-swap shrink-0 place-items-center', className)} data-state={swapped ? 'b' : 'a'}>
      <span className="t-icon inline-flex items-center justify-center" data-icon="a" aria-hidden={swapped || undefined}>
        {from}
      </span>
      <span className="t-icon inline-flex items-center justify-center" data-icon="b" aria-hidden={!swapped || undefined}>
        {to}
      </span>
    </span>
  )
}
