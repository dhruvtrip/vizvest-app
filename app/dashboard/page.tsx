'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import posthog from 'posthog-js'
import { Upload } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { CSVUpload } from '@/components/features/csv-upload'
import { PortfolioOverview } from '@/components/features/portfolio-overview'
import { PortfolioMetrics } from '@/components/features/portfolio-metrics'
import { StockDetail } from '@/components/features/stock-detail'
import { TradingActivityDashboard } from '@/components/features/trading-activity-dashboard'

const DividendsDashboard = dynamic(
  () => import('@/components/features/dividends-dashboard').then(m => m.DividendsDashboard),
  { ssr: false }
)
import { DashboardSidebar } from '@/components/features/dashboard-sidebar'
import { DashboardPills } from '@/components/features/dashboard-pills'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { getPartialDataExplanation } from '@/lib/partial-data-detector'
import { EmailSignupDialog } from '@/components/features/email-signup-dialog'
import { Footer } from '@/components/landing/footer'
import { DUR, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Page frame shared by every dashboard view */
const FRAME = 'mx-auto w-full max-w-[1200px] px-4 md:px-8'

type Tone = 'positive' | 'info' | 'warning'

const MARK: Record<Tone, string> = {
  positive: 'bg-positive',
  info: 'bg-info',
  warning: 'bg-warning'
}

/**
 * A quiet status row: hairline below, a 6px square mark, one line of text and
 * optional controls on the right. Height opens and closes with a blur fade.
 */
function StatusRow ({
  tone,
  children,
  actions,
  align = 'center'
}: {
  tone: Tone
  children: React.ReactNode
  actions?: React.ReactNode
  align?: 'center' | 'start'
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, filter: 'blur(4px)' }}
      animate={
        reduce
          ? { opacity: 1, transition: { duration: DUR.fast } }
          : { opacity: 1, height: 'auto', filter: 'blur(0px)', transition: { duration: DUR.fast, ease: EASE.smoothOut } }
      }
      exit={
        reduce
          ? { opacity: 0, transition: { duration: DUR.quick } }
          : { opacity: 0, height: 0, filter: 'blur(4px)', transition: { duration: DUR.quick, ease: EASE.smoothOut } }
      }
      className="overflow-hidden border-b border-border"
    >
      <div
        className={cn(
          FRAME,
          'flex justify-between gap-3 py-2.5 sm:gap-4',
          align === 'center' ? 'items-start sm:items-center' : 'items-start'
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3 py-1">
          <span className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-[1px]', MARK[tone])} aria-hidden="true" />
          <div className="min-w-0 flex-1 text-p-sm">{children}</div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
    </motion.div>
  )
}

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
    partialDataWarning,
    isPartialDataDismissed,
    mergeBanner,
    isMergeBannerDismissed,
    uploadAnother,
    dismissAlert,
    dismissPartialDataAlert,
    dismissMergeBanner
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
      partialDataWarning: state.partialDataWarning,
      isPartialDataDismissed: state.isPartialDataDismissed,
      mergeBanner: state.mergeBanner,
      isMergeBannerDismissed: state.isMergeBannerDismissed,
      uploadAnother: state.uploadAnother,
      dismissAlert: state.dismissAlert,
      dismissPartialDataAlert: state.dismissPartialDataAlert,
      dismissMergeBanner: state.dismissMergeBanner
    }))
  )

  const reduce = useReducedMotion()

  const portfolioRef = useRef<HTMLDivElement>(null)
  const analyticsRef = useRef<HTMLDivElement>(null)
  const activityRef = useRef<HTMLDivElement>(null)
  const dividendsRef = useRef<HTMLDivElement>(null)

  const hasData = normalizedTransactions.length > 0

  const [showSignupDialog, setShowSignupDialog] = useState(false)

  useEffect(() => {
    if (!hasData) return
    const timer = setTimeout(() => setShowSignupDialog(true), 10_000)
    return () => clearTimeout(timer)
  }, [hasData])
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
    posthog.capture('upload_another_file_clicked', { location: 'dashboard_banner' })
    uploadAnother()
  }, [uploadAnother])

  // House view transition: blur + small rise in, quicker blur fade out
  const viewMotion = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: DUR.fast } },
        exit: { opacity: 0, transition: { duration: DUR.quick } }
      }
    : {
        initial: { opacity: 0, y: 10, filter: 'blur(5px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: DUR.fast, ease: EASE.smoothOut } },
        exit: { opacity: 0, y: -4, filter: 'blur(5px)', transition: { duration: DUR.quick, ease: EASE.inQuad } }
      }

  const viewKey = showDividendsDashboard
    ? 'dividends-dashboard'
    : showTradingActivityDashboard
      ? 'trading-activity-dashboard'
      : showDetail && selectedTicker
        ? 'detail'
        : showOverview
          ? 'overview'
          : null

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <div className="relative flex flex-1">
        {hasData && <DashboardSidebar />}

        <main className="w-full min-w-0 flex-1">
          <EmailSignupDialog show={showSignupDialog} />
          {hasData && <DashboardPills />}

          <AnimatePresence initial={false}>
            {uploadInfo && hasData && !isAlertDismissed && (
              <div key="upload-success" role="status" aria-live="polite" aria-atomic="true">
                <StatusRow
                  tone="positive"
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUploadAnother}
                        className="text-fg-secondary"
                        aria-label="Upload a different CSV file"
                      >
                        <Upload strokeWidth={1.5} aria-hidden="true" />
                        <span className="hidden sm:inline">Upload different file</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={dismissAlert}
                        className="text-fg-secondary"
                        aria-label="Dismiss success message"
                      >
                        Dismiss
                      </Button>
                    </>
                  }
                >
                  <span className="text-foreground">
                    Loaded <span className="tabular">{uploadInfo.rowCount}</span> transactions
                  </span>{' '}
                  <span className="text-fg-secondary">from {uploadInfo.fileName}</span>
                </StatusRow>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {mergeBanner && !isMergeBannerDismissed && hasData && (
              <div key="merge" role="status" aria-live="polite" aria-atomic="true">
                <StatusRow
                  tone="info"
                  actions={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissMergeBanner}
                      className="text-fg-secondary"
                      aria-label="Dismiss merge summary"
                    >
                      Dismiss
                    </Button>
                  }
                >
                  <span className="text-foreground">
                    Merged <span className="tabular">{mergeBanner.fileCount}</span>{' '}
                    {mergeBanner.fileCount === 1 ? 'file' : 'files'}
                  </span>{' '}
                  <span className="tabular text-fg-secondary">
                    {mergeBanner.duplicatesRemoved > 0
                      ? `removed ${mergeBanner.duplicatesRemoved} duplicate ${mergeBanner.duplicatesRemoved === 1 ? 'transaction' : 'transactions'} · ${mergeBanner.totalRows} unique rows`
                      : `${mergeBanner.totalRows} unique rows · no duplicates found`}
                  </span>
                </StatusRow>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {partialDataWarning?.isPartialData && !isPartialDataDismissed && showOverview && (
              <div key="partial" role="status" aria-live="polite" aria-atomic="true">
                <StatusRow
                  tone="warning"
                  align="start"
                  actions={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissPartialDataAlert}
                      className="text-fg-secondary"
                      aria-label="Dismiss partial data warning"
                    >
                      Dismiss
                    </Button>
                  }
                >
                  <p className="text-foreground">Partial transaction data detected</p>
                  <p className="mt-0.5 max-w-[720px] text-pretty text-fg-secondary">
                    {getPartialDataExplanation(partialDataWarning)}
                  </p>
                </StatusRow>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isNormalizing && (
              <motion.div
                key="normalizing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: DUR.fast } }}
                exit={{ opacity: 0, transition: { duration: DUR.quick } }}
                className={cn(FRAME, 'py-24')}
                role="status"
                aria-live="polite"
                aria-label="Processing transactions"
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="working-shimmer text-p">Processing transactions</p>
                  <p className="text-p-sm text-fg-secondary">
                    Normalizing currencies and calculating positions
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: DUR.fast } }}
                exit={{ opacity: 0, transition: { duration: DUR.quick } }}
                className={cn(FRAME, 'pt-8')}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <Alert variant="destructive">
                  <AlertDescription className="text-p-sm text-negative">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {showWelcome && (
            <ErrorBoundary area="csv_upload">
              <CSVUpload isHidden={false} />
            </ErrorBoundary>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {viewKey === 'dividends-dashboard' && (
              <motion.div key={viewKey} {...viewMotion} className={cn(FRAME, 'min-w-0 py-8 md:py-10')} ref={dividendsRef}>
                <ErrorBoundary area="dividends_dashboard">
                  <DividendsDashboard />
                </ErrorBoundary>
              </motion.div>
            )}

            {viewKey === 'trading-activity-dashboard' && (
              <motion.div key={viewKey} {...viewMotion} className={cn(FRAME, 'min-w-0 py-8 md:py-10')} ref={activityRef}>
                <ErrorBoundary area="trading_activity_dashboard">
                  <TradingActivityDashboard />
                </ErrorBoundary>
              </motion.div>
            )}

            {viewKey === 'detail' && (
              <motion.div key={viewKey} {...viewMotion} className={cn(FRAME, 'min-w-0 py-8 md:py-10')}>
                <ErrorBoundary area="stock_detail">
                  <StockDetail />
                </ErrorBoundary>
              </motion.div>
            )}

            {viewKey === 'overview' && (
              <motion.div
                key={viewKey}
                {...viewMotion}
                className={cn(FRAME, 'min-w-0 space-y-12 py-8 md:py-10')}
              >
                <div ref={analyticsRef}>
                  <ErrorBoundary area="portfolio_metrics">
                    <PortfolioMetrics />
                  </ErrorBoundary>
                </div>
                <div ref={portfolioRef}>
                  <ErrorBoundary area="portfolio_overview">
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
      {showWelcome && <Footer />}
    </div>
  )
}
