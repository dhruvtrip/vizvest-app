'use client'

import Link from 'next/link'
import { useShallow } from 'zustand/react/shallow'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { IconSwap } from '@/components/motion'
import { Menu, X } from '@/components/icons'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { DashboardContextChips } from './dashboard-pills'

/** The drawer returns focus here when it closes. */
export const DASHBOARD_MENU_BUTTON_ID = 'dashboard-menu-button'

export function DashboardHeader() {
  const { normalizedTransactions, isMobileSidebarOpen, setMobileSidebarOpen } = useDashboardStore(
    useShallow((state) => ({
      normalizedTransactions: state.normalizedTransactions,
      isMobileSidebarOpen: state.isMobileSidebarOpen,
      setMobileSidebarOpen: state.setMobileSidebarOpen,
    }))
  )

  const hasData = normalizedTransactions.length > 0

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      <nav aria-label="Dashboard" className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Vizvest home" className="flex h-10 shrink-0 items-center rounded-md">
          <Logo height={15} priority />
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {hasData && <DashboardContextChips className="hidden lg:flex" />}
          <ThemeToggle />
          {hasData && (
            <Button
              id={DASHBOARD_MENU_BUTTON_ID}
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden"
              aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileSidebarOpen}
              aria-controls="dashboard-drawer"
            >
              <IconSwap
                swapped={isMobileSidebarOpen}
                from={<Menu size={20} />}
                to={<X size={20} />}
              />
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
