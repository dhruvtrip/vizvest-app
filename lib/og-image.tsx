import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

// Literal colours are unavoidable here: Satori renders outside the CSS
// cascade, so these mirror the dark theme tokens in app/globals.css.
const BACKGROUND = 'hsl(0, 0%, 4%)' // --background (dark)
const FOREGROUND = 'hsl(0, 0%, 98%)' // --foreground (dark)
const MUTED = 'hsl(0, 0%, 63%)' // --muted-foreground (dark)
const BORDER = 'hsl(0, 0%, 15%)' // --border (dark)
const BRAND = 'hsl(39, 38%, 34%)' // --brand

interface OgImageInput {
  title: string
  /** Small line above the title, e.g. "Guide". */
  eyebrow?: string
  /** Line under the title. */
  subtitle?: string
}

/** Social card shared by the home page and every article. */
export function renderOgImage({ title, eyebrow, subtitle }: OgImageInput) {
  const titleSize = title.length > 70 ? 56 : title.length > 45 ? 64 : 76

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: BACKGROUND,
          color: FOREGROUND,
          borderTop: `12px solid ${BRAND}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: 6 }}>VIZVEST</div>
          {eyebrow ? (
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                color: MUTED,
                border: `2px solid ${BORDER}`,
                borderRadius: 999,
                padding: '8px 22px',
              }}
            >
              {eyebrow}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: titleSize, lineHeight: 1.1, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 30, color: MUTED, maxWidth: 950 }}>{subtitle}</div> : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: MUTED }}>
          <div>www.vizvest.cc</div>
          <div>Free Trading 212 portfolio analyser</div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
