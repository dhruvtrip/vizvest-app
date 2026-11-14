'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { DUR, EASE, STAGGER } from '@/lib/motion'

type RevealProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'whileInView'> & {
  /** Delay in seconds */
  delay?: number
  /** Soft variant: 900ms, 12px, 3px blur. For large blocks such as charts and tables. */
  soft?: boolean
  /** Animate on mount instead of when scrolled into view */
  immediate?: boolean
}

/**
 * Enter: opacity 0 to 1, blur to sharp, small rise. Runs once.
 * With reduced motion only opacity cross-fades.
 */
export function BlurReveal({ delay = 0, soft = false, immediate = false, children, ...props }: RevealProps) {
  const reduce = useReducedMotion()
  const hidden = reduce
    ? { opacity: 0 }
    : { opacity: 0, y: soft ? 12 : 24, filter: soft ? 'blur(3px)' : 'blur(8px)' }
  const shown = reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }
  const transition = { duration: soft ? 0.9 : DUR.reveal, delay, ease: EASE.house }

  return (
    <motion.div
      initial={hidden}
      {...(immediate
        ? { animate: shown }
        : { whileInView: shown, viewport: { once: true, margin: '0px 0px -10% 0px' } })}
      transition={transition}
      {...props}
    >
      {children}
    </motion.div>
  )
}

type StaggerProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'whileInView' | 'variants'> & {
  /** Seconds between children. Default 100ms. */
  stagger?: number
  delay?: number
  immediate?: boolean
}

/** Parent for a staggered entrance. Children must be <StaggerItem>. First load and into-view only. */
export function StaggerIn({ stagger = STAGGER.base, delay = 0, immediate = false, children, ...props }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      {...(immediate
        ? { animate: 'shown' }
        : { whileInView: 'shown', viewport: { once: true, margin: '0px 0px -10% 0px' } })}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, ...props }: Omit<HTMLMotionProps<'div'>, 'variants'>) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(8px)' },
        shown: reduce
          ? { opacity: 1, transition: { duration: DUR.quick } }
          : { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: DUR.reveal, ease: EASE.house } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
