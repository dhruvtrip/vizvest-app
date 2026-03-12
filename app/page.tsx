'use client'

import { Navbar, Hero, ProductShot, FeaturesBento, HowItWorks, FAQs, CTA, Footer } from '@/components/landing'

export default function HomePage() {
  return (
    <>
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
