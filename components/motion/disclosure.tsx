'use client'

import { createContext, useCallback, useContext, useId, useMemo, useState } from 'react'
import { ChevronDown } from '@/components/icons'
import { cn } from '@/lib/utils'

interface DisclosureContextValue {
  isOpen: (value: string) => boolean
  toggle: (value: string) => void
}

const DisclosureContext = createContext<DisclosureContextValue | null>(null)

function toList(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export interface DisclosureGroupProps {
  /** `single`: opening one item closes the others. */
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
  children: React.ReactNode
}

/** Holds which `Disclosure` items are open. Uncontrolled. */
export function DisclosureGroup({ type = 'single', defaultValue, className, children }: DisclosureGroupProps) {
  const [open, setOpen] = useState<string[]>(() => {
    const list = toList(defaultValue)
    return type === 'single' ? list.slice(0, 1) : list
  })

  const toggle = useCallback(
    (value: string) => {
      setOpen((current) => {
        if (current.includes(value)) return current.filter((item) => item !== value)
        return type === 'single' ? [value] : [...current, value]
      })
    },
    [type],
  )

  const context = useMemo<DisclosureContextValue>(
    () => ({ isOpen: (value) => open.includes(value), toggle }),
    [open, toggle],
  )

  return (
    <DisclosureContext.Provider value={context}>
      <div className={className}>{children}</div>
    </DisclosureContext.Provider>
  )
}

export interface DisclosureProps {
  value: string
  title: React.ReactNode
  children: React.ReactNode
  headingLevel?: 2 | 3 | 4
  className?: string
}

/**
 * Header with a collapsible body (transitions.dev "Accordion expand"): the
 * body grows through grid rows and the chevron flips. Closed bodies are
 * inert, so they leave the tab order and the accessibility tree.
 * Works inside a `DisclosureGroup` or on its own.
 */
export function Disclosure({ value, title, children, headingLevel = 3, className }: DisclosureProps) {
  const group = useContext(DisclosureContext)
  const [ownOpen, setOwnOpen] = useState(false)
  const open = group ? group.isOpen(value) : ownOpen
  const toggle = () => (group ? group.toggle(value) : setOwnOpen((current) => !current))

  const id = useId()
  const headId = `${id}-head`
  const panelId = `${id}-panel`
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'

  return (
    <div
      className={cn('t-acc border-border [&:not(:last-child)]:border-b', className)}
      data-open={open ? 'true' : 'false'}
    >
      <Heading className="m-0 text-base font-medium">
        <button
          type="button"
          id={headId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
          className="t-acc-head flex min-h-9 w-full rounded-md items-center justify-between gap-4 py-4 text-left text-base font-medium"
        >
          <span className="min-w-0">{title}</span>
          <span className="t-acc-chevron shrink-0 text-muted-foreground" aria-hidden="true">
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </button>
      </Heading>
      <div className="t-acc-panel" id={panelId} role="region" aria-labelledby={headId} inert={!open}>
        <div className="t-acc-panel-inner">
          <div className="pb-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  )
}
