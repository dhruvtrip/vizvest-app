import { cn } from '@/lib/utils'

/**
 * Shared scaffolding for every dashboard view, so they all share one content
 * width, one header and one rhythm: 12px between tiles, 32px between regions.
 */

export function DashboardPage({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-shell px-4 py-6 sm:px-6 lg:px-8 lg:py-8', className)}>{children}</div>
  )
}

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  /** Filters or buttons, right-aligned on wide screens and wrapped under the title on narrow ones. */
  actions?: React.ReactNode
  /** Rendered above the title, for a back link. */
  before?: React.ReactNode
  className?: string
}

/** The one `h1` of a dashboard view. */
export function PageHeader({ title, description, actions, before, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {before && <div className="mb-3">{before}</div>}
        <h1 className="heading-page">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

interface RegionProps {
  /** Small uppercase label that names the region. Rendered as an `h2`. */
  label: React.ReactNode
  /** Short note or control on the right of the label. */
  action?: React.ReactNode
  id?: string
  className?: string
  children: React.ReactNode
}

/** A labelled group of tiles. */
export function Region({ label, action, id, className, children }: RegionProps) {
  return (
    <section aria-labelledby={id} className={cn('mt-8 first:mt-0', className)}>
      <div className="mb-2 flex min-h-6 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id={id} className="label-caps">
          {label}
        </h2>
        {action && <div className="text-xs font-normal text-muted-foreground">{action}</div>}
      </div>
      {children}
    </section>
  )
}

/** Standard grids. Figures drop columns before they clip. */
export const kpiGrid = 'grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-4'
export const kpiGridFive = 'grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-3 min-[1400px]:grid-cols-5'
export const chartGrid = 'grid gap-3 lg:grid-cols-2'
