import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Navbar, Footer } from '@/components/landing'
import { Container, GridGuides } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Page not found | Vizvest',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main id="main-content" className="flex flex-1 flex-col">
      <section className="relative flex flex-1 flex-col justify-center py-16 md:py-24">
        <GridGuides />
        <Container>
          <div className="flex flex-col items-center border-y border-border px-6 py-20 text-center md:py-28">
            <p aria-hidden="true" className="blur-in tabular text-h1 text-fg-tertiary">
              404
            </p>
            <h1 className="blur-in blur-in-1 mt-6 text-h3 text-foreground">
              <span className="sr-only">404: </span>
              This page does not exist
            </h1>
            <p className="blur-in blur-in-2 mt-3 max-w-[480px] text-pretty text-p-lg text-fg-secondary">
              The link may be broken, or the page may have moved.
            </p>
            <div className="blur-in blur-in-3 mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight aria-hidden="true" strokeWidth={1.5} />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      </main>

      <Footer />
    </div>
  )
}
