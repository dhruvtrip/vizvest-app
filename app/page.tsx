'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { CSVUpload } from '@/components/features/csv-upload'
import { PortfolioOverview } from '@/components/features/portfolio-overview'
import { StockDetail } from '@/components/features/stock-detail'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { normalizeAllTransactions } from '@/lib/currency-normalizer'
import type { Trading212Transaction, NormalizedTransaction } from '@/types/trading212'

export default function Home() {
  // Core state
  const [rawTransactions, setRawTransactions] = useState<Trading212Transaction[]>([])
  const [normalizedTransactions, setNormalizedTransactions] = useState<NormalizedTransaction[]>([])
  const [baseCurrency, setBaseCurrency] = useState<string>('USD')
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  // Loading and error states
  const [isNormalizing, setIsNormalizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Normalize transactions when rawTransactions changes
  useEffect(() => {
    if (rawTransactions.length === 0) {
      setNormalizedTransactions([])
      setBaseCurrency('USD')
      return
    }

    setIsNormalizing(true)
    setError(null)

    try {
      const normalized = normalizeAllTransactions(rawTransactions)
      const detected = normalized[0]?.detectedBaseCurrency || 'USD'

      setNormalizedTransactions(normalized)
      setBaseCurrency(detected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to normalize transactions')
      setNormalizedTransactions([])
    } finally {
      setIsNormalizing(false)
    }
  }, [rawTransactions])

  // Handler: CSV data parsed
  const handleDataParsed = useCallback((data: Trading212Transaction[]) => {
    setRawTransactions(data)
    setSelectedTicker(null)
    setError(null)
  }, [])

  // Handler: Select a stock ticker
  const handleSelectTicker = useCallback((ticker: string) => {
    setSelectedTicker(ticker)
  }, [])

  // Handler: Back to portfolio overview
  const handleBackToOverview = useCallback(() => {
    setSelectedTicker(null)
  }, [])

  // Derived view states
  const hasData = normalizedTransactions.length > 0
  const showOverview = hasData && !selectedTicker
  const showDetail = hasData && selectedTicker !== null
  const showWelcome = !hasData && !isNormalizing

  return (
    <main className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Vizvest</h1>
        <p className="text-xl text-muted-foreground">
          Trading 212 Portfolio Analysis & Visualization
        </p>
        {hasData && (
          <p className="text-sm text-muted-foreground">
            Base currency: {baseCurrency}
          </p>
        )}
      </header>

      {/* CSV Upload Section */}
      <ErrorBoundary>
        <CSVUpload onDataParsed={handleDataParsed} />
      </ErrorBoundary>

      {/* Loading State */}
      {isNormalizing && (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Normalizing transactions...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stock Detail View */}
      {showDetail && selectedTicker && (
        <ErrorBoundary>
          <StockDetail
            ticker={selectedTicker}
            transactions={normalizedTransactions}
            onBack={handleBackToOverview}
          />
        </ErrorBoundary>
      )}

      {/* Portfolio Overview */}
      {showOverview && (
        <ErrorBoundary>
          <PortfolioOverview
            transactions={normalizedTransactions}
            onSelectTicker={handleSelectTicker}
          />
        </ErrorBoundary>
      )}

      {/* Getting Started Section */}
      {showWelcome && (
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
