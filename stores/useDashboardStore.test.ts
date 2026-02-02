import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NormalizedTransaction, Trading212Transaction } from '@/types/trading212'
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
})
