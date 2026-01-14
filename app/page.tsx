'use client'

import { Navbar, Hero, FeaturesBento, HowItWorks, CTA, Footer } from '@/components/landing'

export default function HomePage() {
  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>
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
