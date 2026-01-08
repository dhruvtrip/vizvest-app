import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Vizvest - Trading 212 Portfolio Analysis',
  description: 'Analyze your Trading 212 portfolio with advanced visualizations and insights. Track performance, dividends, and make data-driven decisions.',
  keywords: ['trading', 'portfolio', 'analysis', 'Trading 212', 'stocks', 'dividends', 'investment'],
  authors: [{ name: 'Vizvest' }],
  openGraph: {
    title: 'Vizvest - Trading 212 Portfolio Analysis',
    description: 'Analyze your Trading 212 portfolio with advanced visualizations and insights.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
