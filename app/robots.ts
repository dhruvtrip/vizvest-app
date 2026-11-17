import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

// Search and AI crawlers named explicitly so they are welcome even if a
// default is ever tightened. Vizvest wants to be cited by AI assistants.
const NAMED_CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  'Applebot',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
  'cohere-ai',
  'MistralAI-User',
  'CCBot',
]

// Nothing worth indexing lives here: the signup API and the analytics proxy.
const DISALLOW = ['/api/', '/ingest/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: NAMED_CRAWLERS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
