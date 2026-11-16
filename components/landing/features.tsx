import { Reveal } from '@/components/motion/reveal'
import { FeatureVisual } from './feature-visual'
import { SectionHeading } from './section-heading'

const left = [
  {
    title: 'Dividends, net of tax',
    description: 'Monthly and quarterly income, the tax withheld at source and what actually reached your account.',
  },
  {
    title: 'Profit per position',
    description: 'Realised results taken straight from Trading 212’s own figures, position by position.',
  },
  {
    title: 'Trading habits, mapped',
    description: 'A day-by-day heatmap with streaks, your busiest month and your win rate.',
  },
]

const right = [
  {
    title: 'What trading cost you',
    description: 'Currency conversion fees and withholding tax added up, so the return you see is the one you kept.',
  },
  {
    title: 'Every trade in a stock',
    description: 'Open any holding for its full buy, sell and dividend history in one place.',
  },
  {
    title: 'Many exports, one history',
    description: 'Upload a file per year. Vizvest merges them and drops the rows that overlap.',
  },
]

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="lg:max-w-60">
      <h3 className="heading-card mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

/** Signature section: the product in the middle, three benefits on each side, offset from one another. */
export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="mx-auto w-full max-w-shell scroll-mt-28">
      <Reveal>
        <SectionHeading
          id="features-heading"
          title="What your export can tell you"
          description="Six views of your portfolio, all built from the same CSV."
        />
      </Reveal>

      <Reveal className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-[1fr_2.2fr_1fr] lg:gap-12">
        <div className="order-2 grid gap-8 sm:grid-cols-3 lg:order-1 lg:grid-cols-1 lg:gap-20 lg:pb-24">
          {left.map((feature) => (
            <Feature key={feature.title} {...feature} />
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <FeatureVisual />
        </div>

        <div className="order-3 grid gap-8 sm:grid-cols-3 lg:grid-cols-1 lg:gap-20 lg:pt-24">
          {right.map((feature) => (
            <Feature key={feature.title} {...feature} />
          ))}
        </div>
      </Reveal>
    </section>
  )
}
