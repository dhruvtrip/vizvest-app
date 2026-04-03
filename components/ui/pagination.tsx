'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Computes the list of page numbers (and ellipsis markers) to display.
 * Always shows first and last page; shows `siblingCount` pages around current.
 */
function usePaginationRange(
  totalPages: number,
  currentPage: number,
  siblingCount: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSiblingIndex > 2
  const showRightEllipsis = rightSiblingIndex < totalPages - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    // Near start — show first 5 pages
    const leftRange = Array.from({ length: 5 }, (_, i) => i + 1)
    return [...leftRange, 'ellipsis', totalPages]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    // Near end — show last 5 pages
    const rightRange = Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)
    return [1, 'ellipsis', ...rightRange]
  }

  // Middle — show siblings around current
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  )
  return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages]
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className
}: PaginationProps) {
  const range = usePaginationRange(totalPages, currentPage, siblingCount)

  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      {/* Previous */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {range.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
            aria-hidden="true"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            key={item}
            variant={item === currentPage ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0 text-xs"
            onClick={() => onPageChange(item)}
            aria-label={`Go to page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </Button>
        )
      )}

      {/* Next */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
