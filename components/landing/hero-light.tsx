'use client'

import { useEffect, useRef } from 'react'

/* All light is white at low alpha, built from the --primary token (pure white). */
const w = (a: number) => `hsl(var(--primary) / ${a})`

const BEAM = [
  `radial-gradient(ellipse 34% 26% at var(--lx) var(--ly), ${w(0.16)}, transparent 70%)`,
  `conic-gradient(from 110deg at var(--lx) var(--ly), transparent 0deg, ${w(0.08)} 14deg, ${w(0.04)} 30deg, transparent 52deg)`,
  `radial-gradient(ellipse 70% 55% at calc(var(--lx) + 18%) calc(var(--ly) + 30%), ${w(0.05)}, transparent 70%)`,
].join(', ')

const STARS = [
  [12, 22, 1, 0.33],
  [28, 61, 1, 0.25],
  [47, 30, 1, 0.19],
  [66, 54, 1, 0.25],
  [81, 19, 1, 0.21],
  [91, 66, 1, 0.25],
  [36, 48, 1, 0.19],
  [30, 38, 1.5, 0.31],
]
  .map(([x, y, r, a]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, ${w(a)}, transparent)`)
  .join(', ')

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

/** Resting origin of the beam, just off the top-left corner */
const REST = { x: 8, y: -4 }

/**
 * CSS-only light beam from the top-left with grain and a few faint stars.
 * Fades in over 1500ms. On fine pointers its origin drifts toward the cursor
 * (a small range, eased), driven through the --lx / --ly custom properties.
 * Place as the first child of a `relative isolate` section; pass that section.
 */
export function HeroLight({ trackRef }: { trackRef: React.RefObject<HTMLElement | null> }) {
  const lightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = trackRef.current
    const light = lightRef.current
    if (!host || !light) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return

    const target = { ...REST }
    const cur = { ...REST }
    let raf = 0

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08
      cur.y += (target.y - cur.y) * 0.08
      light.style.setProperty('--lx', `${cur.x.toFixed(2)}%`)
      light.style.setProperty('--ly', `${cur.y.toFixed(2)}%`)
      raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.01 ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      target.x = 4 + ((e.clientX - r.left) / r.width) * 14
      target.y = -6 + ((e.clientY - r.top) / Math.min(r.height, 1100)) * 10
      kick()
    }
    const onLeave = () => {
      target.x = REST.x
      target.y = REST.y
      kick()
    }

    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [trackRef])

  return (
    <div
      ref={lightRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(100%,1100px)] bg-background"
      style={
        {
          '--lx': `${REST.x}%`,
          '--ly': `${REST.y}%`,
          WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent)',
          maskImage: 'linear-gradient(to bottom, black 55%, transparent)',
          animation: 'fade-in 1500ms var(--ease-smoothstep) 100ms both',
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0" style={{ backgroundImage: BEAM }} />
      <div className="absolute inset-0" style={{ backgroundImage: STARS }} />
      <div className="absolute inset-0 opacity-[0.22] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  )
}
