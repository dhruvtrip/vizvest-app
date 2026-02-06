'use client'

import { Info } from 'lucide-react'
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
 * Tooltip component for metric cards
 * Provides contextual information about metrics, especially for partial data scenarios
 */
export function MetricTooltip ({ label, explanation, className }: MetricTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label={`More information about ${label}`}
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-xs"
          sideOffset={5}
        >
          <p className="font-medium mb-1">{label}</p>
          <p className="text-muted-foreground">{explanation}</p>
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
  avgBuyPrice: 'Average price per share for all buy transactions in this period.',
  avgSellPrice: 'Average price per share for all sell transactions in this period.',
  buyTransactions: 'Number of buy transactions and total shares purchased.',
  sellTransactions: 'Number of sell transactions and total shares sold.',
  partialData: 'Your CSV appears to contain only part of your trading history. Metrics reflect activity within the uploaded date range only. Shares or positions from before this period are not included.'
}
