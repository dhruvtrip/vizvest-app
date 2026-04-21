# Vizvest

Portfolio analytics for Trading 212. Upload a CSV export to see your holdings, performance, dividends, and trading activity — all processed locally in your browser.

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/573f1e46-6719-4330-ba81-8c41fc8b8006" />

## Why I built this

I was sick of not seeing the full picture of my portfolio on Trading 212. The platform is great for buying and selling, but the analytics are next to non-existent — no real breakdown of realized vs. unrealized gains, no dividend history worth looking at, no way to understand how your trading activity actually shapes your returns.

So I built Vizvest: the dashboard I wished Trading 212 had. Drop in your CSV export and get the visualizations the platform should have shipped with.

## Features

- **Portfolio overview** — holdings, allocation, and performance at a glance
- **Per-stock drill-down** — realized/unrealized P&L, cost basis, and transaction history per ticker
- **Dividend dashboard** — payments over time, per-ticker yields, and reinvestment tracking
- **Trading activity dashboard** — trade frequency, volume, behavioral patterns, plus fun insights like your most-traded ticker, busiest trading day, and a year-in-the-market heatmap
- **Multi-currency normalization** — auto-detects your base currency and converts every row using the FX rate already in the CSV
- **Partial-export detection** — warns you when sells outrun buys (a common gotcha with short export windows)
- **Privacy by design** — everything runs client-side; no uploads, no storage, no backend. Refresh the page and the data is gone.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: shadcn/ui + Radix UI
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Data**: PapaParse (CSV), Recharts (visualization)
- **Animations**: Framer Motion
- **Theming**: next-themes
- **Testing**: Vitest

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build    # production build
npm run lint     # ESLint
npm run test     # Vitest
```

## Usage

1. Export your Trading 212 transaction history as CSV
2. Go to `/dashboard`
3. Drop in the CSV
4. Explore your portfolio, dividends, and trading activity

## CSV Format

Required columns: `Action`, `Ticker`, `No. of shares`, `Price / share`, `Total`, `Currency (Total)`, `Exchange rate`.

Max file size: 5 MB. CSV only.

## Disclaimer

Vizvest is an educational and visualization tool for personal use. Not financial advice. Consult a licensed professional before making investment decisions.
