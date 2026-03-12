import type { Metadata } from 'next'
import { DashboardHeader } from '@/components/features/dashboard-header'

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
      <DashboardHeader />
      {children}
    </div>
  )
}
