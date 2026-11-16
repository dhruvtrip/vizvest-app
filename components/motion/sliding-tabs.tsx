'use client'

import { useCallback, useId, useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface SlidingTabsItem<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
}

export interface SlidingTabsProps<T extends string> {
  items: SlidingTabsItem<T>[]
  value: T
  onValueChange: (value: T) => void
  'aria-label': string
  /**
   * `tabs`: role=tablist/tab, each tab has id `${idPrefix}-tab-${value}` and
   * controls `${idPrefix}-panel-${value}`. `segmented`: role=radiogroup/radio.
   */
  variant?: 'tabs' | 'segmented'
  idPrefix?: string
  /** `sm`: 28px items with 12px text (chart headers). `md`: 36px, 14px. */
  size?: 'sm' | 'md'
  /** `panel`: drawn on the dark panel. */
  tone?: 'default' | 'panel'
  /** `tile`: the control sits inside a Tile, so the track takes the page colour. */
  surface?: 'page' | 'tile'
  className?: string
}

/**
 * Segmented control whose active pill slides between options
 * (transitions.dev "Tabs sliding"). The pill snaps into place without a
 * transition on first paint and whenever the control resizes, and slides
 * only when the selection changes.
 */
export function SlidingTabs<T extends string>({
  items,
  value,
  onValueChange,
  'aria-label': ariaLabel,
  variant = 'tabs',
  idPrefix,
  size = 'md',
  tone = 'default',
  surface = 'page',
  className,
}: SlidingTabsProps<T>) {
  const autoId = useId()
  const prefix = idPrefix ?? `tabs${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const barRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef(new Map<T, HTMLButtonElement>())
  const placed = useRef(false)

  const moveTo = useCallback((tab: HTMLElement, animate: boolean) => {
    const pill = pillRef.current
    if (!pill) return
    if (!animate) {
      const prev = pill.style.transition
      pill.style.transition = 'none'
      pill.style.transform = `translateX(${tab.offsetLeft}px)`
      pill.style.width = `${tab.offsetWidth}px`
      void pill.offsetWidth
      pill.style.transition = prev
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`
      pill.style.width = `${tab.offsetWidth}px`
    }
  }, [])

  // Selection changes slide the pill; the very first placement snaps.
  useLayoutEffect(() => {
    const tab = tabRefs.current.get(value)
    if (!tab) return
    moveTo(tab, placed.current)
    placed.current = true
  }, [value, moveTo])

  // Resizes (fonts loading, viewport changes, label changes) snap the pill.
  const valueRef = useRef(value)
  useLayoutEffect(() => {
    valueRef.current = value
  }, [value])
  // Only a real size change snaps, so re-observing after a re-render never
  // cuts a slide short.
  const sizes = useRef(new WeakMap<Element, string>())
  const itemsKey = items.map((item) => item.value).join('\u0000')
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const size = `${entry.contentRect.width}x${entry.contentRect.height}`
        if (sizes.current.get(entry.target) !== size) {
          sizes.current.set(entry.target, size)
          changed = true
        }
      }
      if (!changed) return
      const tab = tabRefs.current.get(valueRef.current)
      if (tab) moveTo(tab, false)
    })
    observer.observe(bar)
    tabRefs.current.forEach((tab) => observer.observe(tab))
    return () => observer.disconnect()
  }, [itemsKey, moveTo])

  const select = (index: number) => {
    const item = items[index]
    if (!item) return
    tabRefs.current.get(item.value)?.focus()
    if (item.value !== value) onValueChange(item.value)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1
    const prevKeys = variant === 'segmented' ? ['ArrowLeft', 'ArrowUp'] : ['ArrowLeft']
    const nextKeys = variant === 'segmented' ? ['ArrowRight', 'ArrowDown'] : ['ArrowRight']
    let next: number | null = null
    if (nextKeys.includes(event.key)) next = index === last ? 0 : index + 1
    else if (prevKeys.includes(event.key)) next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next === null) return
    event.preventDefault()
    select(next)
  }

  const isTabs = variant === 'tabs'

  return (
    <div
      ref={barRef}
      role={isTabs ? 'tablist' : 'radiogroup'}
      aria-label={ariaLabel}
      aria-orientation={isTabs ? 'horizontal' : undefined}
      data-surface={surface}
      data-tone={tone}
      className={cn('t-tabs max-w-full', className)}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className={cn('t-tabs-pill rounded-full', tone === 'panel' ? '' : 'shadow-xs', size === 'sm' ? 'h-7' : 'h-9')}
      />
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            ref={(node) => {
              if (node) tabRefs.current.set(item.value, node)
              else tabRefs.current.delete(item.value)
            }}
            type="button"
            role={isTabs ? 'tab' : 'radio'}
            id={`${prefix}-tab-${item.value}`}
            aria-controls={isTabs ? `${prefix}-panel-${item.value}` : undefined}
            aria-selected={isTabs ? selected : undefined}
            aria-checked={isTabs ? undefined : selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (!selected) onValueChange(item.value)
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              't-tab inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium',
              // sm items are 28px; the pad lifts the hit area to 36px without changing the look.
              size === 'sm' ? "h-7 px-3 text-xs before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']" : 'h-9 px-4 text-sm',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
