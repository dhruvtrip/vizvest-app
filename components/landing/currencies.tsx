'use client'

import { HoverStack } from '@/components/motion'
import { PopGroup, PopItem, Reveal } from '@/components/motion/reveal'
import { SectionHeading } from './section-heading'

// Each currency takes one of the six data colours.
const currencies = [
  { code: 'USD', glyph: '$', hue: 1 },
  { code: 'EUR', glyph: '€', hue: 2 },
  { code: 'GBP', glyph: '£', hue: 3 },
  { code: 'GBX', glyph: 'p', hue: 4 },
  { code: 'CHF', glyph: 'Fr', hue: 5 },
  { code: 'CAD', glyph: 'C$', hue: 6 },
]

export function Currencies() {
  return (
    <Reveal slow>
      <section aria-labelledby="currencies-heading" className="flex flex-col items-center">
        <SectionHeading
          id="currencies-heading"
          title="Works in your currency"
          description="Dollar, euro, pound, pence, franc and Canadian dollar trades all land in one base currency."
        />
        <PopGroup className="mt-10 lg:mt-12">
          <HoverStack overlap={12} className="justify-center">
            {currencies.map((currency) => (
              <PopItem key={currency.code}>
                <span
                  title={currency.code}
                  style={{
                    color: `rgb(var(--chart-${currency.hue}))`,
                    backgroundImage: `linear-gradient(rgb(var(--chart-${currency.hue}) / 0.14), rgb(var(--chart-${currency.hue}) / 0.14))`,
                  }}
                  className="figure grid size-14 place-items-center rounded-full bg-background text-2xl font-semibold ring-4 ring-background"
                >
                  <span aria-hidden="true">{currency.glyph}</span>
                  <span className="sr-only">{currency.code}</span>
                </span>
              </PopItem>
            ))}
          </HoverStack>
        </PopGroup>
      </section>
    </Reveal>
  )
}
