import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-transparent px-2 py-1 text-label font-normal",
  {
    variants: {
      variant: {
        default:
          "bg-surface-4 text-foreground",
        secondary:
          "bg-surface-3 text-fg-secondary",
        destructive:
          "bg-negative/15 text-negative",
        outline: "border-border text-fg-secondary",
        positive: "bg-positive/15 text-positive",
        brand: "bg-brand/15 text-brand",
        warning: "bg-warning/15 text-warning",
        info: "bg-info/15 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
