import { getArticles } from '@/lib/articles'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vizvest.cc'

export const dynamic = 'force-dynamic'

export function GET() {
  const articles = getArticles()

  const lines: string[] = [
    '# Vizvest',
    '',
    '> Vizvest is a free, privacy-first portfolio analysis tool for Trading 212 users.',
    '> Upload your Trading 212 CSV export to visualise holdings, track dividends, and analyse trading performance — entirely in your browser.',
    '',
    `- Homepage: ${SITE_URL}`,
    `- Dashboard: ${SITE_URL}/dashboard`,
    `- Articles: ${SITE_URL}/articles`,
    '',
    '## What Vizvest Does',
    '',
    'Vizvest transforms Trading 212 CSV exports into interactive charts and insights.',
    'It is designed for UK and European investors who use Trading 212 for stocks, ETFs, and dividend investing.',
    '',
    '### Key Features',
    '',
    '- **Portfolio Overview**: Visualise current holdings, market value, and total P&L with interactive charts.',
    '- **Dividend Tracker**: Track dividend income per stock, calculate yield on cost, and view dividend history.',
    '- **Trading Activity Analysis**: Heatmap of trading patterns to identify behavioural trends.',
    '- **Multi-Currency Support**: Automatic currency normalisation for GBP, USD, and EUR investments.',
    '- **Stock-Level Breakdown**: Per-stock analysis of performance, cost basis, and gains/losses.',
    '',
    '### How It Works',
    '',
    '1. Export your transaction history CSV from Trading 212 (Settings > History > Export).',
    '2. Upload the CSV file to Vizvest — drag and drop or browse.',
    '3. Explore interactive dashboards for your portfolio, dividends, and trading activity.',
    '',
    '### Privacy',
    '',
    'All data processing happens locally in your browser. No data is uploaded to any server.',
    'No account required. Completely free to use.',
    '',
    '### Target Audience',
    '',
    '- Trading 212 users who want better portfolio analytics than the built-in tools.',
    '- Dividend investors tracking yield on cost and income over time.',
    '- UK/European retail investors using ISA or Invest accounts on Trading 212.',
    '',
  ]

  if (articles.length > 0) {
    lines.push('## Articles', '')
    for (const article of articles) {
      lines.push(
        `- [${article.title}](${SITE_URL}/articles/${article.slug}): ${article.description}`
      )
    }
    lines.push('')
  }

  lines.push(
    '## FAQs',
    '',
    '**What format does my data need to be in?** CSV exports from Trading 212 only.',
    '**Is my data stored on your servers?** No. Everything is processed in your browser.',
    '**Is it free?** Yes, completely free with no account required.',
    '**Does it support multiple currencies?** Yes, GBP, USD, and EUR are automatically normalised.',
    ''
  )

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
