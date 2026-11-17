import {
  Navbar,
  Hero,
  ProductDemo,
  ProofTable,
  ScrollStatement,
  Features,
  Currencies,
  HowItWorks,
  Stats,
  FAQs,
  LatestGuides,
  CTA,
  Footer,
} from '@/components/landing'
import type { Metadata } from 'next'
import { FAQS } from '@/components/landing/faq-data'
import { getArticles } from '@/lib/articles'
import { pageMetadata } from '@/lib/metadata'
import { ORGANIZATION_ID, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, absoluteUrl } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: '/',
})

// The guides section picks up scheduled articles on their publish date.
export const revalidate = 3600

const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${absoluteUrl('/')}#app`,
  name: SITE_NAME,
  url: absoluteUrl('/dashboard'),
  description: SITE_DESCRIPTION,
  applicationCategory: 'FinanceApplication',
  applicationSubCategory: 'Portfolio tracker',
  operatingSystem: 'Any (runs in a web browser)',
  browserRequirements: 'Requires JavaScript. Works in any modern browser.',
  isAccessibleForFree: true,
  inLanguage: 'en-GB',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  featureList: [
    'Import one or more Trading 212 CSV exports (Invest and Stocks ISA)',
    'Merge exports and remove duplicate transactions',
    'Portfolio overview: buy and sell volume, deposits and allocation by holding',
    'Realised profit per position, taken from Trading 212’s own figures',
    'Per-stock history of every buy, sell and dividend',
    'Dividend income by month and quarter, net of withholding tax',
    'Currency conversion fees and withholding tax totals',
    'Trading activity heatmap and win rate',
    'Multi-currency normalisation to one base currency',
    'Processed entirely in the browser: the CSV is never uploaded',
  ],
  publisher: { '@id': ORGANIZATION_ID },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function HomePage() {
  const latestArticles = getArticles().slice(0, 3)

  return (
    <>
      {/* PostHog inserts its add-on scripts before the first `body > script`.
          Keeping JSON-LD inside this div stops that from breaking hydration. */}
      <div className="relative overflow-x-clip">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
        <div className="page-glow" aria-hidden="true" />
        <Navbar />
        <main
          id="main-content"
          className="relative flex flex-col gap-20 px-4 pb-20 pt-32 lg:gap-section lg:pb-section lg:pt-40"
        >
          <div className="flex flex-col gap-10 sm:gap-12 lg:gap-16">
            <Hero />
            <ProductDemo />
            <ProofTable />
          </div>
          <ScrollStatement />
          <Features />
          <Currencies />
          <HowItWorks />
          <Stats />
          <FAQs />
          <LatestGuides articles={latestArticles} />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  )
}
