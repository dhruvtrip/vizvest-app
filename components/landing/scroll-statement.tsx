'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { StockLogoField } from './stock-logo-field'

const SENTENCE = 'Trading 212 shows you what you own. Vizvest shows you how you are actually doing.'
const WORDS = SENTENCE.split(' ')
/** The first words start lit, so the sentence reads as already begun. */
const LIT = 2
const DIM_OPACITY = 0.35
const DIM_BLUR = 8
/** Lighting starts this share of a screen before the sentence pins. */
const LEAD_IN = 0.3
/** And is complete at this share of the pinned stretch. */
const LIT_BY = 0.85

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Writes each word's colour, blur and opacity for a progress of 0 to 1. */
function applyWords(words: HTMLElement[], progress: number) {
  const total = (words.length - 1) * 0.5 + 1.2
  words.forEach((word, i) => {
    const t = easeOutCubic(clamp01((progress * total - i * 0.5) / 1.2))
    word.style.color = `color-mix(in srgb, hsl(var(--foreground)) ${(t * 100).toFixed(1)}%, hsl(var(--muted-foreground)))`
    word.style.filter = t >= 0.999 ? 'none' : `blur(${(DIM_BLUR * (1 - t)).toFixed(2)}px)`
    word.style.opacity = (DIM_OPACITY + (1 - DIM_OPACITY) * t).toFixed(3)
  })
}

/**
 * A sentence that stays pinned, centred on screen, while the page scrolls
 * through a track a little taller than it.
 * Its words sharpen from grey and blurred to the text colour, one after
 * another, eased toward the scroll position. The stock logos behind it read
 * the same progress from `--p`. Under reduced motion the sentence is fully
 * lit, nothing pins and the logos stay still.
 */
export function ScrollStatement() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const stick = stickRef.current
    const root = wordsRef.current
    if (!track || !stick || !root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const words = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'))
    let target = 0
    let current = 0
    let raf = 0

    const measure = () => {
      const rect = track.getBoundingClientRect()
      const pinTop = parseFloat(getComputedStyle(stick).top) || 0
      // How far the track can travel while the sentence is pinned.
      const range = Math.max(1, rect.height - stick.offsetHeight)
      const travelled = pinTop - rect.top
      // The track is short, so the words start to light while the sentence is
      // still rising into place, and they finish before it lets go.
      const start = -window.innerHeight * LEAD_IN
      const end = range * LIT_BY
      target = clamp01((travelled - start) / (end - start))
    }
    const apply = () => {
      applyWords(words, current)
      stick.style.setProperty('--p', current.toFixed(4))
    }
    const tick = () => {
      current += (target - current) * 0.08
      if (Math.abs(target - current) < 0.0005) current = target
      apply()
      raf = current === target ? 0 : requestAnimationFrame(tick)
    }
    const onScroll = () => {
      measure()
      if (!raf) raf = requestAnimationFrame(tick)
    }

    measure()
    current = target
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section aria-label="Why Vizvest" className="relative -mx-4">
      <div ref={trackRef} className="h-[120vh] motion-reduce:h-auto md:h-[min(140vh,1200px)] md:motion-reduce:h-auto">
        <div
          ref={stickRef}
          className="sticky top-[max(12.5svh,calc(50svh-360px))] flex h-[75svh] max-h-[720px] items-center justify-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:min-h-[30rem]"
        >
          <StockLogoField />
          <p className="relative mx-auto max-w-[21rem] px-4 text-center text-3xl font-medium leading-[1.2] tracking-tight sm:max-w-lg sm:text-4xl sm:leading-[1.15] lg:max-w-2xl lg:text-[2.75rem] xl:max-w-3xl xl:text-5xl xl:leading-[1.15]">
            <span className="sr-only">{SENTENCE}</span>
            <span ref={wordsRef} aria-hidden="true">
              {WORDS.map((word, i) => (
                <span key={i}>
                  <span
                    data-word={i < LIT ? undefined : ''}
                    className={cn(
                      'inline-block will-change-[filter,opacity]',
                      i >= LIT &&
                        'text-muted-foreground opacity-[0.35] blur-[8px] motion-reduce:text-foreground motion-reduce:opacity-100 motion-reduce:blur-0'
                    )}
                  >
                    {word}
                  </span>
                  {i < WORDS.length - 1 ? ' ' : null}
                </span>
              ))}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
