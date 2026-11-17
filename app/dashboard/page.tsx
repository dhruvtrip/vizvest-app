'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
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
import { DashboardPage as DashboardPageShell } from '@/components/features/dashboard-layout'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { DotLoader, ShimmerText } from '@/components/motion'
import { CircleAlert, CircleCheck, GitMerge, Split, TriangleAlert, X } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { getPartialDataExplanation } from '@/lib/partial-data-detector'
import { countSplitSecurities, formatSplitSummary } from '@/lib/split-format'
import type { AppliedSplit } from '@/types/trading212'
import { EmailSignupDialog } from '@/components/features/email-signup-dialog'

const EASE_OUT = [0, 0, 0.58, 1] as const

/* Notices enter with a fade and a 12px rise (300ms) and leave faster
   (150ms). Their height opens and closes with them, so the view below
   never jumps. */
const noticeMotion = {
  initial: { opacity: 0, y: 12, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, height: 0, transition: { duration: 0.15, ease: EASE_OUT } }
}

type NoticeTone = 'up' | 'neutral' | 'warning' | 'destructive'

const NOTICE_TONES: Record<NoticeTone, { surface: string; icon: string }> = {
  up: { surface: 'bg-up/10', icon: 'text-up' },
  neutral: { surface: 'bg-tile', icon: 'text-muted-foreground' },
  warning: { surface: 'bg-warning/10', icon: 'text-warning' },
  destructive: { surface: 'bg-destructive/10', icon: 'text-destructive' }
}

/** Split entries shown in the split notice before "Show all" */
const SPLIT_NOTICE_PREVIEW_COUNT = 6

/**
 * appliedSplits arrays already reported to analytics. Module-level so that a
 * remount of this page (strict mode, navigating away and back) cannot report
 * the same upload twice; a WeakSet so old uploads are not kept in memory.
 */
const trackedSplitAdjustments = new WeakSet<AppliedSplit[]>()

const UNPAIRED_SPLIT_ADVICE = 'Upload the export for the neighbouring period to include it.'

