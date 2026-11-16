import type {
  AppliedSplit,
  NormalizedTransaction,
  SplitEvent,
  Trading212Transaction
} from '@/types/trading212'

// STUB: pass-through placeholder with the final signatures. To be replaced by
// the real implementation.

export function resolveSplitEvents(
  transactions: Trading212Transaction[]
): { events: SplitEvent[]; unpaired: Trading212Transaction[] } {
  void transactions
  return { events: [], unpaired: [] }
}

export function applySplitAdjustments(
  transactions: NormalizedTransaction[],
  events: SplitEvent[]
): { transactions: NormalizedTransaction[]; applied: AppliedSplit[] } {
  void events
  return { transactions, applied: [] }
}
