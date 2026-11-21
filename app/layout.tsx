import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { MotionProvider } from '@/components/motion/motion-provider'
import { PostHogProvider } from '@/app/providers/ph-provider'
import { PostHogConsentBanner } from '@/components/posthog-consent-banner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import {
  LOGO_URL,
  ORGANIZATION_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  WEBSITE_ID,
  absoluteUrl,
} from '@/lib/site'

// One family for the whole product. Inter is a variable font, so every weight ships in one file.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Vizvest', url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'finance',
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Bing Webmaster Tools "HTML meta tag" verification for www.vizvest.cc.
  // Set BING_SITE_VERIFICATION in Vercel to the content value Bing gives you.
  ...(process.env.BING_SITE_VERIFICATION && {
    verification: { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } },
  }),
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: 'Vizvest articles' }],
    },
  },
}

// Site-wide entities. Pages reference these by @id instead of repeating them.
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
        width: 2008,
        height: 2008,
      },
      description:
        'Vizvest makes a free, browser-based portfolio analyser for Trading 212 investors. It turns a Trading 212 CSV export into dividends, profit, fees and trading activity without uploading the file anywhere.',
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      inLanguage: 'en-GB',
      description: SITE_DESCRIPTION,
      publisher: { '@id': ORGANIZATION_ID },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
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
