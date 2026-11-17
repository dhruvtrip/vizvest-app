'use client'

// The root layout is replaced while this renders, so it loads the global
// styles itself and falls back to the system font through `font-sans`.
import './globals.css'
import { Button } from '@/components/ui/button'
import { CircleAlert } from '@/components/icons'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
          <CircleAlert size={24} className="text-muted-foreground" />
          <h1 className="heading-page mt-4">Something went wrong</h1>
          <p className="mt-3 max-w-md text-base text-muted-foreground">
            Vizvest hit an unexpected error. Try again, and if that does not help, reload the page.
          </p>
          <Button className="mt-8" onClick={reset}>
            Try again
          </Button>
        </main>
      </body>
    </html>
  )
}
