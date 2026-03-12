'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { useShallow } from 'zustand/react/shallow'

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
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <Image
            src="/assets/logo-full-light-nobg.png"
            alt="Vizvest"
            width={150}
            height={34}
            className="h-20 w-auto dark:hidden"
            priority
          />
          <Image
            src="/assets/logo-full-dark-nobg.png"
            alt="Vizvest"
            width={150}
            height={34}
            className="hidden h-20 w-auto dark:block"
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Dashboard
          </span>
          {hasData && (
            <button
              onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileSidebarOpen}
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
