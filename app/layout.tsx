import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vizvest - Trading 212 Analysis',
  description: 'Analyze your Trading 212 portfolio with advanced visualizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

