interface LogoTile {
  /** File name in public/logos/stocks, without the extension. */
  ticker: string
  /** Centre of the tile on wide screens, in % of the field. */
  x: number
  y: number
  /** Centre on narrow screens, where a few tiles sit in the corners, clear of the text. Left out, the tile is hidden there. */
  narrow?: [x: number, y: number]
  /** Tile edge in px on wide screens. */
  size: number
  /** Resting opacity. Smaller tiles sit further back. */
  opacity: number
  /** Opacity gained as the statement lights up. Tiles nearest the text gain the most. */
  gain?: number
  /** Vertical travel in px over the whole scroll. The sign sets the direction. */
  drift: number
  /** A black or dark logo, flipped to light on the dark theme. */
  ink?: boolean
}

// Some of the most traded stocks on Trading 212, down both sides of the statement.
const tiles: LogoTile[] = [
  { ticker: 'nvda', x: 6, y: 18, narrow: [13, 9], size: 76, opacity: 0.9, drift: -30, ink: true },
  { ticker: 'coin', x: 17, y: 13, size: 40, opacity: 0.4, gain: 0.2, drift: 22 },
  { ticker: 'aapl', x: 14, y: 36, narrow: [91, 26], size: 56, opacity: 0.7, gain: 0.2, drift: 36, ink: true },
  { ticker: 'msft', x: 4, y: 52, narrow: [9, 25], size: 44, opacity: 0.45, drift: -18 },
  { ticker: 'amzn', x: 10.5, y: 69, narrow: [12, 78], size: 68, opacity: 0.85, drift: 26, ink: true },
  { ticker: 'amd', x: 20, y: 82, size: 52, opacity: 0.5, gain: 0.2, drift: -32 },
  { ticker: 'meta', x: 5.5, y: 87, narrow: [9, 93], size: 40, opacity: 0.4, drift: 20 },
  { ticker: 'tsla', x: 93.5, y: 16, narrow: [88, 11], size: 68, opacity: 0.85, drift: 32 },
  { ticker: 'intc', x: 83, y: 22, size: 52, opacity: 0.5, gain: 0.2, drift: -22 },
  { ticker: 'googl', x: 95.5, y: 38, narrow: [91, 76], size: 40, opacity: 0.4, drift: -26 },
  { ticker: 'uber', x: 87, y: 52, size: 60, opacity: 0.7, gain: 0.2, drift: 38, ink: true },
  { ticker: 'nflx', x: 94, y: 69, size: 44, opacity: 0.45, drift: 20 },
  { ticker: 'spot', x: 84.5, y: 82, narrow: [87, 91], size: 72, opacity: 0.9, gain: 0.1, drift: -30 },
  { ticker: 'pltr', x: 96, y: 88, size: 40, opacity: 0.4, drift: 24, ink: true },
]

/**
 * Background of the scroll statement: stock logos in rounded tiles, scattered
 * down the left and right at mixed sizes and fading toward the centre, so the
 * text stays clear. Position and brightness follow `--p`, the scroll progress
 * the statement writes on its sticky box (see `.logo-tile` in landing.css).
 * Decorative, so it is hidden from assistive tech.
 */
export function StockLogoField() {
  return (
    <div aria-hidden="true" className="logo-field pointer-events-none absolute inset-0 select-none">
      {tiles.map((tile) => (
        <span
          key={tile.ticker}
          className={tile.narrow ? 'logo-tile' : 'logo-tile max-md:hidden'}
          style={
            {
              '--x': `${tile.x}%`,
              '--y': `${tile.y}%`,
              '--nx': tile.narrow ? `${tile.narrow[0]}%` : undefined,
              '--ny': tile.narrow ? `${tile.narrow[1]}%` : undefined,
              '--size': `${tile.size}px`,
              '--o': tile.opacity,
              '--gain': tile.gain ?? 0,
              '--drift': `${tile.drift}px`,
            } as React.CSSProperties
          }
        >
          {/* Vendored SVGs from thesvg.org, drawn as plain images so nothing inside them can run. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/logos/stocks/${tile.ticker}.svg`}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            draggable={false}
            className={tile.ink ? 'dark:hue-rotate-180 dark:invert' : undefined}
          />
        </span>
      ))}
    </div>
  )
}
