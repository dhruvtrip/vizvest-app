import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-2.5 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-muted text-foreground",
        outline: "border-foreground/20 text-foreground",
        up: "bg-up/10 text-up",
        down: "bg-down/10 text-down",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        // For chips drawn on the dark panel.
        panel: "rounded-lg bg-white/[0.12] text-white/80 font-normal",
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
