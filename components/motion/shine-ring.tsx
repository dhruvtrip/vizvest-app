import type { ReactElement } from 'react'

export interface ShineRingProps {
  /** One host element, usually a pill Button. */
  children: ReactElement
}

/**
 * CSS-only shine ring around a single pill button: two bronze highlights
 * sweep around the edge with a soft glow behind. No JavaScript and no
 * WebGL. Styles live in app/styles/shine-ring.css.
 */
export function ShineRing({ children }: ShineRingProps) {
  return <span className="shine-ring">{children}</span>
}
