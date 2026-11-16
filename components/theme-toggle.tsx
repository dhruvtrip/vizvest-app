"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Moon, Sun } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * Light / dark switch: a 72 by 36 pill whose knob springs between the moon
 * and the sun. Before hydration the knob follows the `dark` class, so it is
 * already on the right side on first paint.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  // Knob side, set two frames after the theme flips. Theme changes switch
  // every transition off for a frame; waiting lets the knob keep its spring.
  const [knobDark, setKnobDark] = React.useState<boolean | null>(null)

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  React.useEffect(() => {
    if (!mounted) return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setKnobDark(resolvedTheme === "dark"))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [mounted, resolvedTheme])

  const knobSide =
    knobDark === null
      ? "translate-x-[18px] dark:-translate-x-[18px]"
      : knobDark
        ? "-translate-x-[18px]"
        : "translate-x-[18px]"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-[4.5rem] shrink-0 items-center justify-center rounded-full border border-border bg-background/80 px-2 transition-[background-color,border-color] duration-150 ease-ui",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute size-7 rounded-full bg-muted shadow-[0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)] motion-safe:transition-transform motion-safe:duration-355 motion-safe:ease-spring dark:bg-tile-hover",
          knobSide
        )}
      />
      <span className="relative z-10 flex w-full items-center justify-between">
        <Moon
          size={16}
          className="opacity-35 transition-opacity duration-200 dark:text-amber dark:opacity-100"
        />
        <Sun
          size={16}
          className="transition-opacity duration-200 dark:opacity-35"
        />
      </span>
    </button>
  )
}
