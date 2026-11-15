'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { Wordmark } from '@/components/layout/wordmark'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { cn } from '@/lib/utils'

/**
 * App header: 56px, sticky, 85% black with an 8px backdrop blur and one
 * hairline below. Same bar as the landing navbar, with quiet meta on the right.
 */
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
    <header className="sticky top-0 z-50 h-header border-b border-border bg-background/85 backdrop-blur-[8px]">
      <nav className="flex h-full items-center justify-between gap-4 pl-4 pr-2 sm:px-6 md:px-8 lg:px-6" aria-label="Dashboard">
        <Link
          href="/"
          aria-label="Vizvest home"
          className="-mx-1 flex items-center rounded-md px-1 py-1 transition-opacity duration-200 hover:opacity-70"
        >
          <Wordmark />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-p-sm text-fg-gray sm:inline-flex">
            <span className={cn('status-dot', !hasData && 'bg-fg-tertiary')} aria-hidden="true" />
            {hasData ? (
              <span>
                <span className="tabular text-fg-secondary">{normalizedTransactions.length.toLocaleString('en-US')}</span>{' '}
                transactions, in memory only
              </span>
            ) : (
              'No data loaded'
            )}
          </span>
          {hasData && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
              className="h-10 w-10 text-fg-secondary lg:hidden"
              aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileSidebarOpen}
            >
              {isMobileSidebarOpen ? (
                <X strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Menu strokeWidth={1.5} aria-hidden="true" />
              )}
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
