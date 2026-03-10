'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import { useShallow } from 'zustand/react/shallow'
import { CSVUpload } from '@/components/features/csv-upload'
import { PortfolioOverview } from '@/components/features/portfolio-overview'
import { PortfolioMetrics } from '@/components/features/portfolio-metrics'
import { StockDetail } from '@/components/features/stock-detail'
import { DividendsDashboard } from '@/components/features/dividends-dashboard'
import { TradingActivityDashboard } from '@/components/features/trading-activity-dashboard'
import { DashboardSidebar } from '@/components/features/dashboard-sidebar'
import { DashboardPills } from '@/components/features/dashboard-pills'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { getPartialDataExplanation } from '@/lib/partial-data-detector'

export default function DashboardPage () {
  const {
    normalizedTransactions,
    uploadInfo,
    isAlertDismissed,
    isNormalizing,
    error,
    showUpload,
    showDividendsDashboard,
    showTradingActivityDashboard,
    selectedTicker,
    isMobileSidebarOpen,
    partialDataWarning,
    isPartialDataDismissed,
    uploadAnother,
    dismissAlert,
    dismissPartialDataAlert,
    setMobileSidebarOpen
  } = useDashboardStore(
    useShallow((state) => ({
      normalizedTransactions: state.normalizedTransactions,
      uploadInfo: state.uploadInfo,
      isAlertDismissed: state.isAlertDismissed,
      isNormalizing: state.isNormalizing,
      error: state.error,
      showUpload: state.showUpload,
      showDividendsDashboard: state.showDividendsDashboard,
      showTradingActivityDashboard: state.showTradingActivityDashboard,
      selectedTicker: state.selectedTicker,
      isMobileSidebarOpen: state.isMobileSidebarOpen,
      partialDataWarning: state.partialDataWarning,
      isPartialDataDismissed: state.isPartialDataDismissed,
      uploadAnother: state.uploadAnother,
      dismissAlert: state.dismissAlert,
      dismissPartialDataAlert: state.dismissPartialDataAlert,
      setMobileSidebarOpen: state.setMobileSidebarOpen
    }))
  )

  const portfolioRef = useRef<HTMLDivElement>(null)
  const analyticsRef = useRef<HTMLDivElement>(null)
  const activityRef = useRef<HTMLDivElement>(null)
  const dividendsRef = useRef<HTMLDivElement>(null)

  const hasData = normalizedTransactions.length > 0
  const showOverview = hasData && !selectedTicker && !showDividendsDashboard && !showTradingActivityDashboard
  const showDetail = hasData && selectedTicker !== null && !showDividendsDashboard && !showTradingActivityDashboard
  const showWelcome = !hasData && !isNormalizing && showUpload

  useEffect(() => {
    if (uploadInfo && normalizedTransactions.length > 0 && !isAlertDismissed) {
      const timer = setTimeout(() => {
        dismissAlert()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [uploadInfo, normalizedTransactions.length, isAlertDismissed, dismissAlert])

  const handleUploadAnother = useCallback(() => {
    posthog.capture('upload_another_file_clicked')
    uploadAnother()
  }, [uploadAnother])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] relative">
      {hasData && (
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="lg:hidden fixed top-[5rem] right-4 z-[60] px-3 py-2 bg-background border border-border rounded-lg shadow-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm font-medium text-foreground"
          aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileSidebarOpen}
        >
          Menu
        </button>
      )}

      {hasData && <DashboardSidebar />}

      <main className="flex-1 min-w-0 w-full lg:w-auto">
        {hasData && <DashboardPills />}
        <AnimatePresence>
          {uploadInfo && hasData && !isAlertDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="border-b border-border border-l-4 border-l-emerald-500 bg-emerald-500/8 relative z-40"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="container mx-auto px-4 sm:px-8 py-3">
                <Alert className="border-0 bg-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                    <AlertDescription className="text-sm flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-1">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          Successfully loaded {uploadInfo.rowCount} transactions
                        </span>
                        <span className="text-muted-foreground text-sm">
                          from {uploadInfo.fileName}
                        </span>
                      </div>
                    </AlertDescription>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUploadAnother}
                        className="gap-1.5 text-xs h-8 text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                        aria-label="Upload a different CSV file"
                      >
                        <span className="hidden sm:inline">Upload Different File</span>
                      </Button>
                      <button
                        onClick={dismissAlert}
                        className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0"
                        aria-label="Dismiss success message"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </Alert>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isNormalizing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-8 py-16"
              role="status"
              aria-live="polite"
              aria-label="Processing transactions"
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold tracking-tight text-primary animate-pulse">...</p>
                  <p className="text-sm font-medium mt-2">Processing transactions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Normalizing currencies and calculating positions...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {partialDataWarning?.isPartialData && !isPartialDataDismissed && showOverview && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="border-b border-border border-l-4 border-l-amber-500 bg-amber-500/8 relative z-40"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="container mx-auto px-4 sm:px-8 py-3">
                <Alert className="border-0 bg-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between w-full gap-3">
                    <div className="flex-1 min-w-0">
                      <AlertTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                        Partial Transaction Data Detected
                      </AlertTitle>
                      <AlertDescription className="text-sm text-muted-foreground">
                        {getPartialDataExplanation(partialDataWarning)}
                      </AlertDescription>
                    </div>
                    <button
                      onClick={dismissPartialDataAlert}
                      className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0 self-end sm:self-auto"
                      aria-label="Dismiss partial data warning"
                    >
                      Dismiss
                    </button>
                  </div>
                </Alert>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-8 py-6"
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

        {showWelcome && (
          <ErrorBoundary>
            <CSVUpload isHidden={false} />
          </ErrorBoundary>
        )}

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
                <DividendsDashboard />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

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
                <TradingActivityDashboard />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showDetail && selectedTicker && (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-8 py-6 min-w-0"
            >
              <ErrorBoundary>
                <StockDetail />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showOverview && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-8 py-6 space-y-10 min-w-0"
            >
              <div ref={analyticsRef}>
                <ErrorBoundary>
                  <PortfolioMetrics />
                </ErrorBoundary>
              </div>
              <div ref={portfolioRef}>
                <ErrorBoundary>
                  <PortfolioOverview />
                </ErrorBoundary>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showWelcome && !hasData && showUpload && (
          <ErrorBoundary>
            <CSVUpload isHidden={false} />
          </ErrorBoundary>
        )}
      </main>
    </div>
  )
}
