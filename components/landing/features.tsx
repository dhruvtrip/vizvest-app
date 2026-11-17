import { Reveal } from '@/components/motion/reveal'
import { features } from './feature-list'
import { SectionHeading } from './section-heading'
import { SnapRail } from './snap-rail'

/** A hairline that runs through the card, with a diamond where it meets each edge. */
function Hairline() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute -inset-x-96 top-1/2 h-px bg-panel-foreground/30" />
      <span className="absolute left-0 top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-panel-foreground" />
      <span className="absolute right-0 top-1/2 z-10 size-2 -translate-y-1/2 translate-x-1/2 rotate-45 bg-panel-foreground" />
    </span>
  )
}

/**
 * Signature section: six working sketches of the product. Each one floats as
 * a glass card on its own dark panel, with a title and a line underneath.
 * On phones the cards form a swipe row. From md up they stack, then sit in
 * two columns whose rows share one height through a subgrid, and hovering a
 * cell lifts its card.
 */
export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="mx-auto w-full max-w-shell scroll-mt-28">
      <Reveal>
        <SectionHeading
          id="features-heading"
          title="What Vizvest shows you"
          description="Six views of your portfolio, all built from the same CSV."
        />
      </Reveal>

      {/* In the swipe row a chart gives up its own touch scrubbing, so a swipe that starts on it moves the row. */}
      <SnapRail
        aria-label="Show a feature"
        labels={features.map(({ id, label }) => ({ value: id, label }))}
        className="max-md:[&_.vz-plot]:touch-auto md:mx-auto md:mt-12 md:grid md:max-w-2xl md:gap-x-6 md:gap-y-12 lg:mt-16 lg:max-w-none lg:grid-cols-2"
      >
        {features.map(({ id, title, description, Visual }) => (
          // A card peeking in from the side is never far enough on screen to
          // trigger its reveal, so the swipe row shows its cards from the start.
          <Reveal
            key={id}
            className="group flex flex-col gap-y-5 max-md:!transform-none max-md:!opacity-100 md:row-span-2 md:grid md:grid-rows-subgrid"
          >
            <div className="panel-texture flex items-center rounded-4xl p-3 max-md:flex-1 sm:p-6 xl:p-10">
              <div className="relative w-full transition-transform duration-400 ease-smooth-out motion-safe:group-hover:-translate-y-1.5">
                {id === 'profit' ? <Hairline /> : null}
                <div className="surface-glass relative p-4 text-foreground sm:p-6">
                  <Visual />
                </div>
              </div>
            </div>
            <div className="px-1">
              <h3 className="heading-card">{title}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </Reveal>
        ))}
      </SnapRail>
    </section>
  )
}
