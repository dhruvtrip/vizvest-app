import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Buttons are small: 32px tall, 8px radius, 14/20 medium.
 * Hover snaps opacity to 0.7 (opacity is deliberately not transitioned),
 * press scales to 0.97, focus is a 2px white outline at 2px offset.
 * On touch devices an invisible pad extends the hit area to 44px.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-small font-medium",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-in-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
    "after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] [@media(pointer:fine)]:after:hidden",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-70",
        secondary: "bg-secondary text-secondary-foreground shadow-ring-secondary hover:opacity-70",
        outline: "border border-border bg-transparent text-foreground hover:border-border-hover hover:bg-white/5",
        ghost: "bg-transparent text-foreground hover:bg-white/5 hover:text-white",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-70",
        link: "h-auto px-0 text-fg-secondary hover:text-foreground",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 rounded-md px-2.5 text-label",
        lg: "h-10 px-4",
        icon: "h-8 w-8 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
