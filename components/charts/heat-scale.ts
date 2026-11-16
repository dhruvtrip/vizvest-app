import { seriesVar, type SeriesColor } from './palette'

export type HeatLevel = 0 | 1 | 2 | 3 | 4

const STEPS: Record<Exclude<HeatLevel, 0>, number> = { 1: 0.3, 2: 0.5, 3: 0.75, 4: 1 }

/**
 * Inline `background` for a calendar heatmap cell. Level 0 is the empty
 * track (`bg-background`); 1 to 4 step one hue through 30 / 50 / 75 / 100%.
 */
export const heatFill = (level: HeatLevel, color: SeriesColor): string =>
  level === 0 ? 'hsl(var(--background))' : seriesVar(color, STEPS[level])

/** Buckets a value into a heat level against the largest value in the set. */
export const heatLevel = (value: number, max: number): HeatLevel => {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(max) || max <= 0) return 0
  const r = value / max
  return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1
}
