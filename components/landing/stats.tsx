import { CountUp } from '@/components/motion/count-up'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from './section-heading'

const stats = [
  { value: 100, prefix: '', suffix: '%', label: 'Processed in your browser' },
  { value: 10, prefix: '<', suffix: 's', label: 'From CSV to dashboard' },
  { value: 0, prefix: '£', suffix: '', label: 'Free, with no account' },
]

export function Stats() {
  return (
    <Reveal>
      <section aria-labelledby="stats-heading">
        <SectionHeading
          id="stats-heading"
          title="Your numbers stay yours"
          description="Your CSV is read on your device and held in memory only. Close the tab and it is gone."
        />
        <div className="mx-auto mt-12 w-full max-w-5xl lg:mt-16">
          <ul className="hairline-grid grid grid-cols-1 sm:grid-cols-3">
            {stats.map((stat) => (
              <li key={stat.label} className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <CountUp
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  className="figure-stat"
                />
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Reveal>
  )
}
