'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-light dark:bg-hero-dark" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid-md opacity-20" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-glow-purple rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-glow-cyan rounded-full blur-3xl opacity-20" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-[150px] md:text-[200px] font-bold leading-none text-gradient">
              404
            </h1>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Page Not Found
            </h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/">
              <Button
                size="lg"
                className="btn-gradient px-8 py-6 rounded-xl shadow-glow-md hover:shadow-glow-lg transition-all duration-300 group"
              >
                <Home className="mr-2 w-5 h-5" />
                Go Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 rounded-xl glass border-glass-border hover:bg-glass-light-medium transition-all duration-300"
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                Open Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
