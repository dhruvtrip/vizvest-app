import type { Metadata } from 'next'
import { Navbar, Footer } from '@/components/landing'
import { ManageAnalyticsButton } from '@/components/manage-analytics-button'
import { prose } from '@/components/articles/mdx-components'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check } from '@/components/icons'
import { cn } from '@/lib/utils'
import { pageMetadata } from '@/lib/metadata'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy | Vizvest',
  description:
    'Vizvest processes your financial data locally in your browser. Your data never leaves your device. Read how we handle the small amount of analytics data we do collect.',
  path: '/privacy',
})

const section = 'mt-12 border-t border-border pt-12'

export default function PrivacyPage() {
  return (
    <div className="relative overflow-x-clip">
      <div className="page-glow" aria-hidden="true" />
      <Navbar />
      <main id="main-content" className="relative px-4 pb-28 pt-32 lg:pb-section lg:pt-40">
        <div className="mx-auto w-full max-w-prose">
          <header>
            <h1 className="text-[2rem] font-light leading-[2.375rem] tracking-[-0.035em] text-foreground sm:text-[2.5rem] sm:leading-[2.875rem] lg:text-5xl lg:leading-[3.375rem]">
              Privacy policy
            </h1>
            <p className="figure mt-4 text-sm font-normal text-muted-foreground">Last updated August 2026</p>
          </header>

          <Card className="mt-10 p-6 sm:p-8">
            <h2 className="heading-card">The short version</h2>
            <ul className="mt-4 flex flex-col gap-3 text-base font-normal leading-relaxed">
              <li className="flex items-start gap-3">
                <Check size={16} className="mt-1 text-foreground" />
                <span>
                  Your financial data is processed entirely in your browser and{' '}
                  <strong className={prose.strong}>never sent to our servers</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="mt-1 text-foreground" />
                <span>No account, no email, no password. We don&apos;t know who you are.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="mt-1 text-foreground" />
                <span>
                  We collect basic, anonymous analytics to improve Vizvest, never your financial data. It&apos;s
                  cookie-free until you accept, and you can switch it off at any time.
                </span>
              </li>
            </ul>
          </Card>

          <section aria-labelledby="financial-data" className={section}>
            <h2 id="financial-data" className={prose.h2}>
              Your financial data
            </h2>
            <p className={prose.p}>
              When you upload a Trading 212 CSV file to Vizvest, it is parsed and analysed entirely inside your
              browser using JavaScript. The file is never transmitted to our servers — we don&apos;t have the
              infrastructure to receive it, store it, or read it.
            </p>
            <p className={prose.p}>
              When you close the tab or refresh the page, your data is gone. Vizvest has no database of your holdings,
              transaction history, or portfolio value. There is nothing to breach, leak, or subpoena.
            </p>
            <p className={prose.p}>
              This is a deliberate design choice. Most portfolio trackers require you to create an account and upload
              your data to their servers. We don&apos;t. The trade-off is that you need to re-upload your CSV each
              session — but your financial data stays on your device.
            </p>
          </section>

          <section aria-labelledby="analytics" className={section}>
            <h2 id="analytics" className={prose.h2}>
              Analytics and cookies
            </h2>
            <p className={prose.p}>
              We use <strong className={prose.strong}>PostHog</strong> to understand how people use Vizvest — which
              features are used, where people drop off, and whether new features are working. This helps us improve
              the product. PostHog is hosted in the EU, and we route its requests through our own domain.
            </p>
            <p className={prose.p}>When you first visit, you&apos;ll see a consent banner with three possible states:</p>
            <ul className={prose.ul}>
              <li className={prose.li}>
                <strong className={prose.strong}>Before you choose</strong> — we collect a small amount of{' '}
                <strong className={prose.strong}>anonymous, cookie-free</strong> analytics held only in memory. No
                cookies or other identifiers are stored on your device, your IP address and precise location are
                stripped before the data is sent, and there is no way to recognise you across visits. We do record
                which site referred you — the <strong className={prose.strong}>domain only</strong> (e.g. a search
                engine or social site), never the full link — and any campaign tags in the URL, so we can understand
                where visitors come from.
              </li>
              <li className={prose.li}>
                <strong className={prose.strong}>If you accept</strong> — analytics continues and we store a
                first-party identifier (in local storage and a cookie) so we can recognise a returning session and
                build more accurate usage insights.
              </li>
              <li className={prose.li}>
                <strong className={prose.strong}>If you decline</strong> — analytics is switched off entirely and
                nothing further is collected.
              </li>
            </ul>
            <p className={prose.p}>What PostHog tracks (unless you decline):</p>
            <ul className={prose.ul}>
              <li className={prose.li}>Page views and navigation paths</li>
              <li className={prose.li}>Feature interactions (e.g. which dashboard tab you viewed)</li>
              <li className={prose.li}>
                Referring site (domain only) and any campaign tags, to understand where visitors come from
              </li>
              <li className={prose.li}>
                General session data (browser type, screen size — and, once you accept, coarse country-level location)
              </li>
              <li className={prose.li}>
                Error types when something breaks (the kind of error only — never the message or your data)
              </li>
            </ul>
            <p className={prose.p}>
              PostHog does <strong className={prose.strong}>not</strong> receive any of your financial data. Events are
              generic (e.g. &quot;viewed dividends tab&quot;) — they contain no values, tickers, or portfolio details,
              and any value that looks financial is stripped before it leaves your browser.
            </p>
            <p className={prose.p}>
              You can change or withdraw your choice at any time with the button below, which is also linked in the
              footer of every page. Declining immediately opts you out and removes any stored analytics identifier.
            </p>
            <ManageAnalyticsButton className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')} />
          </section>

          <section aria-labelledby="what-we-dont-do" className={section}>
            <h2 id="what-we-dont-do" className={prose.h2}>
              What we don&apos;t do
            </h2>
            <ul className={prose.ul}>
              <li className={prose.li}>We do not sell, share, or monetise any user data.</li>
              <li className={prose.li}>We do not use advertising networks or tracking pixels.</li>
              <li className={prose.li}>We do not set cookies for authentication, because there are no accounts.</li>
              <li className={prose.li}>We do not store your CSV data, even temporarily on our servers.</li>
              <li className={prose.li}>We do not use third-party analytics beyond what is described above.</li>
            </ul>
          </section>

          <section aria-labelledby="changes" className={section}>
            <h2 id="changes" className={prose.h2}>
              Changes to this policy
            </h2>
            <p className={prose.p}>
              If we ever change how we handle data — particularly if we were to introduce server-side processing or
              accounts — we will update this page and note the date. We will not quietly expand data collection.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
