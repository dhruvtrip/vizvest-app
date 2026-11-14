'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { Wordmark } from '@/components/layout/wordmark'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faqs' },
  { label: 'Articles', href: '/articles' },
]

/**
 * Site header: a 56px sticky bar (black at 85% with an 8px backdrop blur and a
 * hairline), links centred on desktop, one primary action on the right.
 * With `banner`, a 48px privacy banner sits in the page flow under the bar.
 */
export function Navbar({ banner = false }: { banner?: boolean }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null)
  const wasOpen = useRef(false)

  const closeMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  // Focus management: first link on open, back to the menu button on close
  useEffect(() => {
    if (isMobileMenuOpen) {
      firstMenuItemRef.current?.focus()
    } else if (wasOpen.current) {
      menuButtonRef.current?.focus()
    }
    wasOpen.current = isMobileMenuOpen
  }, [isMobileMenuOpen])

  // Escape closes, Tab cycles between the menu button and the panel
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current || !menuButtonRef.current) return
      const items = [
        menuButtonRef.current,
        ...Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')),
      ]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isMobileMenuOpen])

  // The panel only exists below md: close it if the viewport grows past that
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => mq.matches && setIsMobileMenuOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [isMobileMenuOpen])

  const isCurrent = (href: string) => !href.includes('#') && (pathname === href || pathname?.startsWith(`${href}/`))

  return (
    <>
      <header className="sticky top-0 z-50">
        <div className="relative z-10 h-header border-b border-border bg-background/85 backdrop-blur-[8px]">
          <Container className="h-full">
            <nav aria-label="Main navigation" className="relative flex h-full items-center px-1 md:px-4">
              <Link
                href="/"
                aria-label="Vizvest home"
                className="flex h-8 items-center rounded-sm transition-opacity duration-200 ease-out hover:opacity-70"
              >
                <Wordmark />
              </Link>

              <ul className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center md:flex">
                {navLinks.map((link) => {
                  const current = isCurrent(link.href)
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                          'flex h-8 items-center rounded-full px-3 text-p-sm font-medium',
                          'transition-[color,background-color] duration-300 ease-out hover:text-white',
                          current ? 'text-white' : 'text-fg-gray'
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="ml-auto flex items-center gap-2">
                <Button asChild className="hidden md:inline-flex">
                  <Link href="/dashboard" aria-label="Open dashboard application">
                    Open dashboard
                  </Link>
                </Button>

                <button
                  ref={menuButtonRef}
                  type="button"
                  className="-mr-1 grid size-10 place-items-center rounded-lg text-fg-secondary transition-[color,background-color] duration-200 ease-in-out hover:bg-white/5 hover:text-white active:scale-[0.97] md:hidden"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <span className="relative size-5">
                    <Menu
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-0 size-5 transition-[opacity,transform] duration-200 ease-out',
                        isMobileMenuOpen ? 'rotate-45 scale-50 opacity-0' : 'opacity-100'
                      )}
                    />
                    <X
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-0 size-5 transition-[opacity,transform] duration-200 ease-out',
                        isMobileMenuOpen ? 'opacity-100' : '-rotate-45 scale-50 opacity-0'
                      )}
                    />
                  </span>
                </button>
              </div>
            </nav>
          </Container>
        </div>

        {/* Mobile menu: a full-width panel under the bar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                key="scrim"
                aria-hidden="true"
                className="fixed inset-x-0 bottom-0 top-header bg-background/60 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE.out }}
                onClick={closeMenu}
              />
              <motion.div
                key="panel"
                ref={panelRef}
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation menu"
                className="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--header-h))] overflow-y-auto overscroll-contain border-b border-border bg-background/90 backdrop-blur-[12px] md:hidden"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0.15 } }
                    : { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.15, ease: EASE.out } }
                }
                transition={{ duration: 0.25, ease: EASE.smoothOut }}
              >
                <Container>
                  <nav aria-label="Mobile navigation" className="pb-6">
                    <ul>
                      {navLinks.map((link, index) => {
                        const current = isCurrent(link.href)
                        return (
                          <li key={link.label} className="border-b border-border">
                            <Link
                              ref={index === 0 ? firstMenuItemRef : null}
                              href={link.href}
                              aria-current={current ? 'page' : undefined}
                              onClick={closeMenu}
                              className={cn(
                                'flex h-14 items-center justify-between px-1 text-p font-medium',
                                'transition-colors duration-150 ease-out hover:text-white',
                                current ? 'text-white' : 'text-foreground'
                              )}
                            >
                              {link.label}
                              <ArrowRight strokeWidth={1.5} className="size-4 text-fg-gray" aria-hidden="true" />
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                    <Button asChild size="lg" className="mt-6 w-full">
                      <Link href="/dashboard" onClick={closeMenu} aria-label="Open dashboard application">
                        Open dashboard
                      </Link>
                    </Button>
                  </nav>
                </Container>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {banner ? (
        <div className="relative z-40 h-banner animate-banner-enter border-b border-border bg-background/85 backdrop-blur-[8px]">
          <Container className="h-full">
            <Link
              href="/privacy"
              className="flex h-full items-center justify-center gap-2 px-1 transition-opacity duration-200 ease-out hover:opacity-50 md:px-4"
            >
              <span className="shrink-0 rounded-sm bg-brand/15 px-2 py-1 text-small text-brand">
                Private<span className="hidden sm:inline"> by design</span>
              </span>
              <span className="flex min-w-0 items-center gap-2 text-small text-foreground">
                <span className="truncate">Your CSV never leaves your browser.</span>
                <ArrowRight strokeWidth={1.5} className="size-3.5 shrink-0" aria-hidden="true" />
              </span>
            </Link>
          </Container>
        </div>
      ) : null}
    </>
  )
}
