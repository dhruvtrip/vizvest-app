'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface TemplateProps {
  children: ReactNode
}

export default function Template({ children }: TemplateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        duration: 0.3,
        ease: [0, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
