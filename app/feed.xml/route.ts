import { getArticles } from '@/lib/articles'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vizvest.cc'

export const dynamic = 'force-dynamic'

export function GET() {
  const articles = getArticles()

  const items = articles
    .map((article) => {
      const url = `${SITE_URL}/articles/${article.slug}`
      const pubDate = new Date(article.date).toUTCString()
      const tags = article.tags.map((t) => `<category>${t}</category>`).join('')
      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${article.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${tags}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vizvest Articles</title>
    <link>${SITE_URL}/articles</link>
    <description>Portfolio tracking and dividend investing insights for Trading 212 users.</description>
    <language>en-gb</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
