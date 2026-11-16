'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkline } from '@/components/charts'

const trades = [
  { date: '27 Oct 2026', side: 'Sell', shares: '6.2', price: '$214.60', total: '€1,208.34', result: '+€412.08' },
  { date: '12 Aug 2026', side: 'Buy', shares: '4.0', price: '$176.12', total: '€641.90', result: null },
  { date: '03 Jun 2026', side: 'Sell', shares: '3.5', price: '$168.40', total: '€536.21', result: '+€96.75' },
  { date: '21 Jan 2026', side: 'Buy', shares: '9.7', price: '$131.88', total: '€1,165.02', result: null },
] as const

const price = [118, 121, 117, 126, 131, 128, 137, 142, 139, 151, 158, 154, 166, 171, 168, 179, 188, 184, 197, 206, 201, 214]

/**
 * Product sketch for the features section: one stock opened up, with its
 * totals and latest trades, set as a glass card on the dark panel.
 */
export function FeatureVisual() {
  return (
    <div className="panel-texture rounded-4xl p-3 sm:p-8 lg:p-10">
      <div className="surface-glass p-4 text-foreground sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="ticker text-lg leading-6">NVDA</p>
            <p className="truncate text-sm text-muted-foreground">Nvidia</p>
          </div>
          <Sparkline values={price} color="up" aria-label="Nvidia price paid across 22 trades, rising" width={120} height={40} />
        </div>

        <dl className="mt-5 grid gap-2 sm:grid-cols-3 sm:gap-3">
          {[
            { label: 'Bought', value: '€8,412.60', tone: '' },
            { label: 'Sold', value: '€6,307.33', tone: '' },
            { label: 'Realised', value: '+€1,941.15', tone: 'text-up' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-3 rounded-xl bg-muted px-3 py-2.5 sm:block sm:p-3"
            >
              <dt className="text-xs font-normal text-muted-foreground">{item.label}</dt>
              <dd className={`figure whitespace-nowrap text-sm font-semibold sm:mt-1 xl:text-base ${item.tone}`}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <ul className="mt-4 flex flex-col rounded-xl bg-background px-2 sm:px-3">
          {trades.map((trade) => (
            <li
              key={trade.date}
              className="flex items-center gap-2 border-t border-border/60 py-2.5 text-sm font-normal first:border-t-0 sm:gap-3"
            >
              <Badge variant={trade.side === 'Buy' ? 'up' : 'down'} className="w-10 justify-center px-0 sm:w-11">
                {trade.side}
              </Badge>
              <span className="figure min-w-0 flex-1 truncate text-muted-foreground">
                {trade.date}
                <span className="hidden sm:inline">
                  {' '}
                  · {trade.shares} at {trade.price}
                </span>
              </span>
              <span className="figure whitespace-nowrap">
                {trade.result ? <span className="text-up">{trade.result}</span> : trade.total}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
