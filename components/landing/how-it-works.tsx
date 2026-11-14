'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Container, GridGuides } from '@/components/layout/container'
import { SectionHeader } from '@/components/layout/section-header'
import { DUR, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { ExploreStepVisual, TrackStepVisual, UploadStepVisual } from './feature-step-visuals'
import { Reveal, useReducedMotionSafe } from './feature-kit'

const steps = [
  {
    number: '01',
    label: 'Upload',
    title: 'Upload your data',
    description:
      'Export your Trading 212 transaction history as a CSV and drop it in. Supports drag-and-drop with instant validation.',
    Visual: UploadStepVisual,
  },
  {
    number: '02',
    label: 'Explore',
    title: 'Explore insights',
    description:
      'Get an instant overview of allocation, performance charts and dividend tracking, all built automatically.',
    Visual: ExploreStepVisual,
  },
  {
    number: '03',
    label: 'Track',
    title: 'Track performance',
    description: 'Drill into individual stocks, review transaction history, and watch P/L evolve over time.',
    Visual: TrackStepVisual,
  },
]

const AUTO_ADVANCE_MS = 6000

/** Reference tab switch: in from x 24px + blur 6px (180ms out-quart), out to x -24px (120ms in-quad). */
function usePanelMotion() {
  const reduce = useReducedMotionSafe()
  return reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: DUR.tabIn } },
        exit: { opacity: 0, transition: { duration: DUR.tabOut } },
      }
    : {
        initial: { opacity: 0, x: 24, filter: 'blur(6px)' },
        animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: DUR.tabIn, ease: EASE.outQuart } },
        exit: { opacity: 0, x: -24, transition: { duration: DUR.tabOut, ease: EASE.inQuad } },
      }
}

export function HowItWorks() {
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const inView = useInView(gridRef, { amount: 0.4 })
  const reduce = useReducedMotionSafe()
  const panelMotion = usePanelMotion()

  // Auto-advance until the visitor picks a step; paused off-screen and under reduced motion
  useEffect(() => {
    if (touched || !inView || reduce) return
    const id = setInterval(() => setActive((i) => (i + 1) % steps.length), AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [touched, inView, reduce])

  const select = (i: number) => {
    setTouched(true)
    setActive(i)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = steps.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = active === last ? 0 : active + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = active === 0 ? last : active - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    select(next)
    tabRefs.current[next]?.focus()
  }

  const step = steps[active]
  const Visual = step.Visual

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="relative mt-section scroll-mt-24">
      <GridGuides className="-top-section" />
      <Container>
        <Reveal>
          <SectionHeader
            id="how-it-works-title"
            title="Get started in seconds"
            description="No account required. Everything processes in your browser."
          />
        </Reveal>

        <div ref={gridRef} className="grid grid-cols-1 border border-border md:grid-cols-2">
          {/* left: tabs + text panel */}
          <div className="flex flex-col p-6">
            <div
              role="tablist"
              aria-label="How Vizvest works"
              aria-orientation="horizontal"
              onKeyDown={onKeyDown}
              className="flex flex-wrap gap-2"
            >
              {steps.map((s, i) => {
                const selected = i === active
                return (
                  <button
                    key={s.number}
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`how-tab-${i}`}
                    aria-selected={selected}
                    aria-controls={`how-panel-${i}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(i)}
                    className={cn(
                      'inline-flex h-[38px] items-center gap-2 rounded-full border px-3 text-p-sm transition-[background-color,border-color,color] duration-200 ease-in-out active:scale-[0.97]',
                      selected
                        ? 'border-foreground bg-foreground text-black'
                        : 'border-border text-foreground hover:border-border-hover hover:bg-white/5'
                    )}
                  >
                    <span className={cn('tabular', selected ? 'text-black/55' : 'text-fg-gray')}>{s.number}</span>
                    {s.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-10 grid">
              {/* invisible copies reserve the tallest step so the layout never jumps between tabs */}
              {steps.map((s) => (
                <div key={s.number} aria-hidden="true" className="invisible [grid-area:1/1]">
                  <p className="text-p-lg">{s.title}</p>
                  <p className="mt-2 max-w-[440px] text-pretty text-p-lg">{s.description}</p>
                </div>
              ))}
              <AnimatePresence initial={false}>
                <motion.div
                  key={active}
                  role="tabpanel"
                  id={`how-panel-${active}`}
                  aria-labelledby={`how-tab-${active}`}
                  className="[grid-area:1/1]"
                  {...panelMotion}
                >
                  <h3 className="text-p-lg text-foreground">{step.title}</h3>
                  <p className="mt-2 max-w-[440px] text-pretty text-p-lg text-fg-secondary">{step.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* step progress: fills over the auto-advance interval, static once the visitor picks a step */}
            <div aria-hidden="true" className="mt-10 flex gap-1 md:mt-auto">
              {steps.map((s, i) => {
                const playing = i === active && !touched && !reduce && inView
                const full = i < active || (i === active && !playing)
                return (
                  <span key={`${s.number}-${i === active ? active : 'x'}`} className="h-0.5 flex-1 overflow-hidden rounded-full bg-surface-4">
                    <span
                      className={cn('block h-full origin-left rounded-full', i <= active ? 'bg-foreground' : 'bg-transparent')}
                      style={{
                        transform: full ? 'scaleX(1)' : playing ? undefined : 'scaleX(0)',
                        animation: playing ? `how-progress ${AUTO_ADVANCE_MS}ms linear both` : undefined,
                      }}
                    />
                  </span>
                )
              })}
            </div>
            <style>{'@keyframes how-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>
          </div>

          {/* right: product visual for the active step */}
          <div
            aria-hidden="true"
            className="relative grid h-[400px] select-none overflow-hidden border-t border-border md:h-[440px] md:border-l md:border-t-0"
          >
            <AnimatePresence initial={false}>
              <motion.div key={active} className="relative [grid-area:1/1]" {...panelMotion}>
                <Visual />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  )
}
