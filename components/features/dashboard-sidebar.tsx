'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  LayoutDashboard,
  DollarSign,
  BarChart3,
  Activity,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarOption {
  id: string
  label: string
  icon: React.ElementType
  onClick: () => void
  isActive?: boolean
}

interface DashboardSidebarProps {
  onNavigate: (view: string) => void
  currentView?: string
  onUploadClick: () => void
  className?: string
}

export function DashboardSidebar({
  onNavigate,
  currentView = 'portfolio',
  onUploadClick,
  className
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  const options: SidebarOption[] = [
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      onClick: onUploadClick
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: LayoutDashboard,
      onClick: () => onNavigate('portfolio'),
      isActive: currentView === 'portfolio'
    },
    {
      id: 'dividends',
      label: 'Dividends',
      icon: DollarSign,
      onClick: () => onNavigate('dividends'),
      isActive: currentView === 'dividends'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => onNavigate('analytics'),
      isActive: currentView === 'analytics'
    },
    {
      id: 'activity',
      label: 'Trading Activity',
      icon: Activity,
      onClick: () => onNavigate('activity'),
      isActive: currentView === 'activity'
    }
  ]

  return (
    <motion.nav
      initial={false}
      animate={{
        width: isOpen ? 256 : 64
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'sticky top-0 h-[calc(100vh-3.5rem)] shrink-0 border-r border-border bg-background/80 backdrop-blur-sm',
        'flex flex-col',
        className
      )}
    >
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
                {isOpen && (
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

      {/* Toggle Button */}
      <div className="border-t border-border p-2">
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
  )
}
