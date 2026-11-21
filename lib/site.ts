/**
 * One place for the site's public identity, used by metadata, structured data,
 * the sitemap, robots.txt, RSS and llms.txt.
 *
 * The canonical host is www. Vercel redirects the apex (vizvest.cc) to
 * www.vizvest.cc, so every canonical URL has to name www or Google sees each
 * page pointing its canonical at a redirect and refuses to index it.
 */
export const SITE_URL = 'https://www.vizvest.cc'

export const SITE_NAME = 'Vizvest'

export const SITE_TITLE = 'Vizvest: Free Trading 212 Portfolio Analyser & Dividend Tracker'

export const SITE_DESCRIPTION =
  'Free Trading 212 portfolio analyser. Upload your CSV export to see dividends, realised profit, fees and every trade in one dashboard. Runs in your browser.'

export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

/** Square brand mark, served by Next from app/icon.png. */
export const LOGO_URL = `${SITE_URL}/icon.png`

/** Absolute URL for a path. The home page keeps its trailing slash
 * (`https://www.vizvest.cc/`), matching how Google lists it. */
export function absoluteUrl(path = '/'): string {
  if (path === '/' || path === '') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
