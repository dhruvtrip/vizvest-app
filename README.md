# Vizvest

A modern portfolio analysis tool for Trading 212 data. Upload CSV exports to visualize holdings, track performance, and analyze dividends.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Data**: PapaParse (CSV), Recharts (visualization)
- **Animations**: Framer Motion
- **Theming**: next-themes

## Features

- **CSV Upload**: Validate and parse Trading 212 CSV exports
- **Portfolio Overview**: View holdings, positions, and performance metrics
- **Stock Detail**: Drill down into individual stock analysis
- **Dividend Tracking**: Analyze dividend payments and yields
- **Multi-Currency**: Automatic currency normalization and conversion
- **Privacy-First**: All processing happens locally in the browser

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.```

## Usage

1. Export your Trading 212 transaction history as CSV
2. Navigate to `/dashboard`
3. Upload the CSV file
4. View portfolio overview and drill into individual stocks

## CSV Format

Required columns: `Action`, `Ticker`, `No. of shares`, `Price / share`, `Total`

## Disclaimer

Vizvest is an educational/visualization tool for personal use only. Not financial advice. Consult licensed professionals for investment decisions.
