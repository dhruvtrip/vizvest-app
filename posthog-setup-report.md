# PostHog analytics — audit & improvement report

_Vizvest (Next.js 16 App Router, fully client-side). PostHog was already installed; this pass audited it, closed two GDPR gaps, made error tracking consistent, and cleaned up the event taxonomy._

## What changed

| File | Action | Purpose |
|---|---|---|
| `lib/posthog-privacy.ts` | edit | Added `scrubExceptionProperties` (strip exception message/stack, keep type); fold financial-value **masking** into `filterSensitiveProperties`; `validateEvent` no longer drops whole events on a currency-value match (hoisted shared patterns). |
| `instrumentation-client.ts` | edit | `before_send` now runs scrub → filter → strip IP → validate (guard last). |
| `components/error-boundary.tsx` | edit | Keeps message-free capture; adds non-PII `area` + `route` for grouping. |
| `app/dashboard/page.tsx` | edit | Tagged each `ErrorBoundary` with an `area`; deduped `upload_another_file_clicked` with `location`. |
| `components/posthog-consent-banner.tsx` | edit | Listens for `posthog-open-consent` so the banner can be **re-opened**; shows current setting + a close button when re-opened. |
| `components/manage-analytics-button.tsx` | **new** | Client control that dispatches `posthog-open-consent`. Withdrawal entry point (GDPR Art. 7(3)). |
| `components/landing/footer.tsx` | edit | Added "Manage analytics" to the Legal column (every page). |
| `app/privacy/page.tsx` | edit | Rewrote analytics section to accurately describe cookieless anonymous pre-consent capture; opt-out points at "Manage analytics", not "clear cookies". |
| `components/features/csv-upload.tsx`, `dashboard-sidebar.tsx`, `trading-activity-dashboard.tsx`, `portfolio-overview.tsx` | edit | Taxonomy normalization (below). |
| `lib/posthog-privacy.test.ts` | **new** | 8 unit tests proving exception scrubbing, financial masking, and the no-silent-drop behavior. |

## Event taxonomy (after cleanup — all `snake_case`)

| Event | Key properties | Notes |
|---|---|---|
| `csv_upload_started` | `file_count` | |
| `csv_upload_failed` | `reason` (`preflight`\|`validation`), `error_count` | Merged from `csv_upload_failed-preflight` / `-validation` |
| `csv_upload_completed` | `file_count` | |
| `csv_upload_clicked`, `csv_upload_currency_chosen`, `csv_upload_currency_cancelled` | — | |
| `stock_selected` | `source` (`holding`\|`sold`) | Merged from `stock_selected_holding` / `_sold` |
| `dividends_dashboard_viewed`, `trading_activity_viewed` | — | |
| `dividend_view_mode_changed` | `view_mode` | |
| `trading_year_filter_changed` | `action` (`selected`\|`deselected`), `year` | Was propertyless |
| `upload_another_file_clicked` | `location` (`dashboard_banner`\|`sidebar`) | Deduped across two files |
| `dashboard_cta_clicked`, `get_started_cta_clicked` | `location` | |
| `signup_dialog_*`, `footer_signup_*` | — | No email/PII captured |
| `error_boundary_triggered` | `error_type`, `error_name`, `area`, `route` | Never the message |
| `$exception` (autocapture) | `$exception_type` only | message/stack scrubbed in `before_send` |

## Privacy / GDPR model (as implemented)

- **Before consent:** anonymous, `memory`-only persistence (no cookies/localStorage), IP + all geo + referrer stripped, financial values masked.
- **Accept:** `localStorage+cookie` persistence, coarse country-level geo allowed; still no financial data.
- **Decline:** `opt_out_capturing()` — nothing collected.
- **Withdraw/change:** "Manage analytics" (footer + privacy page) re-opens the banner anytime.
- Errors are captured as **type only** — no message, no stack trace.

## Env vars (set in hosting — Vercel)

| Var | Exposure | Notes |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | public | Enables init; when absent, PostHog no-ops gracefully |
| `NEXT_PUBLIC_POSTHOG_HOST` | public | EU host (`https://eu.i.posthog.com`) for localhost + `ui_host` |
| `NEXT_PUBLIC_SITE_URL` | public | metadata |
| `RESEND_API_KEY` | server | email signup (unrelated to PostHog) |

Requests are reverse-proxied via `/ingest` (see `next.config.mjs` rewrites) to `eu.i.posthog.com`. No CSP block exists, so no CSP changes were needed.

## Suggested PostHog dashboards/insights to build

1. **Activation funnel:** `dashboard_cta_clicked` → `csv_upload_started` → `csv_upload_completed` → (`dividends_dashboard_viewed` | `trading_activity_viewed`).
2. **Upload failure breakdown:** `csv_upload_failed` by `reason`.
3. **Feature usage:** counts of dashboard views, `stock_selected` by `source`, `trading_year_filter_changed`.
4. **Error dashboard:** `$exception` grouped by `$exception_type`; `error_boundary_triggered` grouped by `area`.
5. **Retention** anchored on `csv_upload_completed`.

## Verification done

- `npx tsc --noEmit` ✓ · `npm run build` ✓ · `npx vitest run` — 43/43 ✓ (8 new privacy tests).
- Live consent lifecycle in-browser: first-visit forced choice → Accept persists → **Manage analytics re-opens showing "Analytics on"** → Decline withdraws (`rejected` + `opt_out`).
- Exception scrubbing proven by unit test (avoids sending real data to PostHog cloud).

## Known / out of scope

- **Pre-existing** hydration mismatch on the homepage FAQ JSON-LD `<script>` vs PostHog's lazily-injected `exception-autocapture.js` (from `capture_exceptions: true`). Unrelated to this work; flagged separately.
- No server-side `instrumentation.ts` `onRequestError` added (app is client-side; only `/api/subscribe` exists) — optional follow-up.
- No `posthog.identify` / person profiles — intentional (anonymous, no accounts).
- Vercel Analytics + Speed Insights left in place alongside PostHog.
