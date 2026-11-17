import {
  Navbar,
  Hero,
  ProductDemo,
  ProofTable,
  Features,
  Currencies,
  HowItWorks,
  Stats,
  FAQs,
  CTA,
  Footer,
} from '@/components/landing'
import { FAQS } from '@/components/landing/faq-data'

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
  return (
    <>
      {/* PostHog inserts its add-on scripts before the first `body > script`.
          Keeping JSON-LD inside this div stops that from breaking hydration. */}
      <div className="relative overflow-x-clip">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <div className="page-glow" aria-hidden="true" />
        <Navbar />
        <main
          id="main-content"
          className="relative flex flex-col gap-28 px-4 pb-28 pt-32 lg:gap-section lg:pb-section lg:pt-40"
        >
          <div className="flex flex-col gap-12 lg:gap-16">
            <Hero />
            <ProductDemo />
            <ProofTable />
          </div>
          <Features />
          <Currencies />
          <HowItWorks />
          <Stats />
          <FAQs />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  )
}
