import * as React from 'react'
import { cn } from '@/lib/utils'

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height in px. Size classes (`size-4`) override it. */
  size?: number
  /**
   * Rendered stroke in px. It does not scale with the icon, so a 16px and a
   * 24px icon carry the same line weight. Use 1.5 beside light or regular
   * text and 2 beside medium or semibold text.
   */
  strokeWidth?: number
}

export type Icon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>

export function createIcon(displayName: string, paths: React.ReactNode): Icon {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 16, strokeWidth = 1.5, className, ...props }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={props['aria-label'] ? undefined : true}
        focusable="false"
        className={cn('icon shrink-0', className)}
        {...props}
      >
        {paths}
      </svg>
    )
  )
  Component.displayName = displayName
  return Component
}
