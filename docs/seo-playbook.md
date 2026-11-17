# SEO and AI-visibility playbook

How the site is set up for search engines and AI assistants, and the rules for writing articles.

## Indexing fixes (November 2026)

1. **Canonical host.** Vercel redirects `vizvest.cc` → `www.vizvest.cc`, but canonical tags, `og:url`, sitemap `<loc>` entries and the robots `Sitemap:` line all used `https://vizvest.cc`. Each www page pointed its canonical at a URL that redirects back to it, which stops Google indexing it. Everything now uses `https://www.vizvest.cc` from `lib/site.ts`.
2. **Inherited canonical.** The root layout set `canonical: '/'`. `/articles`, `/dashboard` and `/privacy` didn't override it, so all three declared themselves duplicates of the home page. Every page now sets its own canonical through `pageMetadata()` in `lib/metadata.ts`.
3. **Hero hidden until JavaScript loaded.** The home `<h1>` was in a framer-motion `Reveal`, server-rendered at `opacity: 0`, which delayed Largest Contentful Paint. It now uses the CSS-only `t-rise-in` animation.
4. **Render-blocking CSS.** `experimental.inlineCss` inlines the stylesheet.

## What's in the code

| Area | Where |
|---|---|
| Canonical host and site identity | `lib/site.ts` (`NEXT_PUBLIC_SITE_URL` is no longer read) |
| Per-page metadata, canonical, Open Graph | `lib/metadata.ts` |
| Sitemap with real `lastmod` dates | `app/sitemap.ts` |
| robots.txt with search and AI crawlers named | `app/robots.ts` |
| llms.txt and llms-full.txt (full article text) | `app/llms.txt`, `app/llms-full.txt`, `lib/llms.ts` |
| Social share images | `app/opengraph-image.tsx`, `app/articles/[slug]/opengraph-image.tsx` |
| Structured data | Organization + WebSite (layout), WebApplication + FAQPage (home), BlogPosting + BreadcrumbList + FAQPage (articles), CollectionPage (articles index), AboutPage + Person (about) |
| Scheduled articles | `lib/articles.ts` `isLive()`: an article with a future `date` goes live on that day (pages revalidate hourly) |
| Internal links | "Guides" section on the home page, "Keep reading" on every article, About and Terms in the footer |
| E-E-A-T and legal | `/about` (who makes Vizvest, editorial standards, independence from Trading 212), `/terms` (no advice, errors possible, no warranty, limitation of liability), footer disclaimer |

When a static page's content changes, update its date constant in `app/sitemap.ts`. A `lastmod` that moves on every deploy teaches Google to ignore it.

## Content rules

- **No tax content.** The site does not write about tax: no rates, allowances, capital gains, reporting, or ISA tax treatment. Withholding tax may be mentioned only as data in the export. If tax comes up, use at most one line: "Vizvest doesn't cover tax. For anything tax-related, speak to a qualified tax adviser."
- Only claim features listed in the README and present in the code. Vizvest does not show unrealised P&L, market value, live prices or yield on cost.
- Check Trading 212 facts against helpcentre.trading212.com and link the source. Never invent statistics or quotes; label worked examples as examples.
- Answer the title's question in the first paragraph (AI assistants quote it), use question-style H2s, and add 4 to 6 FAQs in the frontmatter.
- British English, no em or en dashes as punctuation, plain Markdown (GFM tables are fine).
- Only link to articles dated on or before your own, or the link 404s until the target goes live.

## Publishing schedule

| Date | Article |
|---|---|
| Live | Export guide, dividend tracker, portfolio tracker, fees explained |
| 24 Nov 2026 | Trading 212 trading history: how to analyse your trades |
| 1 Dec 2026 | Trading 212 pie performance |
| 8 Dec 2026 | Trading 212 profit and loss explained |
| 15 Dec 2026 | Trading 212 currency: how FX rates change your returns |

To schedule an article, give it a future `date`. It stays hidden (404, not in sitemap, RSS or llms.txt) until 00:00 UTC that day, then appears within the hour.
