'use client'

import Link from 'next/link'
import { ChevronRight } from '@/components/icons'
import { cn } from '@/lib/utils'

export type ArrowLinkProps = React.ComponentProps<typeof Link> & { children: React.ReactNode }

/**
 * Text link with a trailing chevron that slides and opens into an arrow on
 * hover and keyboard focus (transitions.dev "Learn more hover"). The two
 * arms are the halves of the icon-set chevron, each turning about the tip.
 */
export function ArrowLink({ className, children, ...props }: ArrowLinkProps) {
  return (
    <Link
      className={cn(
        't-learn inline-flex items-center gap-1 rounded-sm text-sm font-medium text-foreground underline-offset-4 hover:underline',
        className,
      )}
      {...props}
    >
      {children}
      <span className="t-learn-chevron" aria-hidden="true">
        <span className="grid size-4">
          <ChevronRight size={16} strokeWidth={2} className="t-learn-arm t-learn-arm-top [clip-path:inset(0_0_50%_0)] [grid-area:1/1]" />
          <ChevronRight size={16} strokeWidth={2} className="t-learn-arm t-learn-arm-bot [clip-path:inset(50%_0_0_0)] [grid-area:1/1]" />
        </span>
      </span>
    </Link>
  )
}
