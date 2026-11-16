import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Every action is a pill. Colour changes take 150ms; a press scales to 0.96.
// The ::after pad widens the touch target to 44px without changing the look.
const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent bg-clip-padding text-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-ui after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 motion-safe:[&:not(:disabled)]:active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-brand/90 hover:text-white",
        outline:
          "border-border bg-background text-foreground shadow-xs hover:bg-muted dark:border-white/15 dark:bg-[hsl(0_0%_15%/0.3)] dark:hover:bg-[hsl(0_0%_15%/0.5)]",
        glass:
          "border-foreground/20 bg-transparent text-foreground shadow-xs hover:bg-muted",
        secondary:
          "bg-muted text-foreground hover:bg-tile-hover",
        ghost:
          "text-foreground hover:bg-muted",
        quiet:
          "rounded-md text-foreground hover:text-muted-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link:
          "rounded-none text-foreground underline-offset-4 hover:underline",
        light:
          "bg-white text-black hover:bg-white/85",
        "outline-light":
          "border-white/25 bg-transparent text-white hover:bg-white/10",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[0.8125rem]",
        lg: "h-10 px-5",
        xl: "h-11 px-6 text-base",
        icon: "size-9 p-0",
        "icon-sm": "size-8 p-0",
        bare: "h-auto p-0",
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
