'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Menu, X } from '@/components/icons'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faqs' },
  { label: 'Articles', href: '/articles' },
]

const menuItem = {
  closed: { opacity: 0, x: -20 },
  open: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeInOut' as const } },
}

const COMPACT_AFTER = 50
const HIDE_AFTER = 150

/**
 * Floating pill navigation. Past 50px of scroll it tightens and gains a soft
 * shadow; scrolling down past 150px slides it away and any scroll up brings
 * it back. On small screens the links move into a panel under the pill.
 */
export function Navbar() {
  const [compact, setCompact] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y === lastY.current) return
      setCompact(y > COMPACT_AFTER)
      setHidden(y > lastY.current && y > HIDE_AFTER)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // The menu never hides while it is open.
  const isHidden = hidden && !open

  return (
    <header
      className={cn(
        'nav-enter fixed inset-x-0 top-0 z-50 transition-[opacity,transform] duration-300 ease-reveal',
        isHidden && 'pointer-events-none opacity-0 motion-safe:-translate-y-5'
      )}
      // Keep hidden links out of the tab order.
      inert={isHidden || undefined}
    >
      <div className="mx-auto w-full max-w-content px-4 pt-4">
        <div className={cn('transition-transform duration-200 ease-glide', compact && 'motion-safe:scale-[0.98]')}>
          <nav
            aria-label="Main"
            className={cn(
              'flex items-center justify-between gap-4 rounded-full border border-border bg-background/60 p-2 backdrop-blur-md transition-[box-shadow,background-color] duration-300 dark:border-[hsl(0_0%_63%/0.2)]',
              compact && 'bg-background/80 shadow-nav'
            )}
          >
            <Link href="/" aria-label="Vizvest home" className="ml-3 flex h-10 items-center rounded-md sm:ml-4">
              <Logo height={15} priority />
            </Link>

            <div className="hidden items-center gap-4 lg:flex">
              <ul className="mr-2 flex items-center gap-7 lg:gap-8">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-base font-medium transition-colors duration-150 ease-ui hover:text-muted-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ThemeToggle />
              <Button asChild size="lg">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button asChild>
                <Link href="/dashboard">
                  <span className="max-[359px]:hidden">Open dashboard</span>
                  <span className="min-[360px]:hidden">Dashboard</span>
                </Link>
              </Button>
              <Button
                ref={menuButtonRef}
                variant="ghost"
                size="icon"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpen((value) => !value)}
              >
                <span className="relative block size-5">
                  <Menu
                    size={20}
                    className={cn(
                      'absolute inset-0 transition-[opacity,transform] duration-200 ease-glide',
                      open && 'opacity-0 motion-safe:rotate-90'
                    )}
                  />
                  <X
                    size={20}
                    className={cn(
                      'absolute inset-0 transition-[opacity,transform] duration-200 ease-glide',
                      !open && 'opacity-0 motion-safe:-rotate-90'
                    )}
                  />
                </span>
              </Button>
            </div>
          </nav>
        </div>

        {/* Small-screen menu: the panel opens to its content height, then the links slide in one by one. */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="mobile-menu"
              key="mobile-menu"
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeOut' } }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden lg:hidden"
            >
              <motion.div
                initial="closed"
                animate="open"
                variants={{ closed: {}, open: { transition: { staggerChildren: 0.05 } } }}
                className="mt-2 flex flex-col gap-1 rounded-2xl border border-border bg-background p-3 shadow-nav"
              >
                {navLinks.map((link) => (
                  <motion.div key={link.label} variants={menuItem}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex rounded-lg px-4 py-3 font-medium transition-colors duration-150 ease-ui hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div variants={menuItem} className="my-2 border-t border-border" />
                <motion.div variants={menuItem} className="flex items-center justify-between gap-2 px-4 pb-1">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
