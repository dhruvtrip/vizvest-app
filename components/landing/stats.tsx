import { Container, GridGuides } from '@/components/layout/container'
import { Reveal } from './feature-kit'

const stats = [
  {
    label: 'Privacy',
    value: '0',
    caption: 'Bytes of your data sent to a server. Everything runs in your browser.',
  },
  {
    label: 'Speed',
    value: '<10s',
    caption: 'From CSV export to a full dashboard.',
  },
  {
    label: 'Price',
    value: '£0',
    caption: 'Free to use. No account, no sign-up.',
  },
]

/** A quiet band of three claims the product already makes, in hairline cells. */
export function Stats() {
  return (
    <section aria-label="Vizvest at a glance" className="relative mt-section">
      <GridGuides className="-top-section" />
      <Container>
        <div className="cell-grid grid-cols-1 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="flex min-h-[168px] flex-col justify-between gap-8 p-6 md:min-h-[260px]">
              <p className="text-p-sm text-fg-gray">{s.label}</p>
              <div>
                <p className="tabular text-h2-m text-foreground md:text-h1">{s.value}</p>
                <p className="mt-2 max-w-[300px] text-pretty text-p text-fg-secondary md:min-h-[72px] lg:min-h-12">{s.caption}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
