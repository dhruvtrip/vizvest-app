'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, BarChart2, LineChart, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your data',
    description: 'Export your transaction history from Trading 212 as a CSV file.',
    points: [
      'Supports CSV export format',
      'Drag and drop upload',
      'Instant validation',
    ],
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
    iconColor: 'text-blue-500',
  },
  {
    number: '02',
    icon: BarChart2,
    title: 'Explore insights',
    description: 'Get an instant overview with beautiful visualizations.',
    points: [
      'Allocation breakdown',
      'Performance charts',
      'Dividend tracking',
    ],
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-500',
  },
  {
    number: '03',
    icon: LineChart,
    title: 'Track performance',
    description: 'Drill down into individual stocks and monitor trends.',
    points: [
      'Stock analysis',
      'Transaction history',
      'P/L calculations',
    ],
    gradient: 'from-emerald-500 to-green-500',
    bgGradient: 'from-emerald-500/10 to-green-500/10',
    iconColor: 'text-emerald-500',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

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
          >
            <Wrench className="w-3 h-3" />
            How it works
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Get started in minutes
          </h2>
          <p className="text-muted-foreground">
            No account required, no data stored on servers. Your privacy is our priority.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-24 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500/50 via-violet-500/50 to-emerald-500/50"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.5, duration: 1 }}
              style={{ transformOrigin: 'left' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.15, duration: 0.5 }}
              >
                <Card className={cn(
                  'h-full overflow-hidden transition-all duration-500',
                  'border-border/50 hover:border-border',
                  'bg-card/50 backdrop-blur-sm',
                  'hover:shadow-xl hover:shadow-primary/5',
                  'hover:-translate-y-1 group'
                )}>
                  {/* Gradient overlay on hover */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    step.bgGradient
                  )} />

                  <CardContent className="relative z-10 p-6">
                    {/* Step indicator */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        'bg-gradient-to-br',
                        step.bgGradient,
                        'group-hover:scale-110 transition-transform duration-300'
                      )}>
                        <step.icon className={cn('w-6 h-6', step.iconColor)} />
                      </div>
                      <span className={cn(
                        'text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent opacity-30',
                        step.gradient
                      )}>
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Bullet points */}
                    <ul className="space-y-2">
                      {step.points.map((point, i) => (
                        <motion.li 
                          key={point}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                          initial={{ opacity: 0, x: -10 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.5 + index * 0.15 + i * 0.1 }}
                        >
                          <div className={cn(
                            'w-1.5 h-1.5 rounded-full bg-gradient-to-r',
                            step.gradient
                          )} />
                          <span>{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
