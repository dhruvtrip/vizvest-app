'use client'

import { useState, useEffect } from 'react'

export function Copyright() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  // Render nothing until client-side year is set to avoid hydration mismatch
  if (year === null) {
    return (
      <p className="text-sm text-muted-foreground">
        © Vizvest. All rights reserved.
      </p>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      © {year} Vizvest. All rights reserved.
    </p>
  )
}
