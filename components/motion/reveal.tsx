'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE_REVEAL = [0.25, 0.46, 0.45, 0.94] as const
const EASE_SETTLE = [0, 0, 0.58, 1] as const

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'whileInView' | 'viewport'> {
  /** Seconds to wait before the reveal starts. */
  delay?: number
  /** 600ms with a softer curve, for a block that should land after its neighbours. */
  slow?: boolean
}

/**
 * Section reveal: fade in and rise 20px, once, when 15% is on screen.
 * Under reduced motion the rise is dropped and the fade stays.
 */
export function Reveal({ delay = 0, slow = false, className, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: slow ? 0.6 : 0.5, ease: slow ? EASE_SETTLE : EASE_REVEAL, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface PopGroupProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'whileInView' | 'viewport' | 'variants'> {
  /** Seconds between each child. */
  stagger?: number
}

/** Parent for `PopItem`s: children fade and scale in one after another, once. */
export function PopGroup({ stagger = 0.1, className, children, ...props }: PopGroupProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function PopItem({ className, children, ...props }: Omit<HTMLMotionProps<'div'>, 'variants'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        shown: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE_SETTLE } },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
