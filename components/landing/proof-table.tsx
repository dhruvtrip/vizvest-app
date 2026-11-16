import {
  ArrowLeftRight,
  Banknote,
  GitMerge,
  Globe,
  HandCoins,
  Receipt,
  Scan,
  Wallet,
} from '@/components/icons'
import type { Icon } from '@/components/icons'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from './section-heading'

// What Vizvest reads from a Trading 212 export. Each cell picks up one of
// the six data colours on hover, the same colours the charts use.
const items: { label: string; icon: Icon; hue: number }[] = [
  { label: 'Market, limit and stop orders', icon: ArrowLeftRight, hue: 1 },
  { label: 'Dividend payments', icon: HandCoins, hue: 2 },
  { label: 'Withholding tax', icon: Receipt, hue: 3 },
  { label: 'Currency conversion fees', icon: Banknote, hue: 4 },
  { label: 'Deposits', icon: Wallet, hue: 5 },
  { label: 'Trades in any currency', icon: Globe, hue: 6 },
  { label: 'Several exports, merged', icon: GitMerge, hue: 1 },
  { label: 'Partial history, flagged', icon: Scan, hue: 3 },
]

export function ProofTable() {
  return (
    <Reveal>
      <section aria-labelledby="proof-heading" className="flex flex-col gap-8">
        <SectionHeading
          id="proof-heading"
          title="Reads everything in your export"
          description="Trading 212 puts your whole history into one CSV. Vizvest reads every row of it."
        />
        <div className="mx-auto w-full max-w-content">
          <ul className="hairline-grid grid grid-cols-2 lg:grid-cols-4">
            {items.map(({ label, icon: IconComponent, hue }) => (
              <li
                key={label}
                style={{ '--hue': `rgb(var(--chart-${hue}))` } as React.CSSProperties}
                className="group flex min-h-32 flex-col items-center gap-3 px-3 pb-7 pt-9 text-center"
              >
                <IconComponent
                  size={24}
                  className="text-muted-foreground transition-colors duration-300 ease-ui group-hover:text-[color:var(--hue)]"
                />
                <span className="text-sm font-medium leading-5">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Reveal>
  )
}
