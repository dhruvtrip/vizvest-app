'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import {
  Upload,
  LayoutDashboard,
  Coins,
  Activity,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DUR, EASE } from '@/lib/motion'
import { useDashboardStore } from '@/stores/useDashboardStore'

function scrollToTop () {
  const mainElement = document.querySelector('main')
  if (mainElement) {
    mainElement.scrollTo({ top: 0, behavior: 'smooth' })
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const NAV_ICONS: Record<string, React.ElementType> = {
  upload: Upload,
  portfolio: LayoutDashboard,
  dividends: Coins,
  activity: Activity
}

interface SidebarOption {
  id: string
  label: string
  onClick: () => void
  isActive?: boolean
}

interface DashboardSidebarProps {
  className?: string
}

/** One sidebar row: 36px, 8px radius, 16px icon, 14px label */
function SidebarItem ({
  icon: Icon,
  label,
  isActive = false,
  expanded,
  onClick,
  ariaLabel,
  ariaExpanded
}: {
  icon: React.ElementType
  label: string
  isActive?: boolean
  expanded: boolean
  onClick: () => void
  ariaLabel: string
  ariaExpanded?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-9 w-full items-center gap-3 overflow-hidden rounded-lg px-3 text-left text-p-sm',
        'transition-[color,background-color] duration-150 ease-out',
        isActive
          ? 'bg-accent text-foreground'
          : 'text-fg-secondary hover:bg-white/5 hover:text-foreground'
      )}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={ariaExpanded}
      title={expanded ? undefined : label}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span
        className={cn(
          'truncate whitespace-nowrap transition-opacity duration-150 ease-out',
          // Desktop collapsed: the label fades out while the width closes
          !expanded && 'lg:opacity-0'
        )}
      >
        {label}
      </span>
    </button>
  )
}

export function DashboardSidebar (props: DashboardSidebarProps = {}) {
  const { className } = props
  const [isOpen, setIsOpen] = useState(true)
  const currentView = useDashboardStore((state) => state.currentView)
  const isMobileOpen = useDashboardStore((state) => state.isMobileSidebarOpen)
  const navigate = useDashboardStore((state) => state.navigate)
  const uploadAnother = useDashboardStore((state) => state.uploadAnother)
  const setMobileSidebarOpen = useDashboardStore((state) => state.setMobileSidebarOpen)

  // Escape closes the mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMobileOpen, setMobileSidebarOpen])

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
    posthog.capture('upload_another_file_clicked', { location: 'sidebar' })
    uploadAnother()
  }

  const views: SidebarOption[] = [
    {
      id: 'portfolio',
      label: 'Portfolio',
      onClick: () => handleOptionClick(() => handleNavigate('portfolio')),
      isActive: currentView === 'portfolio'
    },
    {
      id: 'dividends',
      label: 'Dividends',
      onClick: () => handleOptionClick(() => handleNavigate('dividends')),
      isActive: currentView === 'dividends'
    },
    {
      id: 'activity',
      label: 'Trading Activity',
      onClick: () => handleOptionClick(() => handleNavigate('activity')),
      isActive: currentView === 'activity'
    }
  ]

  const upload: SidebarOption = {
    id: 'upload',
    label: 'Upload',
    onClick: () => handleOptionClick(handleUploadClick)
  }

  // Labels are always visible in the mobile drawer
  const expanded = isOpen

  return (
    <>
      {/* Mobile scrim */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: DUR.fast, ease: EASE.smoothOut } }}
            exit={{ opacity: 0, transition: { duration: DUR.quick, ease: EASE.smoothOut } }}
            className="fixed inset-0 top-header z-40 overscroll-contain bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <nav
        aria-label="Dashboard views"
        className={cn(
          // Mobile: drawer under the header, slides in from the left
          'fixed bottom-0 left-0 top-header z-50 flex w-64 flex-col overflow-hidden overscroll-contain',
          'border-r border-border bg-background',
          'transition-[transform,width] duration-[250ms] ease-smooth-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto',
          // Desktop: sticky column with an animated width
          'lg:sticky lg:top-header lg:z-auto lg:h-[calc(100dvh-3.5rem)] lg:shrink-0 lg:translate-x-0 lg:self-start',
          expanded ? 'lg:w-60' : 'lg:w-16',
          className
        )}
      >
        {/* Views */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3">
          {views.map((option) => (
            <SidebarItem
              key={option.id}
              icon={NAV_ICONS[option.id]}
              label={option.label}
              isActive={option.isActive}
              expanded={expanded}
              onClick={option.onClick}
              ariaLabel={option.label}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1 border-t border-border p-3">
          <SidebarItem
            icon={NAV_ICONS.upload}
            label="Upload"
            expanded={expanded}
            onClick={upload.onClick}
            ariaLabel={upload.label}
          />
          <div className="hidden lg:block">
            <SidebarItem
              icon={isOpen ? PanelLeftClose : PanelLeftOpen}
              label="Collapse"
              expanded={expanded}
              onClick={() => setIsOpen(!isOpen)}
              ariaLabel={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              ariaExpanded={isOpen}
            />
          </div>
        </div>
      </nav>
    </>
  )
}
