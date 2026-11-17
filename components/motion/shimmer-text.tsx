'use client'

import { Children, isValidElement } from 'react'
import { cn } from '@/lib/utils'

export interface ShimmerTextProps {
  children: React.ReactNode
  className?: string
}

/** Plain text of a React tree, worked out the same way on server and client. */
function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children)
  return Children.toArray(node).map(textOf).join('')
}

/**
 * In-progress label with a highlight band sweeping across it on a loop
 * (transitions.dev "Shimmer text", pure CSS). The text stays readable in the
 * muted colour; under reduced motion the band stays still.
 */
export function ShimmerText({ children, className }: ShimmerTextProps) {
  return (
    <span className={cn('t-shimmer', className)} data-text={textOf(children)}>
      {children}
    </span>
  )
}
