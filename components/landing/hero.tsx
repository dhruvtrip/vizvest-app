'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/ui/magnetic'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { ArrowRight, Shield, Zap, Lock, HandCoins } from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

export function Hero() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Enhanced Background for Dark Mode */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        
        {/* Radial gradient spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),transparent)]" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />

        {/* Animated glow orbs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 dark:bg-accent/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Animated Grid Pattern */}
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.08}
        duration={4}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(700px_circle_at_center,white,transparent)]",
          "fill-primary/20 stroke-primary/20 dark:fill-primary/10 dark:stroke-primary/10",
        )}
      />

      <div className="container mx-auto px-6 relative z-10 py-20 lg:py-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isLoaded ? 'visible' : 'hidden'}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 text-xs font-medium text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Trading Portfolio Analytics
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              Visualize Your
              <span className="block text-foreground">
                Investment Portfolio
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Transform your Trading 212 exports into powerful insights. Track dividends, analyze performance, and make smarter investment decisions
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Magnetic intensity={0.3}>
              <Button asChild size="lg" className="text-sm h-11 px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 gap-2">
                <Link href="/dashboard" aria-label="Open dashboard to analyze your portfolio">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild variant="outline" size="lg" className="text-sm h-11 px-8 hover:bg-muted/50 transition-colors border-border/50 backdrop-blur-sm">
              <Link href="#how-it-works" aria-label="Learn how Vizvest works">
                Learn how it works
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-8 pt-8" role="list" aria-label="Key features">
            {[
              { icon: Zap, text: 'Instant analysis' },
              { icon: Lock, text: 'Privacy first' },
              { icon: HandCoins, text: 'Free to use' }
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
                <div className="w-8 h-8 rounded-lg bg-muted/50 dark:bg-muted/30 flex items-center justify-center" aria-hidden="true">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
