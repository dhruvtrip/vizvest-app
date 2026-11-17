'use client'

import { Children, useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { animate, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { readCssMs, readCssNumber } from './css-time'
import { useReducedMotionSafe } from './use-reduced-motion-safe'

const EASE_RATE = [0.22, 1, 0.36, 1] as const

export interface OrbitProps {
  /** Each child is one item on the ring. Put your own look on it (see `.coin`). */
  children: ReactNode
  className?: string
}

/**
 * Items travelling a tilted circle, always facing the viewer, brighter at the
 * front and dimmer at the back. The motion is CSS (app/styles/orbit.css). This
 * component only changes how fast it runs: hovering with a mouse eases it down
 * to `--orbit-slow-rate`, and it stops while off screen.
 *
 * Decorative: the stage is aria-hidden, so give the content an accessible
 * text alternative elsewhere.
 */
export function Orbit({ children, className }: OrbitProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const rate = useRef(0)
  const hovering = useRef(false)
  const visible = useRef(false)
  const tween = useRef<{ stop: () => void } | null>(null)
  const reduced = useReducedMotionSafe()
  const inView = useInView(rootRef, { margin: '120px' })

  // Every animation under the stage shares one rate, so ring, faces and
  // depth fades stay in step while they speed up or slow down.
  const applyRate = useCallback((value: number) => {
    rate.current = value
    rootRef.current?.getAnimations({ subtree: true }).forEach((a) => {
      a.playbackRate = value
    })
  }, [])

  const retarget = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const slow = readCssNumber(root, '--orbit-slow-rate', 0.25)
    const ms = readCssMs(root, '--orbit-rate-dur', 600)
    const target = !visible.current ? 0 : hovering.current ? slow : 1
    tween.current?.stop()
    tween.current = animate(rate.current, target, {
      duration: ms / 1000,
      ease: EASE_RATE,
      onUpdate: applyRate,
    })
  }, [applyRate])

  useEffect(() => {
    if (reduced) return
    visible.current = inView
    applyRate(rate.current)
    retarget()
  }, [inView, reduced, applyRate, retarget])

  useEffect(() => () => tween.current?.stop(), [])

  const canHover = (e: React.PointerEvent) =>
    !reduced && e.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches

  const items = Children.toArray(children)

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn('t-orbit', className)}
      style={{ '--n': items.length } as CSSProperties}
      onPointerEnter={(e) => {
        if (!canHover(e)) return
        hovering.current = true
        retarget()
      }}
      onPointerLeave={() => {
        if (!hovering.current) return
        hovering.current = false
        retarget()
      }}
    >
      <div className="t-orbit-glow" />
      <div className="t-orbit-floor" />
      <div className="t-orbit-tilt">
        <div className="t-orbit-ring">
          {items.map((child, i) => (
            <div key={i} className="t-orbit-slot" style={{ '--i': i } as CSSProperties}>
              <div className="t-orbit-face">{child}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
