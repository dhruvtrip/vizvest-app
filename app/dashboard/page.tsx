'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Upload, X, Menu } from 'lucide-react'
import { CSVUpload } from '@/components/features/csv-upload'
import { PortfolioOverview } from '@/components/features/portfolio-overview'
import { PortfolioMetrics } from '@/components/features/portfolio-metrics'
import { StockDetail } from '@/components/features/stock-detail'
import { DividendsDashboard } from '@/components/features/dividends-dashboard'
import { TradingActivityDashboard } from '@/components/features/trading-activity-dashboard'
import { DashboardSidebar } from '@/components/features/dashboard-sidebar'
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
    setShowDividendsDashboard(false)
    setShowTradingActivityDashboard(false)
    setCurrentView('portfolio')
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

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('portfolio')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showDividendsDashboard, setShowDividendsDashboard] = useState(false)
  const [showTradingActivityDashboard, setShowTradingActivityDashboard] = useState(false)
  const portfolioRef = useRef<HTMLDivElement>(null)
  const activityRef = useRef<HTMLDivElement>(null)
  const dividendsRef = useRef<HTMLDivElement>(null)

  // Derived view states
  const hasData = normalizedTransactions.length > 0
  const showOverview = hasData && !selectedTicker && !showDividendsDashboard && !showTradingActivityDashboard
  const showDetail = hasData && selectedTicker !== null && !showDividendsDashboard && !showTradingActivityDashboard
  const showWelcome = !hasData && !isNormalizing && showUpload

  // Update current view based on state
  useEffect(() => {
    if (showDividendsDashboard) {
      setCurrentView('dividends')
    } else if (showTradingActivityDashboard) {
      setCurrentView('activity')
    } else if (selectedTicker) {
      // Don't change view when viewing stock detail - keep current view
      // This allows user to see stock detail while maintaining their navigation context
    } else if (hasData) {
      setCurrentView('portfolio')
    }
  }, [showDividendsDashboard, showTradingActivityDashboard, hasData])

  // Helper: Scroll to top of main content
  const scrollToTop = useCallback(() => {
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Handler: Navigate to different sections
  const handleNavigate = useCallback((view: string) => {
    setCurrentView(view)
    setSelectedTicker(null) // Reset ticker selection when navigating
    setShowDividendsDashboard(view === 'dividends') // Show dividends dashboard when dividends is clicked
    setShowTradingActivityDashboard(view === 'activity') // Show trading activity dashboard when activity is clicked

    setTimeout(() => {
      switch (view) {
        case 'portfolio':
          setShowDividendsDashboard(false)
          setShowTradingActivityDashboard(false)
          scrollToTop()
          break
        case 'activity':
          setShowDividendsDashboard(false)
          setShowTradingActivityDashboard(true)
          setTimeout(() => {
            scrollToTop()
          }, 50)
          break
        case 'dividends':
          setShowDividendsDashboard(true)
          setShowTradingActivityDashboard(false)
          scrollToTop()
          break
      }
    }, 100)
  }, [scrollToTop])

  // Handler: Handle upload click from sidebar
  const handleUploadClick = useCallback(() => {
    handleUploadAnother()
  }, [handleUploadAnother])

  // Handler: Close mobile sidebar
  const handleMobileSidebarClose = useCallback(() => {
    setIsMobileSidebarOpen(false)
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] relative">
      {/* Mobile Menu Button - only show when data is loaded */}
      {hasData && (
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="lg:hidden fixed top-[4.5rem] right-4 z-[60] p-2.5 bg-background border border-border rounded-lg shadow-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileSidebarOpen}
        >
          <Menu className="w-5 h-5 text-foreground" aria-hidden="true" />
        </button>
      )}

      {/* Sidebar - only show when data is loaded */}
      {hasData && (
        <DashboardSidebar
          onNavigate={handleNavigate}
          currentView={currentView}
          onUploadClick={handleUploadClick}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />
      )}

      <main className="flex-1 min-w-0 w-full lg:w-auto">
        {/* Success Alert - shows after upload */}
        <AnimatePresence>
          {uploadInfo && hasData && !isAlertDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="border-b border-border bg-emerald-500/5 relative z-40"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="container mx-auto px-4 sm:px-6 py-3">
                <Alert className="border-emerald-500/20 bg-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <AlertDescription className="text-sm flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-1">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            Successfully loaded {uploadInfo.rowCount} transactions
                          </span>
                          <span className="text-muted-foreground text-xs sm:text-sm">
                            from {uploadInfo.fileName}
                          </span>
                        </div>
                      </AlertDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUploadAnother}
                        className="gap-1.5 text-xs h-8 text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                        aria-label="Upload a different CSV file"
                      >
                        <Upload className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Upload Different File</span>
                      </Button>
                      <button
                        onClick={handleDismissAlert}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
                        aria-label="Dismiss success message"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
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
              role="status"
              aria-live="polite"
              aria-label="Processing transactions"
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
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
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
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

        {/* Dividends Dashboard View */}
        <AnimatePresence mode="wait">
          {showDividendsDashboard && (
            <motion.div
              key="dividends-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-w-0"
              ref={dividendsRef}
            >
              <ErrorBoundary>
                <DividendsDashboard transactions={normalizedTransactions} />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trading Activity Dashboard View */}
        <AnimatePresence mode="wait">
          {showTradingActivityDashboard && (
            <motion.div
              key="trading-activity-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-w-0"
              ref={activityRef}
            >
              <ErrorBoundary>
                <TradingActivityDashboard transactions={normalizedTransactions} />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stock Detail View */}
        <AnimatePresence mode="wait">
          {showDetail && selectedTicker && (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-6 py-6 min-w-0"
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
              className="container mx-auto px-6 py-6 space-y-8 min-w-0"
            >
              {/* Global Portfolio Metrics */}
              <div>
                <ErrorBoundary>
                  <PortfolioMetrics transactions={normalizedTransactions} />
                </ErrorBoundary>
              </div>

              {/* Stock Positions Grid */}
              <div ref={portfolioRef}>
                <ErrorBoundary>
                  <PortfolioOverview
                    transactions={normalizedTransactions}
                    onSelectTicker={handleSelectTicker}
                  />
                </ErrorBoundary>
              </div>
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
    </div>
  )
}
