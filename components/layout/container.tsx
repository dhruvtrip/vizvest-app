import { cn } from '@/lib/utils'

/** 1088px container with 16px gutters: the 1056px hairline grid lives inside it. */
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('site-container', className)} {...props} />
}

/** Dashed column guides on the grid edges. Place as first child of a `relative` section. */
export function GridGuides({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('grid-guides', className)}>
      <div className="site-container" />
    </div>
  )
}
