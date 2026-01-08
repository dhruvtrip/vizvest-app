'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Back + Logo */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <Link href="/app" className="flex items-center gap-2">
                <span className="text-xl font-bold text-gradient">Vizvest</span>
              </Link>
            </div>

            {/* Right: Theme Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-lg"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}
    </div>
  )
}
