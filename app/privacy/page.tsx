import type { Metadata } from 'next'
import { Navbar, Footer } from '@/components/landing'
import { ManageAnalyticsButton } from '@/components/manage-analytics-button'
import { Check } from 'lucide-react'
import { reading } from '@/components/articles/mdx-components'
import { ReadingBody, ReadingHeader, ReadingShell } from '@/components/articles/reading-layout'

export const metadata: Metadata = {
  title: 'Privacy Policy | Vizvest',
  description:
    'Vizvest processes your financial data locally in your browser. Your data never leaves your device. Read how we handle the small amount of analytics data we do collect.',
  openGraph: {
    title: 'Privacy Policy | Vizvest',
    description:
      'Vizvest processes your financial data locally in your browser. Your data never leaves your device.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/privacy`,
    type: 'website',
  },
}

const P = reading.p
const UL = reading.ul
const LI = reading.li
const H2 = 'text-h4 text-foreground'
const SECTION = 'border-t border-border pt-10 mt-12 first:mt-0 first:border-t-0 first:pt-0'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main id="main-content">
      <ReadingShell className="pb-24 md:pb-32">
        <ReadingHeader
          meta={<p>Last updated: August 2026</p>}
          title="Privacy policy"
          description="Vizvest processes your financial data locally in your browser. Your data never leaves your device."
        />

        <ReadingBody>
          {/* Short version callout */}
          <div className="border border-border p-6">
            <h2 className="flex items-center gap-2.5 text-p-sm font-medium text-foreground">
              <span className="status-dot" aria-hidden="true" />
              The short version
            </h2>
            <ul className="mt-5 space-y-3">
              <li className="flex items-start gap-3 text-p-sm text-foreground/80">
                <Check aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0 text-fg-gray" />
                <span>Your financial data is processed entirely in your browser and <strong className={reading.strong}>never sent to our servers</strong>.</span>
              </li>
              <li className="flex items-start gap-3 text-p-sm text-foreground/80">
                <Check aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0 text-fg-gray" />
                <span>No account, no email, no password. We don&apos;t know who you are.</span>
              </li>
              <li className="flex items-start gap-3 text-p-sm text-foreground/80">
                <Check aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0 text-fg-gray" />
                <span>We collect basic, anonymous analytics to improve Vizvest — never your financial data. It&apos;s cookie-free until you accept, and you can switch it off at any time.</span>
              </li>
            </ul>
          </div>

          <div className="mt-14">
            {/* Section 1 */}
            <section className={SECTION}>
              <h2 className={H2}>Your financial data</h2>
              <p className={P}>
                When you upload a Trading 212 CSV file to Vizvest, it is parsed and analysed entirely inside your browser using JavaScript. The file is never transmitted to our servers — we don&apos;t have the infrastructure to receive it, store it, or read it.
              </p>
              <p className={P}>
                When you close the tab or refresh the page, your data is gone. Vizvest has no database of your holdings, transaction history, or portfolio value. There is nothing to breach, leak, or subpoena.
              </p>
              <p className={P}>
                This is a deliberate design choice. Most portfolio trackers require you to create an account and upload your data to their servers. We don&apos;t. The trade-off is that you need to re-upload your CSV each session — but your financial data stays on your device.
              </p>
            </section>

            {/* Section 2 */}
            <section className={SECTION}>
              <h2 className={H2}>Analytics &amp; cookies</h2>
              <p className={P}>
                We use <strong className={reading.strong}>PostHog</strong> to understand how people use Vizvest — which features are used, where people drop off, and whether new features are working. This helps us improve the product. PostHog is hosted in the EU, and we route its requests through our own domain.
              </p>
              <p className={P}>
                When you first visit, you&apos;ll see a consent banner with three possible states:
              </p>
              <ul className={UL}>
                <li className={LI}>
                  <strong className={reading.strong}>Before you choose</strong> — we collect a small amount of <strong className={reading.strong}>anonymous, cookie-free</strong> analytics held only in memory. No cookies or other identifiers are stored on your device, your IP address and precise location are stripped before the data is sent, and there is no way to recognise you across visits. We do record which site referred you — the <strong className={reading.strong}>domain only</strong> (e.g. a search engine or social site), never the full link — and any campaign tags in the URL, so we can understand where visitors come from.
                </li>
                <li className={LI}>
                  <strong className={reading.strong}>If you accept</strong> — analytics continues and we store a first-party identifier (in local storage and a cookie) so we can recognise a returning session and build more accurate usage insights.
                </li>
                <li className={LI}>
                  <strong className={reading.strong}>If you decline</strong> — analytics is switched off entirely and nothing further is collected.
                </li>
              </ul>
              <p className={P}>
                What PostHog tracks (unless you decline):
              </p>
              <ul className={UL}>
                <li className={LI}>Page views and navigation paths</li>
                <li className={LI}>Feature interactions (e.g. which dashboard tab you viewed)</li>
                <li className={LI}>Referring site (domain only) and any campaign tags, to understand where visitors come from</li>
                <li className={LI}>General session data (browser type, screen size — and, once you accept, coarse country-level location)</li>
                <li className={LI}>Error types when something breaks (the kind of error only — never the message or your data)</li>
              </ul>
              <p className={P}>
                PostHog does <strong className={reading.strong}>not</strong> receive any of your financial data. Events are generic (e.g. &quot;viewed dividends tab&quot;) — they contain no values, tickers, or portfolio details, and any value that looks financial is stripped before it leaves your browser.
              </p>
              <p className={P}>
                You can change or withdraw your choice at any time using{' '}
                <ManageAnalyticsButton className={reading.a}>
                  Manage analytics
                </ManageAnalyticsButton>{' '}
                (also linked in the footer of every page). Declining immediately opts you out and removes any stored analytics identifier.
              </p>
            </section>

            {/* Section 3 */}
            <section className={SECTION}>
              <h2 className={H2}>What we don&apos;t do</h2>
              <ul className={UL}>
                <li className={LI}>We do not sell, share, or monetise any user data.</li>
                <li className={LI}>We do not use advertising networks or tracking pixels.</li>
                <li className={LI}>We do not set cookies for authentication, because there are no accounts.</li>
                <li className={LI}>We do not store your CSV data, even temporarily on our servers.</li>
                <li className={LI}>We do not use third-party analytics beyond what is described above.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className={SECTION}>
              <h2 className={H2}>Changes to this policy</h2>
              <p className={P}>
                If we ever change how we handle data — particularly if we were to introduce server-side processing or accounts — we will update this page and note the date. We will not quietly expand data collection.
              </p>
            </section>
          </div>
        </ReadingBody>
      </ReadingShell>

      </main>

      <Footer />
    </div>
  )
}
