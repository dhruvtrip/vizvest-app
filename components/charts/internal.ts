'use client'

import * as React from 'react'

/* --------------------------------------------------------------------------
   Shared plumbing for the chart kit. Not exported from the barrel.
   -------------------------------------------------------------------------- */

export const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/** An id that is safe inside `url(#...)` and CSS selectors. */
export function useSafeId(prefix: string): string {
  const raw = React.useId()
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/** True once the element has scrolled into view; stays true afterwards. */
export function useInViewOnce<T extends Element>(ref: React.RefObject<T | null>, mounted = true): boolean {
  const [seen, setSeen] = React.useState(false)
  React.useEffect(() => {
    if (seen || !mounted) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, seen, mounted])
  return seen
}

export type Phase = 'pre' | 'enter' | 'live'

export const GROW_MS = 500
const STAGGER_MAX_STEP = 30
const STAGGER_MAX_TOTAL = 400

/** Per-mark stagger for the first growth: at most 30ms a mark and 400ms in all. */
export function staggerStep(count: number): number {
  if (count <= 1) return 0
  return Math.min(STAGGER_MAX_STEP, STAGGER_MAX_TOTAL / (count - 1))
}

/**
 * Drives the first growth of a chart's marks.
 * `pre`: marks sit at the baseline (or are transparent under reduced motion).
 * `enter`: marks grow over 500ms with a stagger.
 * `live`: later data changes tween over 300ms.
 * The CSS in app/styles/charts.css reads `data-phase` on the chart root.
 */
export function useGrowPhase<T extends Element>(ref: React.RefObject<T | null>, count: number): { phase: Phase; step: number } {
  const seen = useInViewOnce(ref, count > 0)
  const [phase, setPhase] = React.useState<Phase>('pre')
  const step = staggerStep(count)

  React.useEffect(() => {
    if (!seen || phase !== 'pre') return
    // One frame at the baseline first, so the browser has a start value to grow from.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase('enter'))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [seen, phase])

  React.useEffect(() => {
    if (phase !== 'enter') return
    const total = GROW_MS + Math.min(STAGGER_MAX_TOTAL, staggerStep(count) * Math.max(0, count - 1)) + 50
    const t = window.setTimeout(() => setPhase('live'), total)
    return () => window.clearTimeout(t)
  }, [phase, count])

  return { phase, step }
}

/** Width of an element, kept current with a ResizeObserver. Null until measured. */
export function useWidth<T extends Element>(ref: React.RefObject<T | null>, mounted = true): number | null {
  const [width, setWidth] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (!mounted) return
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (typeof w === 'number') setWidth(Math.round(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, mounted])
  return width
}

/** Approximate rendered width of an 11px x label, in px. */
const labelPx = (text: string) => text.length * 6.2 + 10

export type XLabelMode = 'ends' | 'auto' | 'all' | 'none'

/**
 * Which x labels to print. `auto` thins them so they never collide, from the
 * measured plot width; before the first measurement it falls back to the ends.
 * Indices are along evenly spaced slots (columns) or points (`points: true`).
 */
export function pickXLabels(labels: string[], mode: XLabelMode, width: number | null, points = false): Set<number> {
  const n = labels.length
  const out = new Set<number>()
  if (n === 0 || mode === 'none') return out
  if (mode === 'all') {
    labels.forEach((_, i) => out.add(i))
    return out
  }
  out.add(0)
  if (n > 1) out.add(n - 1)
  if (mode === 'ends' || width === null || n <= 2) {
    // Two end labels that would touch keep only the first.
    if (n > 1 && width !== null && labelPx(labels[0]) + labelPx(labels[n - 1]) + 8 > width) out.delete(n - 1)
    return out
  }
  // Edges of each label as drawn: the first hugs the left, the last the right, the rest centre on their slot.
  const slot = points ? width / Math.max(1, n - 1) : Math.min(width / n, 124)
  const offset = points ? 0 : (width - slot * n) / 2
  const centre = (i: number) => (points ? i * slot : offset + (i + 0.5) * slot)
  const edges = (i: number): [number, number] => {
    const w = labelPx(labels[i])
    if (i === 0) return points ? [0, w] : [offset, offset + w]
    if (i === n - 1) return points ? [width - w, width] : [width - offset - w, width - offset]
    return [centre(i) - w / 2, centre(i) + w / 2]
  }
  const widest = Math.max(...labels.map(labelPx))
  const every = Math.max(1, Math.ceil((widest + 8) / Math.max(1, slot)))
  const kept: number[] = [0]
  for (let i = every; i < n - 1; i += every) {
    if (edges(i)[0] >= edges(kept[kept.length - 1])[1] + 8) kept.push(i)
  }
  // The last label wins over its neighbour; it only gives way to the first.
  while (kept.length > 1 && edges(n - 1)[0] < edges(kept[kept.length - 1])[1] + 8) kept.pop()
  if (edges(n - 1)[0] >= edges(kept[kept.length - 1])[1] + 8) kept.push(n - 1)
  out.clear()
  kept.forEach((i) => out.add(i))
  return out
}

/** The CSS cubic-bezier as a JS function, for tweens drawn in script. */
export function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  return (t: number) => {
    let lo = 0
    let hi = 1
    let u = t
    for (let i = 0; i < 24; i++) {
      u = (lo + hi) / 2
      const x = 3 * u * (1 - u) * (1 - u) * x1 + 3 * u * u * (1 - u) * x2 + u * u * u
      if (x < t) lo = u
      else hi = u
    }
    return 3 * u * (1 - u) * (1 - u) * y1 + 3 * u * u * (1 - u) * y2 + u * u * u
  }
}

export const easeSmoothOut = bezier(0.22, 1, 0.36, 1)

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Tweens an array of numbers to a new target over `duration` ms. Arrays of a
 * different length swap at once. Under reduced motion the target is returned
 * immediately.
 */
export function useTweenedArray(target: number[], duration = 300): number[] {
  const [shown, setShown] = React.useState(target)
  const shownRef = React.useRef(target)
  const key = target.join(',')

  React.useEffect(() => {
    const from = shownRef.current
    const to = key === '' ? [] : key.split(',').map(Number)
    if (from.length !== to.length || prefersReducedMotion() || from.every((v, i) => v === to[i])) {
      shownRef.current = to
      setShown(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const e = easeSmoothOut(t)
      const next = from.map((f, i) => f + (to[i] - f) * e)
      shownRef.current = next
      setShown(next)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [key, duration])

  return shown
}

/** Calls `onOutside` for a pointer press outside `ref` (tap elsewhere hides a tooltip). */
export function usePointerDownOutside(ref: React.RefObject<Element | null>, active: boolean, onOutside: () => void) {
  // Always calls the latest `onOutside` without re-subscribing when it changes.
  const handleOutside = React.useEffectEvent(onOutside)
  React.useEffect(() => {
    if (!active) return
    const handler = (e: PointerEvent) => {
      const el = ref.current
      if (el && e.target instanceof Node && !el.contains(e.target)) handleOutside()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [ref, active])
}

/** Arrow-key movement for roving focus along a row of marks. Returns the next index or null. */
export function rovingIndex(key: string, index: number, count: number): number | null {
  if (count === 0) return null
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return Math.min(count - 1, index + 1)
    case 'ArrowLeft':
    case 'ArrowUp':
      return Math.max(0, index - 1)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/** Clean numbers for gridlines: `count` evenly spaced ticks covering [min, max]. */
export function niceTicks(min: number, max: number, count = 3): number[] {
  const segments = Math.max(1, count - 1)
  if (!Number.isFinite(min) || !Number.isFinite(max)) return Array.from({ length: count }, (_, i) => i / segments)
  if (min === max) {
    if (min === 0) return Array.from({ length: count }, (_, i) => i / segments)
    if (min > 0) min = 0
    else max = 0
  }
  const raw = (max - min) / segments
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const mults = [1, 2, 2.5, 5]
  let step = mag
  let lo = Math.floor(min / step) * step
  for (let k = 0; k < 16; k++) {
    step = mults[k % 4] * mag * Math.pow(10, Math.floor(k / 4))
    lo = Math.floor(min / step) * step
    if (lo + step * segments >= max - step * 1e-9) break
  }
  return Array.from({ length: count }, (_, i) => lo + step * i)
}

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 })
export const formatCompact = (v: number) => compact.format(v)

const full = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })
export const formatFull = (v: number) => full.format(v)

/** Finite number or 0, so NaN in data never breaks a scale. */
export const finite = (v: number) => (Number.isFinite(v) ? v : 0)

/**
 * Hover, touch and keyboard plumbing for a row of marks (columns, stacked
 * columns). One mark is in the tab order at a time; arrow keys, Home and End
 * move along the row; hover, focus or a tap opens the tooltip at the mark,
 * and a tap elsewhere closes it.
 */
export function useMarkHover(count: number) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const markRefs = React.useRef<Array<HTMLElement | null>>([])
  const [active, setActive] = React.useState<number | null>(null)
  const [focusIndex, setFocusIndex] = React.useState(0)
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 })

  usePointerDownOutside(boxRef, active !== null, () => setActive(null))

  const anchorTo = (i: number, topFrac: number) => {
    const el = markRefs.current[i]
    const box = boxRef.current
    if (!el || !box) return
    const r = el.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    setAnchor({ x: r.left + r.width / 2 - b.left, y: r.top + r.height * Math.min(1, Math.max(0, topFrac)) - b.top })
    setActive(i)
  }

  const current = Math.min(focusIndex, Math.max(0, count - 1))
  const shownActive = active !== null && active < count ? active : null

  const markProps = (i: number, topFrac: number) => ({
    ref: (el: HTMLElement | null) => {
      markRefs.current[i] = el
    },
    tabIndex: i === current ? 0 : -1,
    'data-active': shownActive === i ? 'true' : undefined,
    onPointerEnter: () => anchorTo(i, topFrac),
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setActive((a) => (a === i ? null : a))
    },
    onFocus: () => {
      setFocusIndex(i)
      anchorTo(i, topFrac)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActive(null)
        return
      }
      const next = rovingIndex(e.key, i, count)
      if (next !== null && next !== i) {
        e.preventDefault()
        markRefs.current[next]?.focus()
      }
    },
  })

  const groupProps = {
    onBlur: (e: React.FocusEvent) => {
      if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) setActive(null)
    },
  }

  return { boxRef, active: shownActive, anchor, markProps, groupProps }
}
