import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { MetalRing, parseMetalTone } from './metal-ring'

describe('parseMetalTone', () => {
  it('reads a known tone from the query string', () => {
    expect(parseMetalTone('?cta=silver')).toBe('silver')
    expect(parseMetalTone('?cta=chromatic')).toBe('chromatic')
    expect(parseMetalTone('?cta=gold')).toBe('gold')
  })

  it('falls back to gold for a missing or unknown tone', () => {
    expect(parseMetalTone('')).toBe('gold')
    expect(parseMetalTone('?cta=blue')).toBe('gold')
    expect(parseMetalTone('?x=1')).toBe('gold')
  })
})

describe('MetalRing', () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the reduced-motion hook needs one.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('renders the child link while metal-fx is unavailable', () => {
    render(
      <MetalRing tone="gold">
        <a href="/dashboard">Try For Free</a>
      </MetalRing>
    )
    const link = screen.getByRole('link', { name: 'Try For Free' })
    expect(link).toHaveProperty('href', expect.stringContaining('/dashboard'))
  })
})
