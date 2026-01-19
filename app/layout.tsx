import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { PostHogProvider } from '@/app/providers/ph-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vizvest - Portfolio Analysis',
  description: 'Visualize and analyze your trading portfolio with powerful insights. Track dividends, monitor performance, and make smarter investment decisions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {/* Sticky Theme Toggle */}
            <div className="fixed bottom-6 right-6 z-50">
              <ThemeToggle />
            </div>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
