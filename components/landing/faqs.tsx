'use client'

import { useState } from 'react'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    id: 'files',
    question: 'Can I upload multiple CSV files at once?',
    answer: 'Yes. Drop in as many Trading 212 exports as you want — Vizvest will merge them, strip duplicate transactions, and review the full set together. You can also add files one at a time and remove any before confirming.'
  },
  {
    id: 'csv-length',
    question: 'What is the maximum duration of data I can upload?',
    answer: 'Trading 212 only lets you export up to 12 months per file, but there is no limit on Vizvest. Export several date ranges, upload them all, and we will stitch them into one continuous history for you.'
  },
  {
    id: 'currency-mixed',
    question: 'What if my exports use different base currencies?',
    answer: 'If the files you upload cover more than one base currency, Vizvest will ask which one you want to convert everything to before showing the dashboard.'
  },
  {
    id: 'privacy',
    question: 'Is my data stored on your servers?',
    answer:
      'No. Your CSV file is processed entirely in your browser. Nothing gets uploaded or stored anywhere.'
  },
  {
    id: 'csv',
    question: 'What format does my data need to be in?',
    answer:
      'We only support CSV exports from Trading 212. The app validates the format and shows you charts for your data.'
  },
  {
    id: 'data',
    question: 'Where can I get my Trading 212 data from?',
    answer:
      'From your Trading 212 account, open Settings, then History, and choose Export. Select your desired date range and confirm the export. The CSV file will download to your device and is ready to upload here.'
  }
] as const

function AnimatedAccordionContent({
  open,
  children,
  className
}: {
  open: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: open ? 'auto' : 0,
        opacity: open ? 1 : 0
      }}
      transition={{
        height: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
        opacity: { duration: 0.25 }
      }}
      style={{ overflow: 'hidden' }}
    >
      <div className={cn('pb-4 pt-0 text-muted-foreground', className)}>
        {children}
      </div>
    </motion.div>
  )
}

export function FAQs() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [value, setValue] = useState<string>('')

  return (
    <section
      id="faqs"
      className="py-24 lg:py-32 relative overflow-hidden"
      ref={ref}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

<div className="container mx-auto px-6 sm:px-8 lg:px-16 xl:px-24 max-w-7xl relative">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6"
            role="status"
            aria-label="FAQs section"
          >
            <HelpCircle className="w-3 h-3" aria-hidden="true" />
            FAQs
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-light mb-4 tracking-tight">
            Frequently asked questions
          </h2>
        </motion.div>

        {/* Accordion */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Accordion
            type="single"
            collapsible
            value={value}
            onValueChange={setValue}
            className="rounded-lg border bg-card/50 backdrop-blur-sm border-border/50 divide-y divide-border/50"
          >
            {FAQS.map((faq) => {
              const isOpen = value === faq.id
              return (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border-none"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg first:rounded-t-lg data-[state=open]:rounded-b-none data-[state=open]:bg-muted/30">
                    <motion.span
                      className="text-left font-medium"
                      whileHover={{ x: 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {faq.question}
                    </motion.span>
                  </AccordionTrigger>
                  <AccordionContent
                    forceMount
                    className="overflow-hidden px-6 [&>div]:pb-0 [&>div]:pt-0"
                  >
                    <AnimatedAccordionContent open={isOpen}>
                      {faq.answer}
                    </AnimatedAccordionContent>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
