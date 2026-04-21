'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PerFileBaseCurrency } from '@/lib/csv-merger'

interface CurrencyPickerDialogProps {
  open: boolean
  currencies: string[]
  perFileBreakdown: PerFileBaseCurrency[]
  onSelect: (currency: string) => void
  onCancel: () => void
}

export function CurrencyPickerDialog({
  open,
  currencies,
  perFileBreakdown,
  onSelect,
  onCancel
}: CurrencyPickerDialogProps) {
  const recommended = useMemo(() => {
    if (currencies.length === 0) return ''
    const counts = new Map<string, number>()
    for (const entry of perFileBreakdown) {
      counts.set(entry.baseCurrency, (counts.get(entry.baseCurrency) ?? 0) + entry.rowCount)
    }
    let best = currencies[0]
    let bestCount = -1
    for (const [currency, count] of counts) {
      if (count > bestCount) {
        best = currency
        bestCount = count
      }
    }
    return best
  }, [currencies, perFileBreakdown])

  const [selected, setSelected] = useState<string>(recommended)

  const filesForCurrency = (currency: string) =>
    perFileBreakdown.filter(f => f.baseCurrency === currency)

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a base currency</DialogTitle>
          <DialogDescription>
            Your uploads use more than one base currency. Pick the one we should
            convert everything to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {currencies.map((currency) => {
            const files = filesForCurrency(currency)
            const isSelected = selected === currency
            const isRecommended = currency === recommended
            return (
              <button
                key={currency}
                type="button"
                onClick={() => setSelected(currency)}
                className={cn(
                  'w-full text-left rounded-xl border p-4 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                        isSelected ? 'border-primary' : 'border-muted-foreground/40'
                      )}
                      aria-hidden
                    >
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <span className="font-semibold text-base tracking-tight">
                      {currency}
                    </span>
                    {isRecommended && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-primary bg-primary/12 border border-primary/20 rounded-full px-2 py-0.5">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {files.length} {files.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {files.map(f => f.fileName).join(', ')}
                </p>
              </button>
            )
          })}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onSelect(selected)}
            disabled={!selected}
          >
            Use {selected || 'currency'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
