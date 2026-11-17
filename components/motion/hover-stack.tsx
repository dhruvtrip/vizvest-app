'use client'

import { Children, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { readCssNumber, readCssValue } from './css-time'

export interface HoverStackProps {
  /** Each child is one circle (avatar, logo, initials). */
  children: React.ReactNode
  className?: string
  /** How far each circle tucks under the one before it, in px. */
  overlap?: number
}

/**
 * Row of overlapping circles (transitions.dev "Avatar group hover"). The
 * hovered circle lifts, its neighbours follow with a falloff, and the row
 * springs back when the pointer leaves. Mouse pointers that can hover only.
 * Each circle gets a 2px ring in `--hover-stack-ring` (the page colour by
 * default; set it to the tile colour inside a Tile).
 */
export function HoverStack({ children, className, overlap = 8 }: HoverStackProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  // Set transition-timing-function inline BEFORE the variable writes, so the
  // lift eases in and the return gets the bouncy curve.
  const setShifts = useCallback((activeIdx: number | null, phase: 'in' | 'out') => {
    const root = rootRef.current
    if (!root) return
    const lift = readCssNumber(root, '--avatar-lift', -4)
    const falloff = readCssNumber(root, '--avatar-falloff', 0.45)
    const scale = readCssNumber(root, '--avatar-scale', 1.05)
    const tf =
      phase === 'out'
        ? readCssValue(root, '--avatar-ease-out', 'cubic-bezier(0.34, 3.85, 0.64, 1)')
        : readCssValue(root, '--avatar-ease-in', 'cubic-bezier(0.22, 1, 0.36, 1)')

    root.querySelectorAll<HTMLElement>(':scope > .t-avatar').forEach((el, i) => {
      el.style.transitionTimingFunction = tf
      if (activeIdx === null) {
        el.style.setProperty('--shift', '0px')
        el.style.setProperty('--scale-active', '1')
        return
      }
      const d = Math.abs(i - activeIdx)
      el.style.setProperty('--shift', `${(lift * Math.pow(falloff, d)).toFixed(3)}px`)
      el.style.setProperty('--scale-active', i === activeIdx ? String(scale) : '1')
    })
  }, [])

  const canHover = (event: React.PointerEvent) =>
    event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches

  const items = Children.toArray(children)

  return (
    <div
      ref={rootRef}
      className={cn('t-avatar-group flex items-center', className)}
      onPointerLeave={(event) => {
        if (canHover(event)) setShifts(null, 'out')
      }}
    >
      {items.map((child, i) => (
        <div
          key={i}
          className="t-avatar relative shrink-0 rounded-full shadow-[0_0_0_2px_var(--hover-stack-ring,hsl(var(--background)))]"
          style={i === 0 ? undefined : { marginInlineStart: -overlap }}
          onPointerEnter={(event) => {
            if (canHover(event)) setShifts(i, 'in')
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
