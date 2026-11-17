import { Reveal } from '@/components/motion/reveal'
import { ProductPreview } from './product-preview'

/** The product itself, live, framed on the dark panel directly under the hero. */
export function ProductDemo() {
  return (
    <Reveal delay={0.1}>
      <section aria-label="Product preview" className="mx-auto w-full max-w-shell">
        <div className="panel-texture rounded-4xl p-2.5 sm:p-8 lg:rounded-5xl lg:p-14">
          <ProductPreview />
        </div>
      </section>
    </Reveal>
  )
}
