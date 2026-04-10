'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 lg:py-32 relative" ref={ref}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 xl:px-24 max-w-7xl">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Card className={cn(
            'relative overflow-hidden',
            'border-border/50',
            'bg-card/50 backdrop-blur-sm'
          )}>
            <CardContent className="relative z-10 px-8 py-16 sm:px-12 sm:py-20 lg:px-16">
              <div className="text-center max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-medium text-brand mb-6 backdrop-blur-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  Easy to use
                </motion.div>

                <motion.h2
                  className="text-3xl sm:text-4xl font-light text-foreground mb-4 tracking-tight"
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 }}
                >
                  Ready to see what you&apos;re really earning?
                </motion.h2>

                <motion.p
                  className="text-base text-muted-foreground mb-8 max-w-lg mx-auto"
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  Upload your CSV and get clarity in under 10 seconds.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-8 text-sm font-medium bg-brand text-white hover:bg-brand gap-2"
                    onClick={() => posthog.capture('get_started_cta_clicked', { location: 'cta_section' })}
                  >
                    <Link href="/dashboard" aria-label="Get started with Vizvest dashboard">
                      Get Started Now
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
