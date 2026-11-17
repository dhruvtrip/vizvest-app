import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Flat filled surface with no border: the building block of every dashboard
 * view (figures, charts, tables, lists). Anything nested inside a tile sits
 * on `bg-background`, never on a second tile colour.
 */
const tileVariants = cva("min-w-0 bg-tile text-foreground", {
  variants: {
    size: {
      sm: "rounded-xl p-3",
      default: "rounded-2xl p-4 sm:p-5",
      lg: "rounded-3xl p-5 sm:p-6",
      flush: "rounded-2xl",
    },
    interactive: {
      true: "cursor-pointer text-left transition-[background-color,transform] duration-150 ease-ui hover:bg-tile-hover motion-safe:active:scale-[0.99]",
      false: "",
    },
  },
  defaultVariants: {
    size: "default",
    interactive: false,
  },
})

export interface TileProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tileVariants> {
  asChild?: boolean
}

const Tile = React.forwardRef<HTMLDivElement, TileProps>(
  ({ className, size, interactive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn(tileVariants({ size, interactive }), className)}
        {...props}
      />
    )
  }
)
Tile.displayName = "Tile"

/** Title row of a tile: label on the left, optional control or note on the right. */
function TileHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2", className)}
      {...props}
    />
  )
}

function TileTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-medium leading-5", className)} {...props} />
}

function TileNote({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs font-normal leading-4 text-muted-foreground", className)} {...props} />
}

export { Tile, TileHeader, TileTitle, TileNote, tileVariants }
