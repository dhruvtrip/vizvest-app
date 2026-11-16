/**
 * Series colours for every chart. The six hues live as RGB channel tokens
 * (`--chart-1` ... `--chart-6`) in globals.css, with their own light and dark
 * steps, so a chart only ever names a slot, never a colour.
 */

export type SeriesColor = 1 | 2 | 3 | 4 | 5 | 6

/** CSS colour for a series slot: `rgb(var(--chart-1))` or `rgb(var(--chart-1) / 0.4)`. */
export const seriesVar = (c: SeriesColor, alpha?: number): string =>
  alpha === undefined || alpha >= 1 ? `rgb(var(--chart-${c}))` : `rgb(var(--chart-${c}) / ${Math.max(0, alpha)})`

/** Fixed series order: index 0 is chart-1, and anything past the sixth stays on chart-6. */
export const seriesAt = (index: number): SeriesColor => {
  const i = Math.floor(Number.isFinite(index) ? index : 0)
  return Math.min(6, Math.max(1, i + 1)) as SeriesColor
}

/** Up / down colours for signed money, as CSS colours. */
export const toneVar = (tone: 'up' | 'down', alpha?: number): string =>
  alpha === undefined || alpha >= 1 ? `hsl(var(--${tone}))` : `hsl(var(--${tone}) / ${Math.max(0, alpha)})`

/** The single item that stands in for everything past the top (max - 1). */
export type FoldedOther<T> = {
  id: '__other'
  label: string
  value: number
  other: true
  /** The items folded into it, largest first. */
  members: T[]
}

export type Folded<T> = T | FoldedOther<T>

export const isOther = <T,>(item: Folded<T>): item is FoldedOther<T> =>
  typeof item === 'object' && item !== null && (item as { other?: unknown }).other === true

/**
 * Sorts by value (largest first) and keeps at most `max` items. When there
 * are more, the top (max - 1) stay and the rest fold into one "Other" item,
 * so a chart never needs a seventh hue.
 *
 *   foldSeries(holdings).map((h, i) => ({ ...h, color: seriesAt(i) }))
 */
export function foldSeries<T extends { value: number }>(
  items: T[],
  max = 6,
  otherLabel = 'Other'
): Folded<T>[] {
  const keep = Math.max(1, Math.floor(max))
  const sorted = [...items].sort((a, b) => b.value - a.value)
  if (sorted.length <= keep) return sorted
  const top = sorted.slice(0, keep - 1)
  const rest = sorted.slice(keep - 1)
  const other: FoldedOther<T> = {
    id: '__other',
    label: otherLabel,
    value: rest.reduce((sum, item) => sum + item.value, 0),
    other: true,
    members: rest,
  }
  return [...top, other]
}
