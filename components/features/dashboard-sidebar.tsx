'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import {
  Upload,
  LayoutDashboard,
  DollarSign,
  Activity,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/useDashboardStore'

// Hook to detect if we're on desktop
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  return isDesktop
}

function scrollToTop () {
  const mainElement = document.querySelector('main')
  if (mainElement) {
    mainElement.scrollTo({ top: 0, behavior: 'smooth' })
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

interface SidebarOption {
  id: string
  label: string
  icon: React.ElementType
  onClick: () => void
  isActive?: boolean
}

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar (props: DashboardSidebarProps = {}) {
  const { className } = props
  const [isOpen, setIsOpen] = useState(true)
  const isDesktop = useIsDesktop()
  const currentView = useDashboardStore((state) => state.currentView)
  const isMobileOpen = useDashboardStore((state) => state.isMobileSidebarOpen)
  const navigate = useDashboardStore((state) => state.navigate)
  const uploadAnother = useDashboardStore((state) => state.uploadAnother)
  const setMobileSidebarOpen = useDashboardStore((state) => state.setMobileSidebarOpen)

  const handleOptionClick = (onClick: () => void) => {
    onClick()
    setMobileSidebarOpen(false)
  }

  const handleNavigate = (view: string) => {
    scrollToTop()
    navigate(view)
    if (view === 'dividends') {
      posthog.capture('dividends_dashboard_viewed')
    } else if (view === 'activity') {
      posthog.capture('trading_activity_viewed')
    }
    requestAnimationFrame(() => scrollToTop())
  }

  const handleUploadClick = () => {
    posthog.capture('upload_another_file_clicked')
    uploadAnother()
  }

  const options: SidebarOption[] = [
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      onClick: () => handleOptionClick(handleUploadClick)
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: LayoutDashboard,
      onClick: () => handleOptionClick(() => handleNavigate('portfolio')),
      isActive: currentView === 'portfolio'
    },
    {
      id: 'dividends',
      label: 'Dividends',
      icon: DollarSign,
      onClick: () => handleOptionClick(() => handleNavigate('dividends')),
      isActive: currentView === 'dividends'
    },
    {
      id: 'activity',
      label: 'Trading Activity',
      icon: Activity,
      onClick: () => handleOptionClick(() => handleNavigate('activity')),
      isActive: currentView === 'activity'
    }
  ]

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav
        initial={false}
        animate={{
          width: isDesktop ? (isOpen ? 256 : 64) : 256 // Only animate width on desktop
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          // Mobile: fixed overlay, always full width (256px) when open
          'fixed inset-y-0 left-0 z-50',
          'w-64', // Fixed width on mobile
          'transform transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Disable pointer events when closed on mobile
          isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto',
          // Desktop: sticky positioning, always visible, animated width
          'lg:sticky lg:top-[3.5rem] lg:z-auto lg:translate-x-0 lg:w-auto', // Sticky on desktop
          // Desktop: always visible
          'lg:flex',
          // Common styles
          'top-[3.5rem] h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)] lg:max-h-[calc(100vh-3.5rem)]',
          'shrink-0 border-r border-border bg-background/95 lg:bg-background/80 backdrop-blur-sm',
          'flex flex-col',
          'lg:self-start', // Align to top for sticky positioning
          className
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      {/* Navigation Options */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {options.map((option) => {
          const Icon = option.icon
          const isActive = option.isActive || false

          return (
            <button
              key={option.id}
              onClick={option.onClick}
              className={cn(
                'relative flex h-11 w-full items-center rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
              aria-label={option.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="grid h-full w-12 place-content-center flex-shrink-0">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <AnimatePresence mode="wait">
                {(isOpen || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {option.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>

        {/* Toggle Button - Desktop only */}
        <div className="border-t border-border p-2 hidden lg:block">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex h-11 w-full items-center rounded-lg transition-colors',
              'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={isOpen}
          >
            <div className="grid h-full w-12 place-content-center flex-shrink-0">
              {isOpen ? (
                <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronsRight className="h-4 w-4" aria-hidden="true" />
              )}
            </div>
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>
    </>
  )
}
