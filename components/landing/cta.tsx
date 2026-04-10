'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/ui/magnetic'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 lg:py-32 relative" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          className="relative overflow-hidden rounded-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Background — inverse of page for strong contrast in both themes */}
          <div className="absolute inset-0 bg-foreground" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)`,
              backgroundSize: '32px 32px'
            }}
          />

          {/* Subtle animated glow */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
              style={{ background: 'hsl(var(--background) / 0.08)' }}
              animate={{
                x: [0, 50, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
              style={{ background: 'hsl(var(--background) / 0.05)' }}
              animate={{
                x: [0, -30, 0],
                y: [0, 50, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Content */}
          <div className="relative px-8 py-16 sm:px-12 sm:py-20 lg:px-16">
            <div className="text-center max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 border border-background/20 text-xs font-medium text-background/90 mb-6 backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3" />
                Easy to use
              </motion.div>

              <motion.h2
                className="text-3xl sm:text-4xl font-light text-background mb-4 tracking-tight"
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
              >
                Ready to see what you're really earning?
              </motion.h2>

              <motion.p
                className="text-base text-background/75 mb-8 max-w-lg mx-auto"
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
                <Magnetic intensity={0.5}>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-8 text-sm font-medium bg-background text-foreground hover:bg-background/90 shadow-xl shadow-black/20 transition-all duration-300 gap-2"
                    onClick={() => posthog.capture('get_started_cta_clicked', { location: 'cta_section' })}
                  >
                    <Link href="/dashboard" aria-label="Get started with Vizvest dashboard">
                      Get Started Now
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </Magnetic>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
