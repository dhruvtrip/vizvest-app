'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  FileSpreadsheet, 
  TrendingUp, 
  DollarSign, 
  Globe, 
  BarChart3,
  Zap,
  ArrowUpRight
} from 'lucide-react'

const features = [
  {
    icon: FileSpreadsheet,
    title: 'CSV Import',
    description: 'Drag and drop your Trading 212 export. Automatic parsing handles the rest with instant validation.',
    className: 'md:col-span-2',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    badge: 'One-click',
    showStats: true,
    stats: { value: '247', label: 'transactions parsed' }
  },
  {
    icon: TrendingUp,
    title: 'Performance',
    description: 'Track your gains and losses over time with detailed analytics.',
    className: 'md:col-span-1',
    gradient: 'from-emerald-500/10 to-green-500/10',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    showPercentage: true,
    percentage: '+24.5%'
  },
  {
    icon: DollarSign,
    title: 'Dividend Tracking',
    description: 'Monitor dividend income, yields, and payment schedules.',
    className: 'md:col-span-1',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    badge: 'Popular',
    showYield: true,
    yieldValue: '3.8%'
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Automatic currency detection and normalization for global portfolios.',
    className: 'md:col-span-2',
    gradient: 'from-cyan-500/10 to-teal-500/10',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    currencies: ['USD', 'EUR', 'GBP']
  },
  {
    icon: BarChart3,
    title: 'Stock Analysis',
    description: 'Deep dive into individual stocks with transaction history.',
    className: 'md:col-span-2',
    gradient: 'from-pink-500/10 to-rose-500/10',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    showTransactions: true,
    transactions: [
      { type: 'BUY', ticker: 'AAPL' },
      { type: 'BUY', ticker: 'MSFT' },
      { type: 'SELL', ticker: 'TSLA' },
      { type: 'BUY', ticker: 'GOOGL' },
      { type: 'SELL', ticker: 'NVDA' },
    ]
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn('group relative', feature.className)}
    >
      <Card className={cn(
        'relative h-full overflow-hidden transition-all duration-500',
        'border-border/50 hover:border-border',
        'bg-card/50 backdrop-blur-sm',
        'hover:shadow-xl hover:shadow-primary/5',
        'hover:-translate-y-1'
      )}>
        {/* Gradient overlay on hover */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          feature.gradient
        )} />
        
        {/* Animated border gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[1px] rounded-[inherit] bg-gradient-to-br from-primary/20 via-transparent to-accent/20" style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'xor', padding: '1px' }} />
        </div>

        <CardContent className="relative z-10 h-full p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                feature.iconBg,
                'group-hover:scale-110 transition-transform duration-300'
              )}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <feature.icon className={cn('w-5 h-5', feature.iconColor)} />
            </motion.div>
            {feature.badge && (
              <Badge variant="secondary" className="text-[10px] bg-muted/50 backdrop-blur-sm">
                {feature.badge}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">
              {feature.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>

          {/* Feature-specific content */}
          {feature.showStats && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">{feature.stats?.value}</span>
                <span className="text-xs text-muted-foreground mb-1">{feature.stats?.label}</span>
              </div>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '75%' }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </div>
            </div>
          )}

          {feature.showPercentage && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-500">{feature.percentage}</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
          )}

          {feature.showYield && (
            <div className="mt-4 flex items-center justify-center">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    className="text-muted/30" 
                  />
                  <motion.circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="url(#yieldGradient)" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 0.38 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="yieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-500">
                  {feature.yieldValue}
                </span>
              </div>
            </div>
          )}

          {feature.showTransactions && feature.transactions && (
            <div className="mt-4 flex flex-wrap gap-2">
              {feature.transactions.map((tx, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.3 }}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1',
                    tx.type === 'BUY' 
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  )}
                >
                  <span>{tx.type}</span>
                  <span className="text-muted-foreground font-mono">{tx.ticker}</span>
                </motion.div>
              ))}
            </div>
          )}

          {feature.currencies && (
            <div className="mt-4 flex gap-2">
              {feature.currencies.map((currency) => (
                <div key={currency} className="px-2 py-1 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground">
                  {currency}
                </div>
              ))}
            </div>
          )}

          {/* Hover arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <ArrowUpRight className="w-4 h-4 text-primary" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FeaturesBento() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-24 lg:py-32 relative" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30 dark:bg-muted/10" />
      
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
            <Zap className="w-3 h-3" />
            Features
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Everything you need to understand
            <span className="block text-primary">your investments</span>
          </h2>
          <p className="text-muted-foreground">
            Powerful features designed to give you clarity and control over your portfolio.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 auto-rows-[minmax(180px,auto)]">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
