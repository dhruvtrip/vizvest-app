'use client'

import { useState, useMemo } from 'react'
import { CSVUpload } from '@/components/features/csv-upload'
import { PortfolioOverview } from '@/components/features/portfolio-overview'
import { StockDetail } from '@/components/features/stock-detail'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { normalizeAllTransactions } from '@/lib/currency-normalizer'
import type { Trading212Transaction } from '@/types/trading212'

export default function Home() {
  const [transactions, setTransactions] = useState<Trading212Transaction[]>([])
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  // Normalize transactions to base currency
  const normalizedTransactions = useMemo(
    () => normalizeAllTransactions(transactions),
    [transactions]
  )

  const handleDataParsed = (data: Trading212Transaction[]) => {
    setTransactions(data)
    setSelectedTicker(null) // Reset selection when new data is loaded
    console.log('Parsed transactions:', data)
  }

  const handleSelectTicker = (ticker: string) => {
    setSelectedTicker(ticker)
  }

  const handleBackToOverview = () => {
    setSelectedTicker(null)
  }

  return (
    <main className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Vizvest</h1>
        <p className="text-xl text-muted-foreground">
          Trading 212 Portfolio Analysis & Visualization
        </p>
      </header>

      {/* CSV Upload Section */}
      <ErrorBoundary>
        <CSVUpload onDataParsed={handleDataParsed} />
      </ErrorBoundary>

      {/* Stock Detail View */}
      {selectedTicker && normalizedTransactions.length > 0 && (
        <ErrorBoundary>
          <StockDetail
            ticker={selectedTicker}
            transactions={normalizedTransactions}
            onBack={handleBackToOverview}
          />
        </ErrorBoundary>
      )}

      {/* Portfolio Overview */}
      {!selectedTicker && normalizedTransactions.length > 0 && (
        <ErrorBoundary>
          <PortfolioOverview
            transactions={normalizedTransactions}
            onSelectTicker={handleSelectTicker}
          />
        </ErrorBoundary>
      )}

      {/* Getting Started Section */}
      {transactions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              How to export your Trading 212 data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open the Trading 212 app or website</li>
              <li>Navigate to your account history</li>
              <li>Look for the export or download option</li>
              <li>Select CSV format</li>
              <li>Upload the downloaded file above</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p className="font-medium">Required CSV Columns:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Action</li>
                <li>Ticker</li>
                <li>No. of shares</li>
                <li>Price / share</li>
                <li>Total</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
