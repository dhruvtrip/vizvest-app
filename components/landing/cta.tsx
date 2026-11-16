'use client'

import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/icons'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from './section-heading'

const included = [
  'As many CSV exports as you like, merged into one history',
  'Dividend income, withholding tax and net received',
  'Realised profit and loss for every position',
  'Trading activity heatmap, streaks and win rate',
  'Currency conversion fees added up',
  'Trades in any currency shown in your base currency',
  'Light and dark themes',
]

/** Closing call to action: the free plan, set as a glass card on the dark panel. */
export function CTA() {
  return (
    <Reveal>
      <section
        aria-labelledby="cta-heading"
        className="panel-texture mx-auto w-full max-w-shell rounded-4xl px-4 py-16 sm:px-8 lg:px-12 lg:py-20"
      >
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            id="cta-heading"
            onPanel
            title="Ready to see what you really earned?"
            description="Upload your export and have the full picture in under ten seconds."
          />

          <div className="surface-glass mt-12 flex flex-col text-sm text-foreground md:flex-row">
            <div className="flex flex-col border-b border-border/40 p-8 md:w-2/5 md:border-b-0 md:border-r lg:p-10">
              <h3 className="text-center text-4xl font-medium tracking-tight">Vizvest</h3>
              <p className="mt-1 text-center text-lg leading-7 text-muted-foreground">For Trading 212 investors</p>
              <p className="mt-8 text-center text-xl font-medium">Free</p>
              <div className="mt-8 flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full"
                  onClick={() => posthog.capture('get_started_cta_clicked', { location: 'cta_section' })}
                >
                  <Link href="/dashboard">Open the dashboard</Link>
                </Button>
                <Button asChild variant="glass" className="w-full">
                  <Link href="/articles">Read the guides</Link>
                </Button>
              </div>
              <p className="mt-8 text-center text-sm text-muted-foreground">No account or card needed.</p>
            </div>

            <div className="flex flex-col justify-between p-8 md:w-3/5 lg:p-10">
              <ul className="flex flex-col gap-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-medium">
                    <Check size={16} strokeWidth={2} className="mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-8 border-t border-border/40 pt-6 leading-relaxed text-muted-foreground">
                Your file is read in your browser and kept in memory only. Refresh the page and it is gone.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  )
}
