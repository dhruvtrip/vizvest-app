'use client'

import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { readCssMs } from './css-time'

export interface AutoHeightProps {
  children: React.ReactNode
  className?: string
}

/**
 * Tweens its height when the height of its content changes
 * (transitions.dev "Card resize"). A ResizeObserver watches the content; the
 * wrapper is given its old height, reflowed, then its new one, and goes back
 * to `auto` when the tween ends. Nothing animates on the first render or when
 * the width changes too (a viewport resize just follows the content).
 */
export function AutoHeight({ children, className }: AutoHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner || typeof ResizeObserver === 'undefined') return

    let last: { width: number; height: number } | null = null
    let timer: number | undefined

    const settle = () => {
      outer.style.height = ''
      outer.style.overflow = ''
    }

    const observer = new ResizeObserver(() => {
      const width = inner.offsetWidth
      const height = inner.offsetHeight
      const prev = last
      last = { width, height }
      if (!prev || prev.height === height) return

      window.clearTimeout(timer)
      if (prev.width !== width) {
        settle()
        return
      }

      const style = getComputedStyle(outer)
      const chrome =
        parseFloat(style.paddingTop) +
        parseFloat(style.paddingBottom) +
        parseFloat(style.borderTopWidth) +
        parseFloat(style.borderBottomWidth)

      // Mid-tween the wrapper already has an explicit height and setting the
      // new one retargets from where it is. At rest, start from the old height.
      if (!outer.style.height) {
        outer.style.height = `${prev.height + chrome}px`
        outer.style.overflow = 'hidden'
        void outer.offsetHeight // force reflow so the change transitions
      }
      outer.style.height = `${height + chrome}px`
      timer = window.setTimeout(settle, readCssMs(outer, '--resize-dur', 300) + 40)
    })

    observer.observe(inner)
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
      settle()
    }
  }, [])

  return (
    <div ref={outerRef} className={cn('t-resize', className)}>
      <div ref={innerRef} className="flow-root">
        {children}
      </div>
    </div>
  )
}
