import type { ComponentType } from 'react'
import {
  CurrencyVisual,
  DividendVisual,
  FeesVisual,
  HeatmapVisual,
  PnlVisual,
  TradesVisual,
} from './feature-visuals'

export interface Feature {
  id: string
  /** One word for the label row above the swipe row on phones. */
  label: string
  title: string
  description: string
  /** A working sketch of the feature, drawn with sample data. */
  Visual: ComponentType
}

export const features: Feature[] = [
  {
    id: 'activity',
    label: 'Activity',
    title: 'Trading habits, mapped',
    description: 'A day-by-day heatmap with streaks, your busiest month and your win rate.',
    Visual: HeatmapVisual,
  },
  {
    id: 'profit',
    label: 'Profit',
    title: 'Profit per position',
    description: 'Realised results taken straight from Trading 212’s own figures, position by position.',
    Visual: PnlVisual,
  },
  {
    id: 'costs',
    label: 'Costs',
    title: 'What trading cost you',
    description: 'Currency conversion fees and withholding tax added up, so the return you see is the one you kept.',
    Visual: FeesVisual,
  },
  {
    id: 'dividends',
    label: 'Dividends',
    title: 'Dividends, net of tax',
    description: 'Monthly and quarterly income, the tax withheld at source and what actually reached your account.',
    Visual: DividendVisual,
  },
  {
    id: 'trades',
    label: 'Trades',
    title: 'Every trade in a stock',
    description: 'Open any holding for its full buy, sell and dividend history in one place.',
    Visual: TradesVisual,
  },
  {
    id: 'currencies',
    label: 'Currencies',
    title: 'Every currency, one total',
    description: 'Dollars, pounds and pence are converted at the rate in your export and added up in your base currency.',
    Visual: CurrencyVisual,
  },
]
