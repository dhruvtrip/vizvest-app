'use client'

import { useState } from 'react'
import { ArrowRight } from '@/components/icons'
import { NumberChange } from '@/components/motion'
import type { Currency } from '../currency-chip'
import { Line, VisualLabel, VisualRoot, euro, useReveal } from './kit'

interface Holding extends Currency {
  /** The amount as Trading 212 shows it, in its own currency. */
  from: string
  amount: number
  /** Rate to the base currency, as found in the export. */
  rate: number
}

const base: Currency = { code: 'EUR', name: 'Euro', flag: 'eu' }

const holdings: Holding[] = [
  { code: 'USD', name: 'US dollar', flag: 'us', from: '$1,240.00', amount: 1240, rate: 0.9206 },
  { code: 'GBP', name: 'Pound sterling', flag: 'gb', from: '£860.50', amount: 860.5, rate: 1.1712 },
  { code: 'GBX', name: 'Pence', flag: 'gb', badge: 'p', from: '42,150p', amount: 42150, rate: 0.011712 },
  { code: 'CHF', name: 'Swiss franc', flag: 'ch', from: 'CHF 515.00', amount: 515, rate: 1.0634 },
  { code: 'CAD', name: 'Canadian dollar', flag: 'ca', from: 'CA$730.00', amount: 730, rate: 0.6581 },
  { code: 'SEK', name: 'Swedish krona', flag: 'se', from: '6,400 kr', amount: 6400, rate: 0.0871 },
]

const converted = (holding: Holding) => holding.amount * holding.rate
const total = holdings.reduce((sum, holding) => sum + converted(holding), 0)

function Flag({ currency }: { currency: Currency }) {
  return (
    <span className="flag" style={{ backgroundImage: `url(/flags/${currency.flag}.svg)` }}>
      {currency.badge ? <span className="flag__badge">{currency.badge}</span> : null}
    </span>
  )
}

/** Amounts in six currencies. Hover or focus a chip to see it converted to the base currency; a click keeps it. */
export function CurrencyVisual() {
  const { ref, shown } = useReveal()
  const [pinned, setPinned] = useState(holdings[0].code)
  const [hovered, setHovered] = useState<string | null>(null)
  const active = holdings.find((holding) => holding.code === (hovered ?? pinned)) ?? holdings[0]

  return (
    <VisualRoot rootRef={ref} shown={shown}>
      <Line className="flex items-center justify-between gap-3">
        <VisualLabel>Base currency</VisualLabel>
        <span className="currency-chip currency-chip--inline">
          <Flag currency={base} />
          <span className="currency-chip__code">{base.code}</span>
        </span>
      </Line>

      <Line index={1} className="mt-4">
        <div role="group" aria-label="Currencies in this export" className="grid grid-cols-2 gap-2">
          {holdings.map((holding) => (
            <button
              key={holding.code}
              type="button"
              aria-pressed={pinned === holding.code}
              aria-label={`${holding.name}, ${holding.code}, ${holding.from}`}
              data-active={active.code === holding.code}
              className="currency-chip currency-chip--inline w-full"
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setHovered(holding.code)
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') setHovered(null)
              }}
              onFocus={() => setHovered(holding.code)}
              onBlur={() => setHovered(null)}
              onClick={() => setPinned(holding.code)}
            >
              <Flag currency={holding} />
              <span className="currency-chip__code">{holding.code}</span>
              <span className="figure ml-auto truncate text-xs font-normal text-muted-foreground">{holding.from}</span>
            </button>
          ))}
        </div>
      </Line>

      <Line index={2} className="mt-auto pt-4">
        <div aria-live="polite" className="rounded-xl bg-muted p-3 sm:p-4">
          <p className="text-xs font-normal leading-4 text-muted-foreground">
            {active.name} to {base.name.toLowerCase()}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <NumberChange value={active.from} className="text-base font-semibold sm:text-lg" />
              <p className="figure text-xs font-normal leading-4 text-muted-foreground">
                at {active.rate.toFixed(active.rate < 0.1 ? 6 : 4)}
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-right">
              <NumberChange value={euro(converted(active))} className="text-xl font-semibold tracking-tight sm:text-2xl" />
              <p className="text-xs font-normal leading-4 text-muted-foreground">in your base currency</p>
            </div>
          </div>
        </div>
        <p className="mt-3 flex items-center justify-between gap-3 text-xs font-normal leading-4 text-muted-foreground">
          <span>All {holdings.length} currencies together</span>
          <span className="figure text-sm font-medium text-foreground">{euro(total)}</span>
        </p>
      </Line>
    </VisualRoot>
  )
}
