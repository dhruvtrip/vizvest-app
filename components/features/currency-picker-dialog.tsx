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
import { Badge } from '@/components/ui/badge'
import { Check } from '@/components/icons'
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

  // Arrow keys move the choice, like a native radio group.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight'
      ? 1
      : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + currencies.length) % currencies.length
    setSelected(currencies[next])
    const group = event.currentTarget.parentElement
    const target = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]
    target?.focus()
  }

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
            Your uploads use more than one base currency. Pick the one every amount
            should be converted to.
          </DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Base currency" className="flex flex-col gap-2">
          {currencies.map((currency, index) => {
            const files = filesForCurrency(currency)
            const isSelected = selected === currency
            const isRecommended = currency === recommended
            return (
              <button
                key={currency}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected || (!selected && index === 0) ? 0 : -1}
                onClick={() => setSelected(currency)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl p-3.5 text-left',
                  'transition-[background-color,box-shadow] duration-150 ease-ui',
                  isSelected
                    ? 'bg-tile ring-[1.5px] ring-inset ring-foreground'
                    : 'bg-tile hover:bg-tile-hover'
                )}
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-150 ease-ui',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'ring-[1.5px] ring-inset ring-foreground/25'
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <Check size={12} strokeWidth={2.5} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-base font-medium">{currency}</span>
                    {isRecommended && <Badge variant="outline" className="h-5 px-2 font-normal">Recommended</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                    {files.map(f => f.fileName).join(', ')}
                  </span>
                </span>
                <span className="figure shrink-0 self-start pt-0.5 text-xs font-normal text-muted-foreground">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
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
