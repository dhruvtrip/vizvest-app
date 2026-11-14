'use client'

import { useEffect, useRef } from 'react'
import { Container, GridGuides } from '@/components/layout/container'
import { cn } from '@/lib/utils'

const SENTENCE = 'Trading 212 shows you what you own. Vizvest shows you how you are actually doing.'
const WORDS = SENTENCE.split(' ')
/** The first words start lit, so the sentence reads as already begun */
const LIT = 2
/** On wide screens each sentence gets its own line */
const BREAK_AFTER = WORDS.findIndex((w) => w.endsWith('.'))

const power3 = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Writes each word's colour, blur and opacity for a progress value 0..1 */
function applyWords(words: HTMLElement[], p: number) {
  const total = (words.length - 1) * 0.5 + 1.2
  words.forEach((w, i) => {
    const t = power3(clamp01((p * total - i * 0.5) / 1.2))
    // #505050 (fg-tertiary) to pure white
    w.style.color = `color-mix(in srgb, hsl(var(--primary)) ${(t * 100).toFixed(1)}%, hsl(var(--fg-tertiary)))`
    w.style.filter = t >= 0.999 ? 'none' : `blur(${(8 * (1 - t)).toFixed(2)}px)`
    w.style.opacity = (0.8 + 0.2 * t).toFixed(3)
  })
}

/**
 * Sticky statement whose words sharpen from grey and blurred to white as the
 * page scrolls through a ~190vh track (scrubbed, eased toward the target).
 * Under reduced motion the sentence is fully lit and the track collapses.
 */
export function ProblemStatement() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const stick = stickRef.current
    const root = wordsRef.current
    if (!track || !stick || !root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return

    const words = Array.from(root.querySelectorAll<HTMLElement>('[data-anim]'))
    let target = 0
    let cur = 0
    let raf = 0

    const measure = () => {
      const r = track.getBoundingClientRect()
      const range = Math.max(1, r.height - stick.offsetHeight)
      // Begin a little after the sentence pins, finish before it releases
      target = clamp01((-r.top - range * 0.06) / (range * 0.78))
    }
    const tick = () => {
      cur += (target - cur) * 0.08
      if (Math.abs(target - cur) < 0.0005) cur = target
      applyWords(words, cur)
      raf = cur === target ? 0 : requestAnimationFrame(tick)
    }
    const onScroll = () => {
      measure()
      if (!raf) raf = requestAnimationFrame(tick)
    }

    measure()
    cur = target
    applyWords(words, cur)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section aria-label="Why Vizvest" className="relative">
      <GridGuides />
      <div ref={trackRef} className="h-[150vh] md:h-[min(190vh,1710px)] motion-reduce:h-auto md:motion-reduce:h-auto">
        <div
          ref={stickRef}
          className="sticky top-0 flex h-[min(100vh,900px)] items-center justify-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:py-section"
        >
          <Container>
            <p className="mx-auto max-w-[720px] px-6 text-center text-h3 text-foreground md:text-h2 lg:max-w-none">
              <span className="sr-only">{SENTENCE}</span>
              <span ref={wordsRef} aria-hidden="true">
                {WORDS.map((word, i) => {
                  const lit = i < LIT
                  return (
                    <span key={i}>
                      <span
                        data-anim={lit ? undefined : ''}
                        className={cn(
                          'inline-block will-change-[filter,opacity]',
                          lit
                            ? 'text-white'
                            : 'text-fg-tertiary opacity-80 blur-[8px] motion-reduce:text-white motion-reduce:opacity-100 motion-reduce:blur-0'
                        )}
                      >
                        {word}
                      </span>
                      {i === BREAK_AFTER ? <br className="max-lg:hidden" /> : null}
                      {i < WORDS.length - 1 ? ' ' : null}
                    </span>
                  )
                })}
              </span>
            </p>
          </Container>
        </div>
      </div>
    </section>
  )
}
