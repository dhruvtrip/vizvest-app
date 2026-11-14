'use client'

/**
 * Replaces the root layout when the layout itself fails, so it cannot rely on
 * globals.css, the Tailwind build or the next/font variable. Everything it
 * needs is inline: black canvas, one hairline panel, one white button.
 */
const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif'

const css = `
  .ge-btn { transition: transform 200ms ease-in-out; }
  .ge-btn:hover { opacity: 0.7; }
  .ge-btn:active { transform: scale(0.97); }
  .ge-btn:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .ge-btn { transition: none; } }
`

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" style={{ background: '#000000', colorScheme: 'dark' }}>
      <body
        style={{
          margin: 0,
          background: '#000000',
          color: '#EDF2F5',
          fontFamily: FONT,
          fontSize: 16,
          lineHeight: '24px',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <style>{css}</style>
        <main
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 16,
            boxSizing: 'border-box',
          }}
        >
          <div
            role="alert"
            style={{
              width: '100%',
              maxWidth: 400,
              boxSizing: 'border-box',
              padding: 24,
              border: '1px solid #232323',
              borderRadius: 12,
              background: '#0E0E10',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                lineHeight: '28px',
                letterSpacing: '-0.225px',
                fontWeight: 500,
                color: '#EDF2F5',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 14,
                lineHeight: '20px',
                letterSpacing: '-0.175px',
                color: '#9F9F9F',
              }}
            >
              An unexpected error stopped the page from loading. Try again, or reload the page.
            </p>
            <button
              type="button"
              className="ge-btn"
              onClick={reset}
              style={{
                marginTop: 24,
                height: 32,
                padding: '0 12px',
                border: 0,
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#222222',
                fontFamily: FONT,
                fontSize: 14,
                lineHeight: '20px',
                letterSpacing: '0.105px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
