'use client'

import { useRef } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Container, GridGuides } from '@/components/layout/container'
import { WordRotator } from '@/components/motion/word-rotator'
import { HeroLight } from './hero-light'
import { HeroProductFrame } from './hero-product-frame'

const ROTATING_WORDS = [
  'complete portfolio',
  'dividend income',
  'trading performance',
  'stock positions',
  'market winners',
] as const

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section ref={sectionRef} className="relative isolate overflow-clip border-b border-border">
      <HeroLight trackRef={sectionRef} />
      <GridGuides />

      <Container className="pb-24 pt-20 text-center md:pb-[136px] md:pt-28">
        <h1 className="blur-in flex flex-col items-center gap-2 px-2 text-h2-m text-foreground md:px-6 md:text-h2">
          <span>Visualize your Trading 212</span>
          <WordRotator words={ROTATING_WORDS} className="w-full justify-items-center" />
        </h1>

        <p className="blur-in blur-in-1 mx-auto mt-4 max-w-[704px] text-pretty px-2 text-p-lg text-foreground/60 md:px-6">
          Transform your Trading 212 exports into powerful insights. Track dividends, analyze performance and make
          smarter investment decisions.
        </p>

        <div className="blur-in blur-in-2 mt-8 flex justify-center gap-3">
          <Button asChild onClick={() => posthog.capture('dashboard_cta_clicked', { location: 'hero_section' })}>
            <Link href="/dashboard" aria-label="Open dashboard to analyze your portfolio">
              Open dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="#how-it-works" aria-label="Learn how Vizvest works">
              See how it works
            </Link>
          </Button>
        </div>

        <HeroProductFrame className="mt-14 md:ml-[50%] md:mt-20 md:w-[min(1309px,calc(100vw-120px))] md:-translate-x-1/2" />
      </Container>
    </section>
  )
}
