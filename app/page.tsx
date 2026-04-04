import { Navbar, Hero, ProductShot, FeaturesBento, HowItWorks, FAQs, CTA, Footer } from '@/components/landing'

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I upload multiple CSV files at once?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Currently, you can only upload one CSV file at a time. Multiple supports are coming soon.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the maximum duration of data I can upload?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Currently, Trading212 only supports data for the last 12 months. However, you can consolidate multiple CSVs into one before uploading.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data stored on your servers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Your CSV file is processed entirely in your browser. Nothing gets uploaded or stored anywhere.',
      },
    },
    {
      '@type': 'Question',
      name: 'What format does my data need to be in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We only support CSV exports from Trading 212. The app validates the format and shows you charts for your data.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I get my Trading 212 data from?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'From your Trading 212 account, open Settings, then History, and choose Export. Select your desired date range and confirm the export. The CSV file will download to your device and is ready to upload here.',
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main id="main-content" className="min-h-screen">
        <Navbar />
        <Hero />
        <ProductShot />
        <FeaturesBento />
        <HowItWorks />
        <FAQs />
        <CTA />
        <Footer />
      </main>
    </>
  )
}
