import {
  Navbar,
  Hero,
  ProofStrip,
  ProblemStatement,
  Features,
  HowItWorks,
  Stats,
  FAQs,
  CTA,
  Footer,
} from '@/components/landing'
import { FAQS } from '@/lib/landing-content'

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar banner />
      <main id="main-content">
        <Hero />
        <ProofStrip />
        <ProblemStatement />
        <Features />
        <HowItWorks />
        <Stats />
        <FAQs />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
