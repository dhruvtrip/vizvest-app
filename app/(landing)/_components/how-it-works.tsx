'use client'

import { motion } from 'framer-motion'
import { Upload, Cpu, BarChart3, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Export Your Data',
    description: 'Download your transaction history as a CSV file from your Trading 212 account.',
    color: 'electric-cyan',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Upload & Process',
    description: 'Drop your CSV file into Vizvest. We process everything locally in your browser.',
    color: 'electric-blue',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Analyze & Explore',
    description: 'Instantly see your portfolio breakdown, performance metrics, and dividend insights.',
    color: 'electric-purple',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
    },
  },
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-navy-900/50 to-background dark:via-navy-900/50" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid-lg opacity-20" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-glow-blue rounded-full blur-3xl opacity-10 -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-glow-purple rounded-full blur-3xl opacity-10 -translate-y-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-electric-purple font-medium text-sm tracking-wider uppercase">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            From CSV to{' '}
            <span className="text-gradient">insights in seconds</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Three simple steps to understand your portfolio better than ever before.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="max-w-4xl mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-24 w-0.5 h-20 bg-gradient-to-b from-glass-border to-transparent hidden md:block" />
              )}
              
              <div className="flex items-start gap-6 mb-12 group">
                {/* Number & Icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center group-hover:shadow-glow-sm transition-all duration-300">
                    <step.icon className={`w-7 h-7 text-${step.color}`} />
                  </div>
                  <span className={`absolute -top-2 -right-2 text-xs font-bold text-${step.color} bg-background px-2 py-0.5 rounded-full border border-glass-border`}>
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-semibold mb-3 group-hover:text-gradient transition-all duration-300">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
                    {step.description}
                  </p>
                </div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-muted-foreground/30 hidden lg:block mt-4" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Visual Demo Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-8 border border-glass-border">
            <div className="aspect-video rounded-xl bg-navy-900/50 flex items-center justify-center border border-glass-border overflow-hidden">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-electric-cyan animate-pulse" />
                  <div className="w-3 h-3 rounded-full bg-electric-blue animate-pulse animation-delay-200" />
                  <div className="w-3 h-3 rounded-full bg-electric-purple animate-pulse animation-delay-400" />
                </div>
                <p className="text-muted-foreground">
                  Interactive demo coming soon
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
