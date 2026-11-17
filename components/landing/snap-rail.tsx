'use client'

import { Children, useCallback, useEffect, useId, useRef, useState } from 'react'
import { SlidingTabs } from '@/components/motion'
import { cn } from '@/lib/utils'

export interface SnapRailLabel {
  value: string
  label: React.ReactNode
}

export interface SnapRailProps {
  /** One short label per child, in the same order. */
  labels: SnapRailLabel[]
  /** Names the label row, for example "Show a feature". */
  'aria-label': string
  /** The element that holds the cards. */
  as?: 'div' | 'ol' | 'ul'
  /** Layout of the cards from md up, where they no longer scroll. */
  className?: string
  /** Each direct child is one card. */
  children: React.ReactNode
}

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

/**
 * A row of cards for phones. Below md the cards sit side by side and snap as
 * you swipe, each one a little narrower than the screen so the next peeks in.
 * A row of labels above follows the card in view, and a tap on a label
 * scrolls to its card. From md up the labels go and the cards take the
 * layout in `className`. Cards off screen stay in the tab order, and the
 * browser scrolls a focused one into view.
 */
export function SnapRail({ labels, 'aria-label': ariaLabel, as: Track = 'div', className, children }: SnapRailProps) {
  const prefix = `rail${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const trackRef = useRef<HTMLElement | null>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(labels[0]?.value ?? '')
  // The label a tap is scrolling to. Cards passed on the way do not take the pill.
  const heading = useRef<string | null>(null)
  const values = labels.map((item) => item.value).join('\u0000')
  const count = Children.count(children)

  // The card that fills most of the row is the active one.
  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof IntersectionObserver === 'undefined') return
    const order = values.split('\u0000')
    const cards = Array.from(track.children)
    const ratios = new Map<Element, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio))
        if (heading.current !== null) return
        let best = -1
        let bestRatio = 0.5
        cards.forEach((card, index) => {
          const ratio = ratios.get(card) ?? 0
          if (ratio > bestRatio) {
            best = index
            bestRatio = ratio
          }
        })
        if (best >= 0 && order[best]) setActive(order[best])
      },
      { root: track, threshold: [0.5, 0.75, 1] }
    )
    cards.forEach((card) => observer.observe(card))

    let timer = 0
    const settle = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        heading.current = null
      }, 120)
    }
    track.addEventListener('scroll', settle, { passive: true })
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
      track.removeEventListener('scroll', settle)
    }
  }, [values, count])

  // Keep the active label inside its own row, which scrolls when the labels do not fit.
  useEffect(() => {
    const row = labelsRef.current
    const tab = row?.querySelector<HTMLElement>(`#${prefix}-tab-${CSS.escape(active)}`)
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return
    const rowBox = row.getBoundingClientRect()
    const tabBox = tab.getBoundingClientRect()
    const left = row.scrollLeft + tabBox.left - rowBox.left - (row.clientWidth - tabBox.width) / 2
    row.scrollTo({ left, behavior: scrollBehavior() })
  }, [active, prefix])

  const goTo = useCallback(
    (value: string) => {
      const track = trackRef.current
      const card = track?.children[values.split('\u0000').indexOf(value)]
      setActive(value)
      if (!track || !(card instanceof HTMLElement)) return
      heading.current = value
      const inset = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0
      const left = track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left - inset
      // Scrolls the row only, so the page never jumps under the reader.
      track.scrollTo({ left, behavior: scrollBehavior() })
      // If the row does not move (already there), no scroll event clears this.
      window.setTimeout(() => {
        if (heading.current === value) heading.current = null
      }, 900)
    },
    [values]
  )

  return (
    <>
      <div ref={labelsRef} className="snap-rail-scroll -mx-4 mt-6 overflow-x-auto px-4 md:hidden">
        <div className="mx-auto w-max">
          <SlidingTabs
            variant="segmented"
            size="sm"
            idPrefix={prefix}
            aria-label={ariaLabel}
            items={labels}
            value={active}
            onValueChange={goTo}
            className="max-w-none"
          />
        </div>
      </div>
      <Track
        ref={(node: HTMLElement | null) => {
          trackRef.current = node
        }}
        className={cn(
          'snap-rail-scroll max-md:-mx-4 max-md:mt-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scroll-px-4 max-md:gap-3 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:px-4 max-md:[&>*]:w-[86vw] max-md:[&>*]:shrink-0 max-md:[&>*]:snap-start',
          className
        )}
      >
        {children}
      </Track>
    </>
  )
}
