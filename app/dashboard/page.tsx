'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import { Loader2, CheckCircle2, Upload, X, Menu } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
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
import { useDashboardStore } from '@/stores/useDashboardStore'

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
    uploadAnother,
    dismissAlert,
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
      uploadAnother: state.uploadAnother,
      dismissAlert: state.dismissAlert,
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
    <div className="flex min-h-[calc(100vh-3.5rem)] relative">
      {hasData && (
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="lg:hidden fixed top-[4.5rem] right-4 z-[60] p-2.5 bg-background border border-border rounded-lg shadow-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileSidebarOpen}
        >
          <Menu className="w-5 h-5 text-foreground" aria-hidden="true" />
        </button>
      )}

      {hasData && <DashboardSidebar />}

      <main className="flex-1 min-w-0 w-full lg:w-auto">
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
                        onClick={dismissAlert}
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
              className="container mx-auto px-6 py-6 min-w-0"
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
              className="container mx-auto px-6 py-6 space-y-8 min-w-0"
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
