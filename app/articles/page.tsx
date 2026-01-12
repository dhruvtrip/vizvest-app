'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar, Footer } from '@/components/landing'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export default function ArticlesPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      <section className="relative min-h-[80vh] flex items-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),transparent)]" />
          
          {/* Glow orbs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-accent/20 dark:bg-accent/10 rounded-full blur-[100px]"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto text-center space-y-8"
          >
            {/* Icon */}
            <motion.div variants={fadeInUp} className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div variants={fadeInUp} className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                Articles
              </h1>
              <p className="text-xl text-primary font-medium">
                Coming Soon
              </p>
            </motion.div>

            {/* Description */}
            <motion.p 
              variants={fadeInUp}
              className="text-base text-muted-foreground/80 max-w-md mx-auto leading-relaxed"
            >
              We're working on insightful articles about portfolio management, 
              dividend investing strategies, and market analysis. Stay tuned!
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeInUp} className="pt-4">
              <Button asChild variant="outline" size="lg" className="text-sm h-11 px-8 gap-2">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
