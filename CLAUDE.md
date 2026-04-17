# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm run test     # Run all tests (Vitest)
npx vitest run stores/useDashboardStore.test.ts  # Run a single test file
```

## Architecture

**Vizvest** is a fully client-side portfolio analytics tool for Trading 212. No backend or database — all CSV processing and analysis happens in the browser. Data is never persisted (in-memory only, cleared on refresh).

Always use plan mode even if the user forgets. You must always ask clarifying questions when in doubt. 

### Data Flow

1. **CSV Upload** (`components/features/csv-upload.tsx`) — user drops a Trading 212 CSV; PapaParse parses it, then `lib/csv-validator.ts` validates columns and rows
2. **Store hydration** — on success, `useDashboardStore.handleDataParsed()` is called, which stores raw transactions and immediately triggers `normalizeTransactions()`
3. **Currency normalization** (`lib/currency-normalizer.ts`) — detects the user's base currency (most frequent `Currency (Total)` value), converts all transaction totals to that currency using the per-row exchange rate already in the CSV
4. **Partial data detection** (`lib/partial-data-detector.ts`) — flags cases where sell transactions exceed buy history (common when users only export recent history)
5. **Dashboard render** (`app/dashboard/page.tsx`) — reads from the Zustand store; conditionally shows `CSVUpload`, `PortfolioOverview`, `PortfolioMetrics`, `StockDetail`, `DividendsDashboard`, or `TradingActivityDashboard` based on store state flags

### State Management

Single Zustand store at `stores/useDashboardStore.ts`. Key flags that drive which view renders:

| Flag | Effect |
|------|--------|
| `showUpload` | Shows `CSVUpload` (true until data loaded) |
| `normalizedTransactions.length > 0` | Unlocks dashboard views |
| `selectedTicker` | Shows `StockDetail` |
| `showDividendsDashboard` | Shows `DividendsDashboard` |
| `showTradingActivityDashboard` | Shows `TradingActivityDashboard` |

Navigation between dashboard views goes through `store.navigate(view)` and `store.setSelectedTicker()`.

### Key Types (`types/trading212.ts`)

- `Trading212Transaction` — raw CSV row shape (Action, Time, Ticker, Total, etc.)
- `NormalizedTransaction` — extends raw with `totalInBaseCurrency` and `detectedBaseCurrency`
- `StockPosition` / `StockMetrics` — aggregated per-ticker data used by dashboard components
- `PartialDataWarning` — emitted when CSV appears to be a partial export

### Pages & Routing

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` | Landing page |
| `/dashboard` | `app/dashboard/page.tsx` | Main app, fully client-side |
| `/articles` | `app/articles/page.tsx` | MDX blog (content in `content/`) |
| `/articles/[slug]` | `app/articles/[slug]/page.tsx` | Individual article |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy |

No API routes exist. If adding one, create `app/api/<route>/route.ts`.

### UI Components

shadcn/ui components live in `components/ui/` — **never modify these files directly**. Install new ones via the shadcn MCP server tool (`add-component`), not the CLI. Feature components go in `components/features/`, landing page components in `components/landing/`.

Fonts: **Funnel Sans** (`--font-heading`) for headings, **Geist** (`--font-sans`) for body, **Geist Mono** (`--font-mono`).

### Analytics & Consent

PostHog is integrated via `app/providers/ph-provider.tsx` with a consent banner (`components/posthog-consent-banner.tsx`). All `posthog.capture()` calls should respect the existing consent flow — check `lib/posthog-privacy.ts` for the helpers. Vercel Analytics and Speed Insights are also loaded in the root layout.

### Security Constraints

Per `.docs/security.md`: all financial data stays in memory only — no `localStorage`, `sessionStorage`, or server persistence. File uploads max 5 MB, CSV only, parsed client-side via PapaParse.
