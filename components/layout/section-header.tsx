import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  /** Right-aligned slot (link, controls) */
  action?: React.ReactNode
  as?: 'h1' | 'h2'
  className?: string
  id?: string
}

/**
 * Section header block: 24px inset from the grid lines, 56px below.
 * No eyebrow above the heading; hierarchy comes from size and grey steps.
 */
export function SectionHeader({ title, description, action, as: Heading = 'h2', className, id }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-6 px-6 pb-10 pt-6 md:flex-row md:items-end md:justify-between md:gap-10 md:pb-14', className)}>
      <div>
        <Heading id={id} className="max-w-[672px] text-h2-m text-foreground md:text-h2">
          {title}
        </Heading>
        {description ? (
          <p className="mt-4 max-w-[504px] text-pretty text-p-lg text-fg-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
