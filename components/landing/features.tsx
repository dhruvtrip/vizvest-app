import { Container, GridGuides } from '@/components/layout/container'
import { SectionHeader } from '@/components/layout/section-header'
import { Reveal } from './feature-kit'
import {
  CurrencyVisual,
  DividendVisual,
  FeesVisual,
  HeatmapVisual,
  PnlVisual,
  TradesVisual,
} from './feature-visuals'

const features = [
  {
    title: 'Track every trade, every day',
    description: 'See your trading patterns at a glance with an activity heatmap.',
    Visual: HeatmapVisual,
  },
  {
    title: 'Full P&L at a glance',
    description: 'Follow your gains and losses over time with detailed analytics.',
    Visual: PnlVisual,
  },
  {
    title: 'See what trading actually costs',
    description:
      'Every commission, FX spread and withholding tax tallied automatically, so you know your real return, not the headline one.',
    Visual: FeesVisual,
  },
  {
    title: 'Watch your income compound',
    description: 'Monitor dividend income, yields and payment schedules.',
    Visual: DividendVisual,
  },
  {
    title: 'All trades in one view',
    description: 'Open any stock to see its full transaction history, every buy and sell.',
    Visual: TradesVisual,
  },
  {
    title: 'Trade across currencies natively',
    description: 'USD, EUR, GBP, CHF and more, normalised to your base currency automatically.',
    Visual: CurrencyVisual,
  },
]

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="relative mt-section scroll-mt-24">
      <GridGuides className="-top-section" />
      <Container>
        <Reveal>
          <SectionHeader
            id="features-title"
            title="Everything you need to understand your investments"
            description="Features that help you see what's actually happening with your portfolio."
          />
        </Reveal>

        <div className="cell-grid grid-cols-1 md:grid-cols-2">
          {features.map(({ title, description, Visual }) => (
            <article key={title} className="flex flex-col">
              <div aria-hidden="true" className="relative h-[300px] select-none overflow-hidden md:h-[360px]">
                <Visual />
              </div>
              <div className="p-6">
                <h3 className="text-p text-foreground">{title}</h3>
                <p className="mt-2 max-w-[440px] text-pretty text-p text-fg-secondary">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
