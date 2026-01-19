'use client'

import { Navbar, Hero, FeaturesBento, HowItWorks, CTA, Footer } from '@/components/landing'

export default function HomePage() {
  return (
    <>
      <main id="main-content" className="min-h-screen">
        <Navbar />
        <Hero />
        <FeaturesBento />
        <HowItWorks />
        <CTA />
        <Footer />
      </main>
    </>
  )
}
