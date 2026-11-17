import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/metadata'
import { DashboardHeader } from '@/components/features/dashboard-header'

export const metadata: Metadata = pageMetadata({
  title: 'Trading 212 Portfolio Analyser: Upload Your CSV | Vizvest',
  socialTitle: 'Analyse your Trading 212 portfolio',
  description:
    'Upload your Trading 212 CSV export to see holdings, dividends, realised profit, fees and trading activity. Free, no account, and the file never leaves your browser.',
  path: '/dashboard',
})

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
