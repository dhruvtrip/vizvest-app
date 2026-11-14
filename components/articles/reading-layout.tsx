import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container, GridGuides } from '@/components/layout/container'
import { cn } from '@/lib/utils'

/** Reading column: ~680px measure, centred on the 1056px grid, 24px inside the grid lines. */
export const MEASURE = 'mx-auto w-full max-w-[680px]'

interface ReadingHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  /** Meta row content (date, reading time, author). Rendered as a 12px grey label. */
  meta?: React.ReactNode
  /** Optional back link shown above the meta row */
  back?: { href: string; label: string }
  /** Anything below the description (e.g. tags) */
  children?: React.ReactNode
}

/**
 * Title block for long-form pages. Ends in a hairline that runs the full grid
 * width so it meets the dashed column guides.
 */
export function ReadingHeader({ title, description, meta, back, children }: ReadingHeaderProps) {
  return (
    <header className="border-b border-border px-6 pb-12 pt-10 md:pb-16 md:pt-20">
      <div className={cn(MEASURE, 'blur-in')}>
        {back ? (
          <Link
            href={back.href}
            className="group -ml-1 mb-10 inline-flex h-8 items-center gap-1 rounded-lg px-1 text-p-sm text-fg-secondary transition-[color] duration-200 ease-out hover:text-foreground md:mb-14"
          >
            <ArrowLeft
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-4 transition-transform duration-200 ease-house group-hover:-translate-x-0.5"
            />
            {back.label}
          </Link>
        ) : null}
        {meta ? <div className="tabular text-label text-fg-gray">{meta}</div> : null}
        <h1 className={cn('text-h3 text-foreground md:text-h2', meta ? 'mt-4' : null)}>{title}</h1>
        {description ? <p className="mt-5 text-pretty text-p-lg text-fg-secondary">{description}</p> : null}
        {children}
      </div>
    </header>
  )
}

/** Page shell for reading pages: grid guides, container, in-flow below the sticky navbar. */
export function ReadingShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <GridGuides />
      <Container>{children}</Container>
    </div>
  )
}

/** Body column for long-form text. First and last children lose their outer margins. */
export function ReadingBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="px-6 py-12 md:py-16">
      <div className={cn(MEASURE, '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}>{children}</div>
    </div>
  )
}
