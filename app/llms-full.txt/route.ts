import { getArticleBySlug, getArticles } from '@/lib/articles'
import { llmsFaqs, llmsIntro, textResponse } from '@/lib/llms'
import { absoluteUrl } from '@/lib/site'

// Hourly, so scheduled articles are included on their publish date.
export const revalidate = 3600

export function GET() {
  const lines = [...llmsIntro(), ...llmsFaqs()]

  for (const { slug } of getArticles()) {
    const article = getArticleBySlug(slug)
    if (!article) continue
    const { meta, content } = article
    lines.push(
      '---',
      '',
      `# ${meta.title}`,
      '',
      `Source: ${absoluteUrl(`/articles/${slug}`)}`,
      `Published: ${meta.date}${meta.lastModified && meta.lastModified !== meta.date ? `. Updated: ${meta.lastModified}` : ''}`,
      '',
      `> ${meta.description}`,
      '',
      content.trim(),
      ''
    )
    if (meta.faqs && meta.faqs.length > 0) {
      lines.push('## FAQs', '', ...meta.faqs.flatMap((f) => [`### ${f.question}`, '', f.answer, '']))
    }
  }

  return textResponse(lines)
}
