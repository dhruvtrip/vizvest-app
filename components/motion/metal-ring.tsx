'use client'

import { useEffect, useState, type ComponentType, type ReactElement } from 'react'
import { useTheme } from 'next-themes'
import type { MetalFxProps } from 'metal-fx'

import { useReducedMotionSafe } from './use-reduced-motion-safe'

export type MetalTone = 'gold' | 'silver' | 'chromatic'

const TONES: readonly MetalTone[] = ['gold', 'silver', 'chromatic']

/** Reads `?cta=<tone>` from a query string. Anything else is gold. */
export function parseMetalTone(search: string): MetalTone {
  const value = new URLSearchParams(search).get('cta')
  return TONES.find((tone) => tone === value) ?? 'gold'
}

export interface MetalRingProps {
  tone: MetalTone
  /** One host element, usually a pill Button. */
  children: ReactElement
}

/**
 * Liquid metal ring around a single button. metal-fx is loaded after the
 * page has drawn, so the hero paints as before and the button never moves.
 * Without WebGL2 the child renders on its own. Reduced motion freezes the
 * ring on one frame. The ring follows the site theme, not the OS theme.
 */
export function MetalRing({ tone, children }: MetalRingProps) {
  const [MetalFx, setMetalFx] = useState<ComponentType<MetalFxProps> | null>(null)
  const { resolvedTheme } = useTheme()
  const reduced = useReducedMotionSafe()

  useEffect(() => {
    let cancelled = false
    import('metal-fx')
      .then((mod) => {
        if (!cancelled && mod.isMetalFxSupported()) setMetalFx(() => mod.MetalFx)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!MetalFx) return children

  return (
    <MetalFx
      variant="button"
      preset={tone}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      paused={reduced}
    >
      {children}
    </MetalFx>
  )
}
