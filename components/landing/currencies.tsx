'use client'

import { Orbit } from '@/components/motion'
import { Reveal } from '@/components/motion/reveal'
import { CurrencyChip, type Currency } from './currency-chip'
import { SectionHeading } from './section-heading'

// The currencies Trading 212 supports, plus pence. Ring order alternates
// blue and red flags and keeps the two UK chips (GBP, GBX) apart.
const currencies: Currency[] = [
  { code: 'GBP', name: 'Pound sterling', flag: 'gb' },
  { code: 'CHF', name: 'Swiss franc', flag: 'ch' },
  { code: 'EUR', name: 'Euro', flag: 'eu' },
  { code: 'CAD', name: 'Canadian dollar', flag: 'ca' },
  { code: 'SEK', name: 'Swedish krona', flag: 'se' },
  { code: 'DKK', name: 'Danish krone', flag: 'dk' },
  { code: 'RON', name: 'Romanian leu', flag: 'ro' },
  { code: 'GBX', name: 'Pence', flag: 'gb', badge: 'p' },
  { code: 'NOK', name: 'Norwegian krone', flag: 'no' },
  { code: 'USD', name: 'US dollar', flag: 'us' },
  { code: 'PLN', name: 'Polish złoty', flag: 'pl' },
  { code: 'HUF', name: 'Hungarian forint', flag: 'hu' },
  { code: 'CZK', name: 'Czech koruna', flag: 'cz' },
]

export function Currencies() {
  return (
    <Reveal slow>
      <section aria-labelledby="currencies-heading" className="flex flex-col items-center">
        <SectionHeading
          id="currencies-heading"
          title="Bought in pence, sold in dollars?"
          description={`Vizvest converts every trade at the exchange rate already in your Trading 212 export, so all ${currencies.length} currencies add up in your base currency.`}
        />
        <Orbit className="mt-6 lg:mt-10">
          {currencies.map((currency) => (
            <CurrencyChip key={currency.code} currency={currency} />
          ))}
        </Orbit>
        {/* The orbit is decorative, so the currencies are listed here for assistive tech. */}
        <ul className="sr-only">
          {currencies.map((currency) => (
            <li key={currency.code}>
              {currency.name} ({currency.code})
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  )
}
