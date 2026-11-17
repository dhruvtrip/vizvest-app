/**
 * Reads a motion variable such as `--text-swap-dur` from the element (so a
 * local override wins over `:root`) and returns it in milliseconds. Values in
 * seconds are converted. Falls back when the variable is missing.
 * Call it from effects and event handlers only, never during render.
 */
export function readCssMs(el: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const value = parseFloat(raw)
  if (!Number.isFinite(value)) return fallback
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value
}

/** Reads a unitless motion variable such as `--avatar-falloff`. */
export function readCssNumber(el: Element, name: string, fallback: number): number {
  const value = parseFloat(getComputedStyle(el).getPropertyValue(name))
  return Number.isFinite(value) ? value : fallback
}

/** Reads a raw motion variable such as an easing curve. */
export function readCssValue(el: Element, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}
