import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NormalizedTransaction, Trading212Transaction } from '@/types/trading212'
import { normalizeAllTransactions } from '@/lib/currency-normalizer'
import { useDashboardStore } from './useDashboardStore'

const mockNormalized: NormalizedTransaction[] = [
  {
    Action: 'Market buy',
    Time: '2024-01-01T00:00:00',
    Total: 100,
    'Currency (Total)': 'USD',
    totalInBaseCurrency: 100,
    detectedBaseCurrency: 'USD'
  } as NormalizedTransaction
]

vi.mock('@/lib/currency-normalizer', () => ({
  normalizeAllTransactions: vi.fn((raw: Trading212Transaction[]) => {
    if (raw.length === 0) return []
    return mockNormalized
  })
}))

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.getState().resetStore()
  })

  it('has correct initial state', () => {
    const state = useDashboardStore.getState()
    expect(state.rawTransactions).toEqual([])
    expect(state.normalizedTransactions).toEqual([])
    expect(state.baseCurrency).toBe('USD')
    expect(state.selectedTicker).toBeNull()
    expect(state.uploadInfo).toBeNull()
    expect(state.showUpload).toBe(true)
    expect(state.isAlertDismissed).toBe(false)
    expect(state.currentView).toBe('portfolio')
    expect(state.showDividendsDashboard).toBe(false)
    expect(state.showTradingActivityDashboard).toBe(false)
  })

  it('updates selected ticker', () => {
    useDashboardStore.getState().setSelectedTicker('AAPL')
    expect(useDashboardStore.getState().selectedTicker).toBe('AAPL')
    useDashboardStore.getState().setSelectedTicker(null)
    expect(useDashboardStore.getState().selectedTicker).toBeNull()
  })

  it('dismisses alert', () => {
    useDashboardStore.getState().dismissAlert()
    expect(useDashboardStore.getState().isAlertDismissed).toBe(true)
  })

  it('navigates and updates view state', () => {
    useDashboardStore.getState().navigate('dividends')
    const state = useDashboardStore.getState()
    expect(state.currentView).toBe('dividends')
    expect(state.showDividendsDashboard).toBe(true)
    expect(state.showTradingActivityDashboard).toBe(false)
    expect(state.selectedTicker).toBeNull()

    useDashboardStore.getState().navigate('activity')
    const state2 = useDashboardStore.getState()
    expect(state2.currentView).toBe('activity')
    expect(state2.showTradingActivityDashboard).toBe(true)
  })

  it('uploadAnother resets data and shows upload', () => {
    useDashboardStore.getState().setSelectedTicker('AAPL')
    useDashboardStore.getState().uploadAnother()
    const state = useDashboardStore.getState()
    expect(state.showUpload).toBe(true)
    expect(state.rawTransactions).toEqual([])
    expect(state.normalizedTransactions).toEqual([])
    expect(state.uploadInfo).toBeNull()
    expect(state.selectedTicker).toBeNull()
    expect(state.isAlertDismissed).toBe(false)
  })

  it('handleDataParsed sets raw data and normalizes', () => {
    const raw: Trading212Transaction[] = [
      { Action: 'Market buy', Time: '2024-01-01', Total: 100, 'Currency (Total)': 'USD' } as Trading212Transaction
    ]
    useDashboardStore.getState().handleDataParsed(raw, { fileName: 'test.csv', rowCount: 1 })
    const state = useDashboardStore.getState()
    expect(state.rawTransactions).toEqual(raw)
    expect(state.uploadInfo).toEqual({ fileName: 'test.csv', rowCount: 1 })
    expect(state.showUpload).toBe(false)
    expect(state.selectedTicker).toBeNull()
    expect(state.isAlertDismissed).toBe(false)
    expect(state.normalizedTransactions).toEqual(mockNormalized)
    expect(state.baseCurrency).toBe('USD')
    expect(state.isNormalizing).toBe(false)
  })

  it('setMobileSidebarOpen updates mobile sidebar state', () => {
    useDashboardStore.getState().setMobileSidebarOpen(true)
    expect(useDashboardStore.getState().isMobileSidebarOpen).toBe(true)
    useDashboardStore.getState().setMobileSidebarOpen(false)
    expect(useDashboardStore.getState().isMobileSidebarOpen).toBe(false)
  })

  it('backToOverview resets to portfolio view', () => {
    useDashboardStore.getState().navigate('dividends')
    useDashboardStore.getState().setSelectedTicker('AAPL')
    useDashboardStore.getState().backToOverview()
    const state = useDashboardStore.getState()
    expect(state.selectedTicker).toBeNull()
    expect(state.showDividendsDashboard).toBe(false)
    expect(state.showTradingActivityDashboard).toBe(false)
    expect(state.currentView).toBe('portfolio')
  })

  it('resetStore restores initial state', () => {
    useDashboardStore.getState().setSelectedTicker('AAPL')
    useDashboardStore.getState().navigate('dividends')
    useDashboardStore.getState().resetStore()
    const state = useDashboardStore.getState()
    expect(state.selectedTicker).toBeNull()
    expect(state.currentView).toBe('portfolio')
    expect(state.showDividendsDashboard).toBe(false)
  })

  describe('stock splits', () => {
    // Synthetic rows. US0378331005 is Apple in the bundled split table
    // (4-for-1, effective 2020-08-31).
    function trade(action: string, time: string, shares: number, price: number): NormalizedTransaction {
      return {
        Action: action,
        Time: time,
        ISIN: 'US0378331005',
        Ticker: 'AAPL',
        Name: 'Apple',
        'No. of shares': shares,
        'Price / share': price,
        'Currency (Price / share)': 'USD',
        Total: shares * price,
        'Currency (Total)': 'USD',
        totalInBaseCurrency: shares * price,
        detectedBaseCurrency: 'USD'
      }
    }
    const buyBefore = trade('Market buy', '2020-08-03 15:00:00', 1, 400)
    const sellAfter = trade('Market sell', '2020-09-15 15:00:00', 4, 110)
    const lonelySplitRow: NormalizedTransaction = {
      Action: 'Stock split open',
      Time: '2025-06-10 05:00:00',
      ISIN: 'ZZ0000000018',
      Ticker: 'ABC',
      'No. of shares': 4,
      Total: 40,
      'Currency (Total)': 'USD',
      totalInBaseCurrency: 40,
      detectedBaseCurrency: 'USD'
    }

    function upload(rows: NormalizedTransaction[]) {
      vi.mocked(normalizeAllTransactions).mockReturnValueOnce(rows)
      useDashboardStore.getState().handleDataParsed(rows, { fileName: 'test.csv', rowCount: rows.length })
    }

    it('starts with no applied splits', () => {
      const state = useDashboardStore.getState()
      expect(state.appliedSplits).toEqual([])
      expect(state.unpairedSplitRows).toBe(0)
      expect(state.isSplitBannerDismissed).toBe(false)
    })

    it('populates appliedSplits after upload and clears them on uploadAnother', () => {
      upload([buyBefore, sellAfter, lonelySplitRow])
      let state = useDashboardStore.getState()
      expect(state.appliedSplits).toHaveLength(1)
      expect(state.appliedSplits[0]).toMatchObject({
        name: 'Apple',
        ratioLabel: '4-for-1',
        cutoff: '2020-08-31 02:00:00',
        source: 'table',
        tickers: ['AAPL'],
        rowsAdjusted: 1
      })
      expect(state.unpairedSplitRows).toBe(1)
      expect(state.normalizedTransactions[0]).toMatchObject({
        'No. of shares': 1,
        adjustedShares: 4,
        adjustedPricePerShare: 100,
        splitFactor: 4,
        Total: 400
      })

      useDashboardStore.getState().dismissSplitBanner()
      expect(useDashboardStore.getState().isSplitBannerDismissed).toBe(true)

      useDashboardStore.getState().uploadAnother()
      state = useDashboardStore.getState()
      expect(state.appliedSplits).toEqual([])
      expect(state.unpairedSplitRows).toBe(0)
      expect(state.isSplitBannerDismissed).toBe(false)
    })

    it('runs partial-data detection on split-adjusted shares', () => {
      // Buy 1 before a 4-for-1 and sell 4 after: no "sold more than bought" warning.
      upload([buyBefore, sellAfter])
      const state = useDashboardStore.getState()
      expect(state.appliedSplits).toHaveLength(1)
      expect(state.partialDataWarning?.isPartialData).toBe(false)
      expect(state.partialDataWarning?.affectedTickers).toEqual([])
    })

    it('still warns when shares are genuinely missing after adjustment', () => {
      // 1 share before the 4-for-1 is 4 today; selling 6 means 2 came from elsewhere.
      upload([buyBefore, trade('Market sell', '2020-09-15 15:00:00', 6, 110)])
      expect(useDashboardStore.getState().partialDataWarning?.affectedTickers).toEqual(['AAPL'])
    })
  })
})
