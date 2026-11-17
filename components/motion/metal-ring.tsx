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
    // In dev the ring renders but stays still. Strict Mode remounts it, and
    // metal-fx 2.0.11's late `webglcontextlost` event from the torn-down
    // context marks the new shared context as lost. Production animates.
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

  // metal-fx strips the child's background and border (`!important`) and
  // paints its own grey or white fill on the wrapper, so our pill fill, hover
  // and press move onto the wrapper, marked important to win. The button's
  // own press scale is switched off so it doesn't scale twice. `px-px`
  // stands in for the removed 1px border so the button keeps its width.
  return (
    <MetalFx
      className="!bg-primary px-px transition-[background-color,transform] duration-150 ease-ui has-[:hover]:!bg-brand/90 motion-safe:has-[:active]:scale-[0.96] [&_.metal-fx-content>*]:!transform-none"
      variant="button"
      preset={tone}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      paused={reduced}
    >
      {children}
    </MetalFx>
  )
}
