import { getArticles, getLatestArticleDate } from '@/lib/articles'
import { SITE_URL } from '@/lib/site'

// Hourly, so scheduled articles enter the feed on their publish date.
export const revalidate = 3600

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
    <description>Guides for Trading 212 investors: exports, dividends, tax, fees and portfolio tracking.</description>
    <language>en-gb</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${(getLatestArticleDate() ?? new Date()).toUTCString()}</lastBuildDate>
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
