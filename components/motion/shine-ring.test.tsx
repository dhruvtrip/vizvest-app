import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ShineRing } from './shine-ring'

describe('ShineRing', () => {
  it('wraps the child in the shine ring surface', () => {
    render(
      <ShineRing>
        <a href="/dashboard">Try For Free</a>
      </ShineRing>
    )
    const link = screen.getByRole('link', { name: 'Try For Free' })
    expect(link.parentElement?.classList.contains('shine-ring')).toBe(true)
  })
})
