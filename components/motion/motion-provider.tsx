'use client'

import { MotionConfig } from 'framer-motion'

/** Makes every framer-motion animation respect the OS reduced-motion setting. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
