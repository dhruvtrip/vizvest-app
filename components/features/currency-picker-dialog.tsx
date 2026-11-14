'use client'

import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <DialogContent className="gap-6 sm:max-w-[440px]">
        <DialogHeader className="pr-8">
          <DialogTitle>Choose a base currency</DialogTitle>
          <DialogDescription>
            Your uploads use more than one base currency. Pick the one we should
            convert everything to.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-border" role="group" aria-label="Base currencies">
          {currencies.map((currency, i) => {
            const files = filesForCurrency(currency)
            const isSelected = selected === currency
            const isRecommended = currency === recommended
            return (
              <button
                key={currency}
                type="button"
                onClick={() => setSelected(currency)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left',
                  'transition-[background-color] duration-150 ease-out',
                  'focus-visible:outline-offset-[-2px]',
                  i > 0 && 'border-t border-border',
                  isSelected ? 'bg-accent' : 'hover:bg-white/5'
                )}
                aria-pressed={isSelected}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-p font-medium text-foreground">{currency}</span>
                    {isRecommended && <Badge variant="brand">Recommended</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-label text-fg-secondary">
                    {files.map(f => f.fileName).join(', ')}
                  </p>
                </div>
                <span className="tabular shrink-0 text-label text-fg-gray">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
                <span className="grid h-4 w-4 shrink-0 place-items-center" aria-hidden="true">
                  <Check
                    className={cn(
                      'h-4 w-4 text-foreground transition-opacity duration-150',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                    strokeWidth={1.5}
                  />
                </span>
              </button>
            )
          })}
        </div>

        <DialogFooter>
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
