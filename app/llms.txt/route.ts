import { getArticles } from '@/lib/articles'
import { llmsArticleList, llmsFaqs, llmsIntro, textResponse } from '@/lib/llms'
import { absoluteUrl } from '@/lib/site'

// Hourly, so scheduled articles are listed on their publish date.
export const revalidate = 3600

export function GET() {
  return textResponse([
    ...llmsIntro(),
    ...llmsArticleList(getArticles()),
    ...llmsFaqs(),
    '## Optional',
    '',
    `- [Full text of every guide](${absoluteUrl('/llms-full.txt')}): all articles as Markdown in one file.`,
    `- [RSS feed](${absoluteUrl('/feed.xml')})`,
    '',
  ])
}
