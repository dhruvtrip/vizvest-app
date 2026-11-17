'use client'

import { Disclosure, DisclosureGroup } from '@/components/motion'
import { Reveal } from '@/components/motion/reveal'
import { FAQS } from './faq-data'
import { SectionHeading } from './section-heading'

export function FAQs() {
  return (
    <section id="faqs" aria-labelledby="faq-heading" className="mx-auto w-full max-w-content scroll-mt-28">
      <Reveal>
        <SectionHeading id="faq-heading" title="Questions, answered" />
      </Reveal>
      <Reveal delay={0.1} className="mx-auto mt-10 max-w-2xl lg:mt-12">
        <DisclosureGroup type="single" className="border-t border-border">
          {FAQS.map((faq) => (
            <Disclosure key={faq.id} value={faq.id} title={faq.question} headingLevel={3}>
              {faq.answer}
            </Disclosure>
          ))}
        </DisclosureGroup>
      </Reveal>
    </section>
  )
}
