import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard | Vizvest',
  description: 'Analyze your Trading 212 portfolio with advanced visualizations',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto px-8 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-bold hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            Vizvest
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Dashboard
            </span>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
