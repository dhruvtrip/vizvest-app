'use client'

import { useState } from 'react'
import { Info } from '@/components/icons'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface MetricTooltipProps {
  label: string
  explanation: string
  className?: string
}

/**
 * Info button with an explanation for a figure. Opens on hover, keyboard
 * focus or a tap, so it also works on touch screens.
 */
export function MetricTooltip ({ label, explanation, className }: MetricTooltipProps) {
  const [open, setOpen] = useState(false)
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "relative inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-ui before:absolute before:-inset-2 before:content-[''] hover:text-foreground",
              className
            )}
            aria-label={`More information about ${label}`}
          >
            <Info size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{label}</p>
          <p className="mt-1 text-muted-foreground">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Predefined explanations for common metrics
 */
export const METRIC_EXPLANATIONS = {
  buyVolume: 'Total amount spent on buying shares in the uploaded timeframe. Always positive.',
  sellVolume: 'Total amount received from selling shares in the uploaded timeframe. Always positive.',
  netCashFlow: 'Difference between buy and sell volumes. Negative (green) means you received more cash from selling than you spent buying. Positive (muted) means you spent more buying than you received from selling.',
  netShareFlow: 'Net change in share count. Positive means you increased your position (net buying). Negative means you reduced your position (net selling). For partial data, negative values indicate you sold shares that were purchased before the start of this data period.',
  avgBuyPrice: 'Average price per share for all buy transactions in this period, split-adjusted to today\'s share terms.',
  avgSellPrice: 'Average price per share for all sell transactions in this period, split-adjusted to today\'s share terms.',
  buyTransactions: 'Number of buy transactions and total shares purchased.',
  sellTransactions: 'Number of sell transactions and total shares sold.',
  partialData: 'Your CSV appears to contain only part of your trading history. Metrics reflect activity within the uploaded date range only. Shares or positions from before this period are not included.'
}
