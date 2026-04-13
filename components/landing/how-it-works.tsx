'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Wrench } from 'lucide-react'

const steps = [
  {
    number: '01',
    progress: 0.33,
    title: 'Upload your data',
    description: 'Export your Trading 212 transaction history as a CSV and drop it in. Supports drag-and-drop with instant validation.',
  },
  {
    number: '02',
    progress: 0.66,
    title: 'Explore insights',
    description: 'Get an instant overview — allocation, performance charts, and dividend tracking, all built automatically.',
  },
  {
    number: '03',
    progress: 1,
    title: 'Track performance',
    description: 'Drill into individual stocks, review transaction history, and watch P/L evolve over time.',
  },
]

const RING_RADIUS = 42
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden" ref={ref}>
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
            aria-label="How it works section"
          >
            <Wrench className="w-3 h-3" aria-hidden="true" />
            How it works
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-light mb-4 tracking-tight">
            Get started in seconds
          </h2>
          <p className="text-muted-foreground">
            No account required. Everything processes in your browser.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 auto-rows-[280px]">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
              className="relative"
            >
              <Card className="relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="relative z-10 h-full p-6 flex flex-col">
                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-normal text-foreground tracking-tight mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Progress ring with step number */}
                  <div className="mt-auto flex items-center justify-center pt-6">
                    <div className="relative w-20 h-20" role="img" aria-label={`Step ${step.number} of 3`}>
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                        <circle
                          cx="50"
                          cy="50"
                          r={RING_RADIUS}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-border/60"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r={RING_RADIUS}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="text-brand"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                          animate={isInView ? { strokeDashoffset: RING_CIRCUMFERENCE * (1 - step.progress) } : {}}
                          transition={{ delay: 0.4 + index * 0.15, duration: 1, ease: 'easeOut' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-mono font-medium text-foreground tabular-nums tracking-tight">
                        {step.number}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
