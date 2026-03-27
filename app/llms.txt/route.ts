import { getArticles } from '@/lib/articles'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vizvest.cc'

export const dynamic = 'force-dynamic'

export function GET() {
  const articles = getArticles()

  const lines: string[] = [
    '# Vizvest',
    '',
    '> Portfolio tracking and dividend investing insights for Trading 212 users.',
    '> Vizvest helps investors visualise and analyse their Trading 212 CSV exports.',
    '',
    `- Homepage: ${SITE_URL}`,
    `- Articles: ${SITE_URL}/articles`,
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
    '## About Vizvest',
    '',
    'Vizvest is a free portfolio analysis tool for Trading 212 users.',
    'Upload your CSV export to visualise holdings, track dividends, and analyse trading activity.',
    ''
  )

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