function NoticeBody ({
  tone,
  icon: Icon,
  lead,
  detail,
  action,
  onDismiss,
  dismissLabel
}: {
  tone: NoticeTone
  icon: React.ElementType
  lead: React.ReactNode
  detail?: React.ReactNode
  action?: React.ReactNode
  onDismiss?: () => void
  dismissLabel?: string
}) {
  const colours = NOTICE_TONES[tone]
  return (
    <div className="pt-3">
      <div className={cn('flex items-start gap-3 rounded-2xl py-2.5 pe-2.5 ps-4 text-sm', colours.surface)}>
        <Icon size={16} strokeWidth={2} className={cn('mt-2 shrink-0', colours.icon)} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 py-1.5">
          <p className="min-w-0 flex-1 basis-60 leading-5 text-foreground">
            <span className="font-medium">{lead}</span>
            {detail && <> <span className="font-normal">{detail}</span></>}
          </p>
          {action}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            className="shrink-0 text-muted-foreground hover:bg-background/60 hover:text-foreground"
            aria-label={dismissLabel}
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </div>
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
    appliedSplits,
    unpairedSplitRows,
    isSplitBannerDismissed,
    uploadAnother,
    dismissAlert,
    dismissPartialDataAlert,
    dismissMergeBanner,
    dismissSplitBanner
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
      appliedSplits: state.appliedSplits,
      unpairedSplitRows: state.unpairedSplitRows,
      isSplitBannerDismissed: state.isSplitBannerDismissed,
      uploadAnother: state.uploadAnother,
      dismissAlert: state.dismissAlert,
      dismissPartialDataAlert: state.dismissPartialDataAlert,
      dismissMergeBanner: state.dismissMergeBanner,
      dismissSplitBanner: state.dismissSplitBanner
    }))
  )

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

  // Report once per upload that split adjustments were applied: counts only
  useEffect(() => {
    if (appliedSplits.length === 0 || trackedSplitAdjustments.has(appliedSplits)) return
    trackedSplitAdjustments.add(appliedSplits)
    posthog.capture('split_adjustments_applied', {
      csv_count: appliedSplits.filter(s => s.source === 'csv').length,
      table_count: appliedSplits.filter(s => s.source === 'table').length,
      unpaired_count: unpairedSplitRows
    })
  }, [appliedSplits, unpairedSplitRows])

  // "Show all" in the split notice, remembered for the current upload only
  const [expandedSplits, setExpandedSplits] = useState<AppliedSplit[] | null>(null)
  const showAllSplits = expandedSplits === appliedSplits
  const visibleSplits = showAllSplits
    ? appliedSplits
    : appliedSplits.slice(0, SPLIT_NOTICE_PREVIEW_COUNT)
  const splitSecurityCount = countSplitSecurities(appliedSplits)

  const handleUploadAnother = useCallback(() => {
    posthog.capture('upload_another_file_clicked', { location: 'dashboard_banner' })
    uploadAnother()
  }, [uploadAnother])

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
    <div className="relative flex flex-1">

      {hasData && <DashboardSidebar />}

      <main className="w-full min-w-0 flex-1">
        <EmailSignupDialog show={showSignupDialog} />
        {hasData && <DashboardPills />}

        {/* Status notices sit at the top of the content column, at the views' width. */}
        <div className={cn('mx-auto w-full max-w-shell px-4 sm:px-6 lg:px-8', hasData && 'pt-1 lg:pt-3')}>
          <AnimatePresence initial={false}>
            {uploadInfo && hasData && !isAlertDismissed && (
              <motion.div
                key="loaded"
                {...noticeMotion}
                className="overflow-hidden"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <NoticeBody
                  tone="up"
                  icon={CircleCheck}
                  lead={<>Loaded <span className="figure">{uploadInfo.rowCount}</span> transactions</>}
                  detail={<>from <span className="break-all">{uploadInfo.fileName}</span></>}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUploadAnother}
                      className="-my-1 -ms-3 hover:bg-background/60"
                      aria-label="Upload a different CSV file"
                    >
                      Upload a different file
                    </Button>
                  }
                  onDismiss={dismissAlert}
                  dismissLabel="Dismiss success message"
                />
              </motion.div>
            )}

            {mergeBanner && !isMergeBannerDismissed && hasData && (
              <motion.div
                key="merged"
                {...noticeMotion}
                className="overflow-hidden"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <NoticeBody
                  tone="neutral"
                  icon={GitMerge}
                  lead={`Merged ${mergeBanner.fileCount} ${mergeBanner.fileCount === 1 ? 'file' : 'files'}.`}
                  detail={
                    <span className="figure">
                      {mergeBanner.duplicatesRemoved > 0
                        ? `Removed ${mergeBanner.duplicatesRemoved} duplicate ${mergeBanner.duplicatesRemoved === 1 ? 'transaction' : 'transactions'} · ${mergeBanner.totalRows} unique rows`
                        : `${mergeBanner.totalRows} unique rows · no duplicates found`}
                    </span>
                  }
                  onDismiss={dismissMergeBanner}
                  dismissLabel="Dismiss merge summary"
                />
              </motion.div>
            )}

            {(appliedSplits.length > 0 || unpairedSplitRows > 0) && !isSplitBannerDismissed && hasData && (
              <motion.div
                key="splits"
                {...noticeMotion}
                className="overflow-hidden"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {appliedSplits.length > 0 ? (
                  <NoticeBody
                    tone="neutral"
                    icon={Split}
                    lead={<>Adjusted <span className="figure">{splitSecurityCount}</span> {splitSecurityCount === 1 ? 'stock' : 'stocks'} for stock splits.</>}
                    detail={
                      <>
                        <span className="figure">
                          {visibleSplits.map((split, index) => (
                            <span key={split.id}>
                              {/* Each entry wraps as a unit where it fits on one line. */}
                              <span className="inline-block">
                                {formatSplitSummary(split)}
                                {index < visibleSplits.length - 1 ? ' ·' : '.'}
                              </span>{' '}
                            </span>
                          ))}
                        </span>
                        {unpairedSplitRows > 0 && (
                          <>A stock split row was found without its matching row. {UNPAIRED_SPLIT_ADVICE}</>
                        )}
                      </>
                    }
                    action={
                      appliedSplits.length > SPLIT_NOTICE_PREVIEW_COUNT && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSplits(showAllSplits ? null : appliedSplits)}
                          className="-my-1 -ms-3 hover:bg-background/60"
                          aria-expanded={showAllSplits}
                        >
                          {showAllSplits ? 'Show less' : <>Show all (<span className="figure">{appliedSplits.length}</span>)</>}
                        </Button>
                      )
                    }
                    onDismiss={dismissSplitBanner}
                    dismissLabel="Dismiss stock split summary"
                  />
                ) : (
                  <NoticeBody
                    tone="warning"
                    icon={TriangleAlert}
                    lead="Stock split row found without its match."
                    detail={UNPAIRED_SPLIT_ADVICE}
                    onDismiss={dismissSplitBanner}
                    dismissLabel="Dismiss stock split summary"
                  />
                )}
              </motion.div>
            )}

            {partialDataWarning?.isPartialData && !isPartialDataDismissed && showOverview && (
              <motion.div
                key="partial"
                {...noticeMotion}
                className="overflow-hidden"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <NoticeBody
                  tone="warning"
                  icon={TriangleAlert}
                  lead="Partial transaction data detected."
                  detail={getPartialDataExplanation(partialDataWarning)}
                  onDismiss={dismissPartialDataAlert}
                  dismissLabel="Dismiss partial data warning"
                />
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                {...noticeMotion}
                className="overflow-hidden"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <NoticeBody
                  tone="destructive"
                  icon={CircleAlert}
                  lead="We could not process your transactions."
                  detail={error}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isNormalizing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              role="status"
              aria-live="polite"
              aria-label="Processing transactions"
            >
              <DashboardPageShell>
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <DotLoader pattern="scan" label="Processing transactions" className="text-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      <ShimmerText>Processing transactions</ShimmerText>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Converting currencies and working out your positions
                    </p>
                  </div>
                </div>
              </DashboardPageShell>
            </motion.div>
          )}
        </AnimatePresence>

        {showWelcome && (
          <ErrorBoundary area="csv_upload">
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
              <ErrorBoundary area="dividends_dashboard">
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
              <ErrorBoundary area="trading_activity_dashboard">
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
              className="min-w-0"
            >
              <ErrorBoundary area="stock_detail">
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
              className="min-w-0"
            >
              <DashboardPageShell>
                <div ref={analyticsRef}>
                  <ErrorBoundary area="portfolio_metrics">
                    <PortfolioMetrics />
                  </ErrorBoundary>
                </div>
                <div ref={portfolioRef} className="mt-8">
                  <ErrorBoundary area="portfolio_overview">
                    <PortfolioOverview />
                  </ErrorBoundary>
                </div>
              </DashboardPageShell>
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
    </div>
  )
}
