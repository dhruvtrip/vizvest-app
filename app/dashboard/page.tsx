'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Upload, FileSpreadsheet, HelpCircle } from 'lucide-react'
import { CSVUpload } from '@/components/features/csv-upload'
import { PortfolioOverview } from '@/components/features/portfolio-overview'
import { StockDetail } from '@/components/features/stock-detail'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { normalizeAllTransactions } from '@/lib/currency-normalizer'
import type { Trading212Transaction, NormalizedTransaction } from '@/types/trading212'

export default function DashboardPage() {
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
    <main className="container mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portfolio Analysis</h1>
            <p className="text-sm text-muted-foreground">
              Trading 212 Portfolio Visualization
            </p>
          </div>
          {hasData && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground">Base currency:</span>
              <span className="text-xs font-medium">{baseCurrency}</span>
            </div>
          )}
        </div>
      </header>

      {/* CSV Upload Section */}
      <ErrorBoundary>
        <CSVUpload onDataParsed={handleDataParsed} />
      </ErrorBoundary>

      {/* Loading State */}
      {isNormalizing && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Normalizing transactions...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle className="text-sm">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm">Upload CSV</CardTitle>
                  <CardDescription className="text-xs">
                    Drag and drop your Trading 212 export
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
                <li>Open the Trading 212 app or website</li>
                <li>Navigate to your account history</li>
                <li>Look for the export or download option</li>
                <li>Select CSV format</li>
                <li>Upload the downloaded file above</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-sm">Required Columns</CardTitle>
                  <CardDescription className="text-xs">
                    Your CSV must include these fields
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {['Action', 'Ticker', 'No. of shares', 'Price / share', 'Total'].map((col) => (
                  <li key={col} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    {col}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
