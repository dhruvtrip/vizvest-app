import { cn } from '@/lib/utils'

/**
 * Vizvest wordmark set in the product typeface, with a small "V" mark.
 * Replaces the PNG wordmark so the whole product uses one font.
 */
export function Wordmark({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-white', className)}>
      <svg width="18" height="16" viewBox="0 0 18 16" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M0 0h2.9l5.4 16H5.4L0 0Z" fill="currentColor" />
        <path d="M3.9 0h3.7l3.6 10.6L14.6 0H18l-5.3 16H9.3L3.9 0Z" fill="currentColor" />
      </svg>
      {markOnly ? (
        <span className="sr-only">Vizvest</span>
      ) : (
        <span className="text-[17px] font-medium leading-6 tracking-[-0.4px]">Vizvest</span>
      )}
    </span>
  )
}
