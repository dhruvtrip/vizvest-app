'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useTransform, animate, motion } from 'framer-motion'

interface AnimatedCurrencyProps {
  amount: number
  currency: string
  formatFn: (amount: number, currency: string) => string
  className?: string
}

export function AnimatedCurrency({ amount, currency, formatFn, className }: AnimatedCurrencyProps) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => formatFn(v, currency))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(motionValue, amount, {
      duration: 0.5,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [motionValue, amount])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return () => unsubscribe()
  }, [display])

  return (
    <motion.span ref={ref} className={className}>
      {formatFn(0, currency)}
    </motion.span>
  )
}

interface AnimatedCountProps {
  value: number
  className?: string
}

export function AnimatedCount({ value, className }: AnimatedCountProps) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => Math.round(v).toString())
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.5,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [motionValue, value])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return () => unsubscribe()
  }, [display])

  return (
    <motion.span ref={ref} className={className}>
      0
    </motion.span>
  )
}
