import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/landing'
import { Shield } from 'lucide-react'

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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),transparent)]" />
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
            </div>

            {/* Short version callout */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-6 mb-12">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-primary mb-4">The short version</h2>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Your financial data is processed entirely in your browser and <strong>never sent to our servers</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>No account, no email, no password. We don&apos;t know who you are.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>We do collect basic, anonymous analytics — but only with your permission, and your financial data is never part of it.</span>
                </li>
              </ul>
            </div>

            {/* Main content */}
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-10">

              {/* Section 1 */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Your financial data</h2>
                <p className="text-muted-foreground leading-relaxed">
                  When you upload a Trading 212 CSV file to Vizvest, it is parsed and analysed entirely inside your browser using JavaScript. The file is never transmitted to our servers — we don&apos;t have the infrastructure to receive it, store it, or read it.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  When you close the tab or refresh the page, your data is gone. Vizvest has no database of your holdings, transaction history, or portfolio value. There is nothing to breach, leak, or subpoena.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  This is a deliberate design choice. Most portfolio trackers require you to create an account and upload your data to their servers. We don&apos;t. The trade-off is that you need to re-upload your CSV each session — but your financial data stays on your device.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Analytics (opt-in)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use <strong>PostHog</strong> to understand how people use Vizvest — which features are used, where people drop off, and whether new features are working. This helps us improve the product.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  PostHog analytics is <strong>opt-in</strong>. When you first visit Vizvest, you&apos;ll see a consent banner. Analytics only runs if you accept. If you decline or ignore the banner, no PostHog data is collected.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  What PostHog tracks (if you consent):
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground text-sm list-disc list-inside">
                  <li>Page views and navigation paths</li>
                  <li>Feature interactions (e.g. which dashboard tab you viewed)</li>
                  <li>General session data (browser type, screen size, country)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  PostHog does <strong>not</strong> receive any of your financial data. Events are generic (e.g. &quot;viewed dividends tab&quot;) — they contain no values, tickers, or portfolio details.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  You can opt out at any time by clearing your browser cookies or adjusting your browser&apos;s privacy settings.
                </p>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-xl font-semibold mb-3">What we don&apos;t do</h2>
                <ul className="space-y-2 text-muted-foreground text-sm list-disc list-inside">
                  <li>We do not sell, share, or monetise any user data.</li>
                  <li>We do not use advertising networks or tracking pixels.</li>
                  <li>We do not set cookies for authentication, because there are no accounts.</li>
                  <li>We do not store your CSV data, even temporarily on our servers.</li>
                  <li>We do not use third-party analytics beyond what is described above.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Changes to this policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If we ever change how we handle data — particularly if we were to introduce server-side processing or accounts — we will update this page and note the date. We will not quietly expand data collection.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
