'use client'

import { useEffect, useState } from 'react'

/**
 * Reduced-motion preference that is safe to branch on during hydration.
 * It reports `false` on the server and on the first client render, then the
 * real value, so server and client markup always match.
 */
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}
