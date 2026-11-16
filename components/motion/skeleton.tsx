'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { readCssMs } from './css-time'

/**
 * Pulsing placeholder block. Size and shape come from `className`
 * (e.g. `h-4 w-32`, `size-10 rounded-full`). Works on the page and on a Tile.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('t-skel-bone rounded-md bg-foreground/[0.07]', className)} />
}

export interface SkeletonRevealProps {
  loading: boolean
  /** Placeholder shown while loading, usually built from `Skeleton` blocks. */
  skeleton: React.ReactNode
  children: React.ReactNode
  className?: string
}

type Phase = 'loading' | 'revealing' | 'done'

/**
 * Shows `skeleton` while `loading`, then cross-fades and cross-blurs to the
 * content (transitions.dev "Skeleton loader and reveal"). Both layers share
 * one grid cell, so the swap does not move the layout. Content that is ready
 * on the first render shows at once; going back to loading snaps without
 * animating the reverse.
 */
export function SkeletonReveal({ loading, skeleton, children, className }: SkeletonRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>(loading ? 'loading' : 'done')
  const [revealed, setRevealed] = useState(!loading)
  const [prevLoading, setPrevLoading] = useState(loading)

  if (prevLoading !== loading) {
    setPrevLoading(loading)
    if (loading) {
      setPhase('loading')
      setRevealed(false)
    } else {
      setPhase('revealing')
    }
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || phase !== 'revealing') return
    if (!revealed) {
      // Both layers are painted in their start state: reflow, then reveal.
      void el.offsetWidth
      setRevealed(true)
      return
    }
    const timer = window.setTimeout(() => setPhase('done'), readCssMs(el, '--reveal-dur', 400))
    return () => window.clearTimeout(timer)
  }, [phase, revealed])

  return (
    <div
      ref={ref}
      aria-busy={loading || undefined}
      data-phase={phase}
      className={cn('t-skel t-skel-stack', revealed && 'is-revealed', className)}
    >
      {phase !== 'done' ? (
        <div className="t-skel-skeleton" aria-hidden="true">
          {skeleton}
        </div>
      ) : null}
      {phase !== 'loading' ? <div className="t-skel-content">{children}</div> : null}
    </div>
  )
}
