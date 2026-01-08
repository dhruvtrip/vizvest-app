'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, BarChart3, TrendingUp, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-light dark:bg-hero-dark" />
      <div className="absolute inset-0 bg-hero-mesh opacity-60" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid-md opacity-30" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-glow-cyan rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-glow-purple rounded-full blur-3xl opacity-20" />

      {/* Floating Icons */}
      <motion.div
        className="absolute top-20 left-20 text-electric-cyan/20"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <BarChart3 className="w-16 h-16" />
      </motion.div>
      <motion.div
        className="absolute top-40 right-32 text-electric-purple/20"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      >
        <TrendingUp className="w-12 h-12" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-32 text-electric-blue/20"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      >
        <PieChart className="w-14 h-14" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-glass-border text-sm font-medium text-muted-foreground">
              <span className="w-2 h-2 bg-electric-cyan rounded-full animate-pulse" />
              Trading 212 Portfolio Analysis
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            <span className="text-foreground">Visualize Your</span>
            <br />
            <span className="text-gradient">Investment Journey</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
          >
            Upload your Trading 212 CSV and get instant insights into your portfolio performance, dividends, and growth trajectory.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/app">
              <Button
                size="lg"
                className="btn-gradient text-lg px-8 py-6 rounded-xl shadow-glow-md hover:shadow-glow-lg transition-all duration-300 group"
              >
                Start Analyzing
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 rounded-xl glass border-glass-border hover:bg-glass-light-medium transition-all duration-300"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Learn More
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-8 pt-12 max-w-lg mx-auto"
          >
            {[
              { value: '100%', label: 'Free' },
              { value: 'Instant', label: 'Analysis' },
              { value: 'Private', label: 'Local Data' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
