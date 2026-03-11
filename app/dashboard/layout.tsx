import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

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
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/assets/logo-full-light-nobg.png"
              alt="Vizvest"
              width={150}
              height={34}
              className="h-20 w-auto dark:hidden"
              priority
            />
            <Image
              src="/assets/logo-full-dark-nobg.png"
              alt="Vizvest"
              width={150}
              height={34}
              className="hidden h-20 w-auto dark:block"
              priority
            />
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
