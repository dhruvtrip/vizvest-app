import Link from 'next/link'
import { Container, GridGuides } from '@/components/layout/container'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FAQS } from '@/lib/landing-content'
import { Reveal } from './feature-kit'

export function FAQs() {
  return (
    <section id="faqs" aria-labelledby="faqs-title" className="relative mt-section scroll-mt-24">
      <GridGuides className="-top-section" />
      <Container>
        <div className="grid grid-cols-1 border border-border md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Reveal className="border-b border-border px-6 pb-10 pt-6 md:border-b-0 md:border-r">
            <h2 id="faqs-title" className="max-w-[400px] text-h2-m text-foreground md:text-h2">
              Frequently asked questions
            </h2>
            <p className="mt-4 max-w-[320px] text-pretty text-p-lg text-fg-secondary">
              More detail in the{' '}
              <Link
                href="/articles"
                className="text-foreground underline decoration-border-hover underline-offset-4 transition-[color,text-decoration-color] duration-200 ease-in-out hover:text-white hover:decoration-white"
              >
                guides
              </Link>
              .
            </p>
          </Reveal>

          <Accordion type="single" collapsible>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="last:border-b-0">
                <AccordionTrigger className="px-6 py-6">{faq.question}</AccordionTrigger>
                <AccordionContent className="-mt-2 max-w-[560px] px-6 pb-6 text-p text-fg-secondary">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  )
}
