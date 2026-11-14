'use client'

import Link from 'next/link'
import posthog from 'posthog-js'
import { Container, GridGuides } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { Reveal } from './feature-kit'

export function CTA() {
  return (
    <div className="relative mt-section">
      <GridGuides className="-top-section" />
      <section aria-labelledby="cta-title" className="border-y border-border">
        <Container>
          <div className="border-x border-border px-6 py-20 text-center md:py-[88px]">
            <Reveal>
              <h2 id="cta-title" className="mx-auto max-w-[672px] text-h2-m text-foreground md:text-h2">
                Ready to see what you&apos;re really earning?
              </h2>
              <p className="mx-auto mt-4 max-w-[460px] text-pretty text-p-lg text-fg-secondary">
                Upload your CSV and get clarity in under 10 seconds.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  onClick={() => posthog.capture('get_started_cta_clicked', { location: 'cta_section' })}
                >
                  <Link href="/dashboard" aria-label="Get started with Vizvest dashboard">
                    Get started
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/articles">Read the guides</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
      {/* quiet run-out before the footer, guides continue through it */}
      <div aria-hidden="true" className="h-section" />
    </div>
  )
}
