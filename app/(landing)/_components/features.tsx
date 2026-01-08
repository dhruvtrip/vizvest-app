'use client'

import { motion } from 'framer-motion'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  Shield,
  Zap,
  Eye,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: FileSpreadsheet,
    title: 'CSV Import',
    description: 'Simply upload your Trading 212 export file and watch your data come to life.',
    gradient: 'from-electric-cyan to-electric-blue',
  },
  {
    icon: PieChart,
    title: 'Portfolio Overview',
    description: 'See your complete portfolio breakdown with interactive charts and allocations.',
    gradient: 'from-electric-blue to-electric-purple',
  },
  {
    icon: TrendingUp,
    title: 'Performance Tracking',
    description: 'Track your gains, losses, and overall portfolio performance over time.',
    gradient: 'from-electric-purple to-electric-pink',
  },
  {
    icon: DollarSign,
    title: 'Dividend Analysis',
    description: 'Monitor your dividend income and projected annual yield from each holding.',
    gradient: 'from-electric-pink to-electric-cyan',
  },
  {
    icon: BarChart3,
    title: 'Stock Details',
    description: 'Dive deep into individual stocks with transaction history and metrics.',
    gradient: 'from-electric-cyan to-electric-purple',
  },
  {
    icon: Shield,
    title: '100% Private',
    description: 'Your data never leaves your browser. Everything is processed locally.',
    gradient: 'from-electric-blue to-electric-cyan',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get immediate insights without waiting. Fast, efficient processing.',
    gradient: 'from-electric-purple to-electric-blue',
  },
  {
    icon: Eye,
    title: 'Clear Visualizations',
    description: 'Beautiful, intuitive charts that make complex data easy to understand.',
    gradient: 'from-electric-cyan to-electric-pink',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
}

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-dot-pattern bg-dot-md opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-electric-cyan font-medium text-sm tracking-wider uppercase">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Everything you need to{' '}
            <span className="text-gradient">understand your investments</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful tools designed to give you complete visibility into your Trading 212 portfolio.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="group relative h-full glass-card hover:shadow-glow-sm transition-all duration-300 overflow-hidden">
                {/* Gradient Border on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-10`} />
                </div>
                
                <CardContent className="relative p-6 space-y-4">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-10`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
