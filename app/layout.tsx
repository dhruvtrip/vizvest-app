import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { MotionProvider } from '@/components/motion/motion-provider'
import { PostHogProvider } from '@/app/providers/ph-provider'
import { PostHogConsentBanner } from '@/components/posthog-consent-banner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

// One family for the whole product. Inter is a variable font, so every weight ships in one file.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vizvest.cc'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Vizvest - Free Trading 212 Portfolio Analysis & Dividend Tracker',
  description:
    'Free portfolio analysis tool for Trading 212. Upload your CSV to visualize holdings, track dividends, and analyze trading performance — all in your browser.',
  openGraph: {
    type: 'website',
    title: 'Vizvest - Free Trading 212 Portfolio Analysis & Dividend Tracker',
    description:
      'Free portfolio analysis tool for Trading 212. Upload your CSV to visualize holdings, track dividends, and analyze trading performance — all in your browser.',
    url: SITE_URL,
    siteName: 'Vizvest',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vizvest - Free Trading 212 Portfolio Analysis & Dividend Tracker',
    description:
      'Free portfolio analysis tool for Trading 212. Upload your CSV to visualize holdings, track dividends, and analyze trading performance.',
  },
  alternates: {
    canonical: '/',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vizvest',
  url: SITE_URL,
  description:
    'Free portfolio analysis tool for Trading 212 users. Visualize holdings, track dividends, and analyze trading performance.',
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Vizvest',
  url: SITE_URL,
  description:
    'Free portfolio analysis tool for Trading 212. Upload your CSV to visualize holdings, track dividends, and analyze trading performance.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MotionProvider>
              {children}
              <PostHogConsentBanner />
            </MotionProvider>
          </ThemeProvider>
          <SpeedInsights />
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  )
}
