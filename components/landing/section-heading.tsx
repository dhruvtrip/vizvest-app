import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  title: React.ReactNode
  description?: React.ReactNode
  id?: string
  /** Use on the dark panel, where the text is always light. */
  onPanel?: boolean
  className?: string
}

/** Centred section title with an optional one-line description. No label above it. */
export function SectionHeading({ title, description, id, onPanel = false, className }: SectionHeadingProps) {
  return (
    <div className={cn('mx-auto flex max-w-2xl flex-col items-center text-center', className)}>
      <h2 id={id} className={cn('heading-section', onPanel && 'text-white')}>
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-base sm:text-lg sm:leading-7', onPanel ? 'text-white/70' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  )
}
