import { FAQS } from '@/components/landing/faq-data'
import type { ArticleMeta } from '@/types/article'
import { absoluteUrl } from '@/lib/site'

/**
 * Text for /llms.txt and /llms-full.txt (https://llmstxt.org). AI assistants
 * quote this, so every claim here must match what the product really does.
 */
export function llmsIntro(): string[] {
  return [
    '# Vizvest',
    '',
    '> Vizvest is a free, browser-based portfolio analyser for Trading 212. Upload one or more Trading 212 CSV exports and see realised profit, dividends net of withholding tax, currency conversion fees and trading activity in one dashboard. The file is processed on your device and never uploaded. No account is needed.',
    '',
    'Vizvest is built for UK and European investors who use Trading 212 Invest and Stocks ISA accounts. It reads the CSV that Trading 212 lets you export from your account history, so it works without connecting to Trading 212 or sharing a login.',
    '',
    '## What Vizvest shows',
    '',
    '- Portfolio overview: buy and sell volume, realised profit, dividends, currency fees, deposits and allocation by holding.',
    "- Realised profit per position, taken from Trading 212's own figures (the Result column).",
    '- Costs: currency conversion fees and withholding tax added up.',
    '- Dividends by month and quarter, net of the tax withheld at source.',
    '- A per-stock page with the full buy, sell and dividend history of any holding.',
    '- Trading activity: a day-by-day heatmap, streaks, busiest month and win rate.',
    '- Multiple exports at once. Trading 212 caps each export at 12 months, so Vizvest merges files and removes overlapping transactions.',
    '- Currency normalisation to one base currency using the FX rate in each CSV row, including pence-priced UK shares.',
    '- A warning when an export looks partial (sells with no matching buys).',
    '',
    '## What Vizvest does not do',
    '',
    '- It does not connect to Trading 212 or any broker API, and it has no live price feed, so it does not show current market value or unrealised gains.',
    '- It does not calculate tax and must not be used for tax purposes. For anything tax-related, consult a qualified tax adviser.',
    '- It does not store data. Refreshing the page clears it.',
    '- It does not give financial advice.',
    '',
    '## Disclaimer',
    '',
    `Vizvest is for information only and is not financial, investment or tax advice. Its figures are worked out from the uploaded export and may contain errors, so they should be checked against official Trading 212 statements. Vizvest is not affiliated with Trading 212. Terms: ${absoluteUrl('/terms')}`,
    '',
    '## Key pages',
    '',
    `- [Home](${absoluteUrl('/')}): what Vizvest is and how it works.`,
    `- [Dashboard](${absoluteUrl('/dashboard')}): upload a Trading 212 CSV and analyse it.`,
    `- [Guides](${absoluteUrl('/articles')}): articles for Trading 212 investors.`,
    `- [About](${absoluteUrl('/about')}): who makes Vizvest and how the guides are written.`,
    `- [Privacy policy](${absoluteUrl('/privacy')}): how data is handled.`,
    `- [Terms of use](${absoluteUrl('/terms')}): disclaimer, no advice, no warranty.`,
    '',
  ]
}

export function llmsArticleList(articles: ArticleMeta[]): string[] {
  if (articles.length === 0) return []
  return [
    '## Guides',
    '',
    ...articles.map((a) => `- [${a.title}](${absoluteUrl(`/articles/${a.slug}`)}): ${a.description}`),
    '',
  ]
}

export function llmsFaqs(): string[] {
  return [
    '## FAQs',
    '',
    ...FAQS.flatMap((faq) => [`### ${faq.question}`, '', faq.answer, '']),
  ]
}

export function textResponse(lines: string[]): Response {
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
