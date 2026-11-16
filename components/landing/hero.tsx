'use client'

import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'

export function Hero() {
  return (
    <Reveal>
      <section
        aria-labelledby="hero-heading"
        className="mx-auto flex w-full max-w-content flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
      >
        <h1 id="hero-heading" className="heading-display max-w-2xl">
          See what your Trading&nbsp;212 portfolio actually earned
        </h1>

        <div className="flex max-w-md flex-col gap-8">
          <p className="text-lead">
            Drop in your CSV export and get dividends, realised profit, fees and every trade laid out in one
            dashboard. It runs in your browser, so your data stays on your device.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                onClick={() => posthog.capture('dashboard_cta_clicked', { location: 'hero_section' })}
              >
                <Link href="/dashboard">Open the dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Free to use. No account needed.</p>
          </div>
        </div>
      </section>
    </Reveal>
  )
}
