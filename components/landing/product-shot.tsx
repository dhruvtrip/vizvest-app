'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export function ProductShot() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section
      ref={ref}
      className="relative -mt-20 pb-24 lg:pb-32"
      aria-label="Product preview"
    >
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl relative">
        {/* Atmospheric glow behind the frame */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute inset-x-8 top-12 bottom-12 bg-gradient-to-b from-primary/20 via-primary/10 to-accent/5 dark:from-primary/15 dark:via-primary/8 dark:to-accent/5 blur-[80px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Product frame */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.9,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30 ring-1 ring-border/50"
        >
          {/* Dashboard screenshot */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/dashboard-preview.svg"
            alt="Vizvest dashboard showing portfolio overview with buy volume, sell volume, realized P&L, dividend income, and current holdings across 12 stocks"
            className="w-full h-auto"
          />

          {/* Subtle shine overlay for depth */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none"
            aria-hidden="true"
          />
        </motion.div>
      </div>
    </section>
  )
}
