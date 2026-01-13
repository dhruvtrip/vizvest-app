'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Upload, X } from 'lucide-react'
import { CSVUpload } from '@/components/features/csv-upload'
import { PortfolioOverview } from '@/components/features/portfolio-overview'
import { PortfolioMetrics } from '@/components/features/portfolio-metrics'
import { StockDetail } from '@/components/features/stock-detail'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { normalizeAllTransactions } from '@/lib/currency-normalizer'
import type { Trading212Transaction, NormalizedTransaction } from '@/types/trading212'

interface UploadInfo {
  fileName: string
  rowCount: number
}

export default function DashboardPage() {
  // Core state
  const [rawTransactions, setRawTransactions] = useState<Trading212Transaction[]>([])
  const [normalizedTransactions, setNormalizedTransactions] = useState<NormalizedTransaction[]>([])
  const [baseCurrency, setBaseCurrency] = useState<string>('USD')
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  // Upload state
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null)
  const [showUpload, setShowUpload] = useState(true)
  const [isAlertDismissed, setIsAlertDismissed] = useState(false)

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
  const handleDataParsed = useCallback((data: Trading212Transaction[], result: UploadInfo) => {
    setRawTransactions(data)
    setSelectedTicker(null)
    setError(null)
    setUploadInfo(result)
    setShowUpload(false)
    setIsAlertDismissed(false) // Reset dismissed state on new upload
  }, [])

  // Handler: Select a stock ticker
  const handleSelectTicker = useCallback((ticker: string) => {
    setSelectedTicker(ticker)
  }, [])

  // Handler: Back to portfolio overview
  const handleBackToOverview = useCallback(() => {
    setSelectedTicker(null)
  }, [])

  // Handler: Upload different file
  const handleUploadAnother = useCallback(() => {
    setShowUpload(true)
    setRawTransactions([])
    setNormalizedTransactions([])
    setUploadInfo(null)
    setSelectedTicker(null)
    setIsAlertDismissed(false)
  }, [])

  // Handler: Dismiss success alert
  const handleDismissAlert = useCallback(() => {
    setIsAlertDismissed(true)
  }, [])

  // Derived view states
  const hasData = normalizedTransactions.length > 0
  const showOverview = hasData && !selectedTicker
  const showDetail = hasData && selectedTicker !== null
  const showWelcome = !hasData && !isNormalizing && showUpload

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      {/* Success Alert - shows after upload */}
      <AnimatePresence>
        {uploadInfo && hasData && !isAlertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="border-b border-border bg-emerald-500/5"
          >
            <div className="container mx-auto px-6 py-3">
              <Alert className="border-emerald-500/20 bg-transparent">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <AlertDescription className="text-sm flex-1 min-w-0">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Successfully loaded {uploadInfo.rowCount} transactions
                      </span>
                      <span className="text-muted-foreground ml-2">
                        from {uploadInfo.fileName}
                      </span>
                    </AlertDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUploadAnother}
                      className="gap-1.5 text-xs h-8 text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Different File
                    </Button>
                    <button
                      onClick={handleDismissAlert}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Dismiss alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Alert>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isNormalizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-6 py-16"
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Processing transactions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Normalizing currencies and calculating positions...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-6 py-6"
          >
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome State - Upload Section */}
      {showWelcome && (
        <ErrorBoundary>
          <CSVUpload onDataParsed={handleDataParsed} isHidden={false} />
        </ErrorBoundary>
      )}

      {/* Stock Detail View */}
      <AnimatePresence mode="wait">
        {showDetail && selectedTicker && (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-6 py-6"
          >
            <ErrorBoundary>
              <StockDetail
                ticker={selectedTicker}
                transactions={normalizedTransactions}
                onBack={handleBackToOverview}
              />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Overview with Metrics */}
      <AnimatePresence mode="wait">
        {showOverview && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-6 py-6 space-y-8"
          >
            {/* Global Portfolio Metrics */}
            <ErrorBoundary>
              <PortfolioMetrics transactions={normalizedTransactions} />
            </ErrorBoundary>

            {/* Stock Positions Grid */}
            <ErrorBoundary>
              <PortfolioOverview
                transactions={normalizedTransactions}
                onSelectTicker={handleSelectTicker}
              />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Upload Component (for re-upload) */}
      {!showWelcome && !hasData && showUpload && (
        <ErrorBoundary>
          <CSVUpload onDataParsed={handleDataParsed} isHidden={false} />
        </ErrorBoundary>
      )}
    </main>
  )
}
