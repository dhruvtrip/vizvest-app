import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/landing'
import { prose } from '@/components/articles/mdx-components'
import { Button } from '@/components/ui/button'
import { pageMetadata } from '@/lib/metadata'
import { ORGANIZATION_ID, SITE_NAME, WEBSITE_ID, absoluteUrl } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'About Vizvest: An Independent Trading 212 Portfolio Analyser',
  socialTitle: 'About Vizvest',
  description:
    'Who makes Vizvest, why it exists, how it keeps your Trading 212 data on your device, and how our guides are researched, sourced and kept up to date.',
  path: '/about',
})

const section = 'mt-12 border-t border-border pt-12'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': `${absoluteUrl('/about')}#page`,
      url: absoluteUrl('/about'),
      name: 'About Vizvest',
      inLanguage: 'en-GB',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORGANIZATION_ID },
    },
    {
      '@type': 'Person',
      '@id': `${absoluteUrl('/about')}#founder`,
      name: 'TRIP',
      jobTitle: 'Founder',
      url: absoluteUrl('/about'),
      worksFor: { '@id': ORGANIZATION_ID },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'About', item: absoluteUrl('/about') },
      ],
    },
  ],
}

export default function AboutPage() {
  return (
    <div className="relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="page-glow" aria-hidden="true" />
      <Navbar />
      <main id="main-content" className="relative px-4 pb-28 pt-32 lg:pb-section lg:pt-40">
        <div className="mx-auto w-full max-w-prose">
          <header className="t-rise-in">
            <h1 className="text-[2rem] font-light leading-[2.375rem] tracking-[-0.035em] text-foreground sm:text-[2.5rem] sm:leading-[2.875rem] lg:text-5xl lg:leading-[3.375rem]">
              About Vizvest
            </h1>
            <p className="text-lead mt-6">
              Vizvest is a free portfolio analyser for Trading&nbsp;212. It turns the CSV you export from your account
              into a dashboard of realised profit, dividends, fees and trading activity, and it does all of that in
              your browser.
            </p>
          </header>

          <section aria-labelledby="why" className={section}>
            <h2 id="why" className={prose.h2}>
              Why it exists
            </h2>
            <p className={prose.p}>
              Vizvest started because its founder, TRIP, invests with Trading&nbsp;212 and could not see the full
              picture of their own portfolio. The app is good for buying and selling, but it does not add up your
              dividends over time, total the currency fees you have paid, or show how your trading habits shape your
              returns.
            </p>
            <p className={prose.p}>
              Every Trading&nbsp;212 account can export its history as a CSV, and that file holds the answers. Vizvest
              reads it and lays out the views the platform does not have.
            </p>
          </section>

          <section aria-labelledby="how" className={section}>
            <h2 id="how" className={prose.h2}>
              How it handles your data
            </h2>
            <p className={prose.p}>
              The CSV is parsed and analysed by JavaScript running on your device. It is never uploaded, there is no
              account, and refreshing the page clears everything. Vizvest does not connect to Trading&nbsp;212 and
              never asks for a login. The{' '}
              <Link href="/privacy" className={prose.link}>
                privacy policy
              </Link>{' '}
              covers the small amount of anonymous analytics we collect, and only with your consent.
            </p>
          </section>

          <section aria-labelledby="guides" className={section}>
            <h2 id="guides" className={prose.h2}>
              How our guides are written
            </h2>
            <ul className={prose.ul}>
              <li className={prose.li}>
                Facts about how Trading&nbsp;212 works, including its fees and export format, are checked against
                Trading&nbsp;212&apos;s own website and help centre, and we link to those sources in the text.
              </li>
              <li className={prose.li}>
                Each guide shows when it was published and when it was last updated, and we revisit guides when
                Trading&nbsp;212 changes how something works.
              </li>
              <li className={prose.li}>
                We do not write about tax. For anything tax-related, consult a qualified tax adviser.
              </li>
              <li className={prose.li}>
                Worked examples use made-up numbers and say so. We do not invent statistics or quotes.
              </li>
              <li className={prose.li}>
                Guides are general information, not financial or tax advice. See the{' '}
                <Link href="/terms" className={prose.link}>
                  terms of use
                </Link>
                .
              </li>
            </ul>
          </section>

          <section aria-labelledby="independent" className={section}>
            <h2 id="independent" className={prose.h2}>
              Independent of Trading 212
            </h2>
            <p className={prose.p}>
              Vizvest is an independent project. It is not affiliated with, endorsed by or sponsored by
              Trading&nbsp;212. &ldquo;Trading&nbsp;212&rdquo; is a trademark of its owner and is used here only to
              describe the export files Vizvest reads.
            </p>
          </section>

          <div className="mt-12 flex flex-col gap-2 border-t border-border pt-12 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard">Open the dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/articles">Read the guides</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
