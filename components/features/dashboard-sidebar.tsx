'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Activity,
  HandCoins,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  X
} from '@/components/icons'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { DASHBOARD_MENU_BUTTON_ID } from './dashboard-header'

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

const NAV_ICONS: Record<string, React.ElementType> = {
  upload: Upload,
  portfolio: LayoutDashboard,
  dividends: HandCoins,
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

const itemBase =
  'flex h-10 w-full items-center gap-3 rounded-full px-3 text-left text-sm transition-colors duration-150 ease-ui'
const itemIdle = 'text-muted-foreground hover:bg-muted hover:text-foreground'
const itemActive = 'bg-muted font-medium text-foreground'

function NavItem ({
  option,
  showLabel,
  withTooltip
}: {
  option: SidebarOption
  showLabel: boolean
  withTooltip: boolean
}) {
  const Icon = NAV_ICONS[option.id]
  const isActive = option.isActive || false

  const button = (
    <button
      type="button"
      onClick={option.onClick}
      className={cn(itemBase, isActive ? itemActive : itemIdle)}
      aria-label={option.label}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && <Icon size={16} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />}
      <span
        className={cn(
          'whitespace-nowrap transition-opacity duration-150 ease-ui',
          showLabel ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden={!showLabel || undefined}
      >
        {option.label}
      </span>
    </button>
  )

  if (!withTooltip) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{option.label}</TooltipContent>
    </Tooltip>
  )
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
    posthog.capture('upload_another_file_clicked', { location: 'sidebar' })
    uploadAnother()
  }

  const options: SidebarOption[] = [
    {
      id: 'upload',
      label: 'Upload',
      onClick: () => handleOptionClick(handleUploadClick)
    },
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
      label: 'Trading activity',
      onClick: () => handleOptionClick(() => handleNavigate('activity')),
      isActive: currentView === 'activity'
    }
  ]

  // The drawer only exists below lg. Resizing past lg closes it.
  const drawerOpen = isMobileOpen && !isDesktop

  return (
    <TooltipProvider delayDuration={300}>
      {/* Desktop: sticky rail under the header, collapsible to icons. */}
      <nav
        aria-label="Dashboard views"
        className={cn(
          'sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 flex-col self-start overflow-hidden border-r border-border bg-background lg:flex',
          'transition-[width] duration-300 ease-smooth-out',
          isOpen ? 'w-60' : 'w-16',
          className
        )}
      >
        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3">
          {options.map((option) => (
            <li key={option.id}>
              <NavItem option={option} showLabel={isOpen} withTooltip={!isOpen} />
            </li>
          ))}
        </ul>

        <div className="border-t border-border p-3">
          {(() => {
            const toggle = (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(itemBase, itemIdle)}
                aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-expanded={isOpen}
              >
                {isOpen
                  ? <PanelLeftClose size={16} aria-hidden="true" />
                  : <PanelLeftOpen size={16} aria-hidden="true" />}
                <span
                  className={cn(
                    'whitespace-nowrap transition-opacity duration-150 ease-ui',
                    isOpen ? 'opacity-100' : 'opacity-0'
                  )}
                  aria-hidden="true"
                >
                  Collapse
                </span>
              </button>
            )
            if (isOpen) return toggle
            return (
              <Tooltip>
                <TooltipTrigger asChild>{toggle}</TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            )
          })()}
        </div>
      </nav>

      {/* Below lg: a modal drawer. Focus is trapped inside it, Escape closes it,
          the page behind is hidden from assistive tech, and nothing of it is in
          the tab order while it is closed. */}
      <Dialog open={drawerOpen} onOpenChange={setMobileSidebarOpen}>
        <DialogPortal>
          <DialogOverlay className="lg:hidden" />
          <DialogPrimitive.Content
            id="dashboard-drawer"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              document.getElementById(DASHBOARD_MENU_BUTTON_ID)?.focus()
            }}
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[calc(100vw-3rem)] flex-col border-r border-border bg-background shadow-lift lg:hidden',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-300 data-[state=open]:ease-smooth-out',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200 data-[state=closed]:ease-ui',
              'motion-safe:data-[state=open]:slide-in-from-left motion-safe:data-[state=closed]:slide-out-to-left'
            )}
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border pe-3 ps-4">
              <DialogPrimitive.Title className="flex items-center">
                <Logo height={15} />
                <span className="sr-only">Menu</span>
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close menu">
                  <X size={20} />
                </Button>
              </DialogPrimitive.Close>
            </div>
            <nav aria-label="Dashboard views" className="flex-1 overflow-y-auto overscroll-contain p-3">
              <ul className="flex flex-col gap-1">
                {options.map((option) => (
                  <li key={option.id}>
                    <NavItem option={option} showLabel withTooltip={false} />
                  </li>
                ))}
              </ul>
            </nav>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </TooltipProvider>
  )
}
