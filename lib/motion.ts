/**
 * Motion tokens. Blur is the house transition: almost every enter and exit
 * pairs opacity with a Gaussian blur. Mirrors the CSS variables in globals.css
 * so framer-motion and CSS animate on the same curves.
 */
export const EASE = {
  /** ease-out-quad, the default curve */
  house: [0.25, 0.46, 0.45, 0.94],
  inOut: [0.4, 0, 0.2, 1],
  out: [0, 0, 0.2, 1],
  outExpo: [0.19, 1, 0.22, 1],
  outQuart: [0.165, 0.84, 0.44, 1],
  inQuad: [0.55, 0.085, 0.68, 0.53],
  smoothstep: [0.33, 0, 0.67, 1],
  swap: [0.65, 0, 0.35, 1],
  smoothOut: [0.22, 1, 0.36, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

/** Durations in seconds (framer-motion units) */
export const DUR = {
  micro: 0.08,
  quick: 0.15,
  fast: 0.25,
  medium: 0.35,
  slow: 0.4,
  reveal: 0.6,
  wordSwap: 0.6,
  tabIn: 0.18,
  tabOut: 0.12,
} as const

/** Per-item stagger in seconds */
export const STAGGER = {
  tight: 0.04,
  base: 0.1,
} as const
