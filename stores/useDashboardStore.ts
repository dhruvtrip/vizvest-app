import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { normalizeAllTransactions } from '@/lib/currency-normalizer'
import { detectPartialData } from '@/lib/partial-data-detector'
import type { Trading212Transaction, NormalizedTransaction, PartialDataWarning } from '@/types/trading212'

export interface UploadInfo {
  fileName: string
  rowCount: number
}

interface DashboardState {
  rawTransactions: Trading212Transaction[]
  normalizedTransactions: NormalizedTransaction[]
  baseCurrency: string
  selectedTicker: string | null
  uploadInfo: UploadInfo | null
  showUpload: boolean
  isAlertDismissed: boolean
  isNormalizing: boolean
  error: string | null
  currentView: string
  isMobileSidebarOpen: boolean
  showDividendsDashboard: boolean
  showTradingActivityDashboard: boolean
  partialDataWarning: PartialDataWarning | null
  isPartialDataDismissed: boolean

  handleDataParsed: (data: Trading212Transaction[], uploadInfo: UploadInfo) => void
  normalizeTransactions: () => void
  uploadAnother: () => void
  dismissAlert: () => void
  dismissPartialDataAlert: () => void
  setSelectedTicker: (ticker: string | null) => void
  navigate: (view: string) => void
  setMobileSidebarOpen: (open: boolean) => void
  backToOverview: () => void
  resetStore: () => void
}

const initialState = {
  rawTransactions: [] as Trading212Transaction[],
  normalizedTransactions: [] as NormalizedTransaction[],
  baseCurrency: 'USD',
  selectedTicker: null as string | null,
  uploadInfo: null as UploadInfo | null,
  showUpload: true,
  isAlertDismissed: false,
  isNormalizing: false,
  error: null as string | null,
  currentView: 'portfolio',
  isMobileSidebarOpen: false,
  showDividendsDashboard: false,
  showTradingActivityDashboard: false,
  partialDataWarning: null as PartialDataWarning | null,
  isPartialDataDismissed: false
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      handleDataParsed: (data, uploadInfo) => {
        set({
          rawTransactions: data,
          uploadInfo,
          showUpload: false,
          selectedTicker: null,
          error: null,
          isAlertDismissed: false
        })
        get().normalizeTransactions()
      },

      normalizeTransactions: () => {
        const raw = get().rawTransactions
        if (raw.length === 0) {
          set({
            normalizedTransactions: [],
            baseCurrency: 'USD',
            partialDataWarning: null
          })
          return
        }

        set({ isNormalizing: true, error: null })

        try {
          const normalized = normalizeAllTransactions(raw)
          const detected = normalized[0]?.detectedBaseCurrency || 'USD'
          
          // Detect partial data after normalization
          const partialDataWarning = detectPartialData(normalized)
          
          set({
            normalizedTransactions: normalized,
            baseCurrency: detected,
            isNormalizing: false,
            partialDataWarning,
            isPartialDataDismissed: false
          })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to normalize transactions',
            normalizedTransactions: [],
            isNormalizing: false,
            partialDataWarning: null
          })
        }
      },

      uploadAnother: () => {
        set({
          showUpload: true,
          rawTransactions: [],
          normalizedTransactions: [],
          uploadInfo: null,
          selectedTicker: null,
          isAlertDismissed: false,
          partialDataWarning: null,
          isPartialDataDismissed: false
        })
      },

      dismissAlert: () => set({ isAlertDismissed: true }),

      dismissPartialDataAlert: () => set({ isPartialDataDismissed: true }),

      setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),

      navigate: (view) => {
        set({
          currentView: view,
          selectedTicker: null,
          showDividendsDashboard: view === 'dividends',
          showTradingActivityDashboard: view === 'activity'
        })
      },

      setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),

      backToOverview: () => {
        set({
          selectedTicker: null,
          showDividendsDashboard: false,
          showTradingActivityDashboard: false,
          currentView: 'portfolio'
        })
      },

      resetStore: () => set(initialState)
    }),
    { name: 'DashboardStore' }
  )
)
