// Tells Bing (and other IndexNow engines: Yandex, Seznam, Naver) which URLs
// changed, so they recrawl without waiting for the sitemap.
// https://www.indexnow.org/documentation
//
//   node scripts/indexnow.mjs            submit every URL in the live sitemap
//   node scripts/indexnow.mjs --recent   only URLs whose lastmod is in the last 2 days
//
// The key is public by design: IndexNow checks that it is served at
// https://www.vizvest.cc/<key>.txt to prove we own the site.

const SITE = 'https://www.vizvest.cc'
const HOST = 'www.vizvest.cc'
const KEY = '96a1240b1ce53b082aa87e52b755d2dd'
const RECENT_MS = 2 * 24 * 60 * 60 * 1000

async function sitemapEntries() {
  const res = await fetch(`${SITE}/sitemap.xml`)
  if (!res.ok) throw new Error(`sitemap: HTTP ${res.status}`)
  const xml = await res.text()
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    url: block.match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }))
}

async function main() {
  const recentOnly = process.argv.includes('--recent')
  const entries = (await sitemapEntries()).filter((e) => e.url)
  const urls = entries
    .filter((e) => !recentOnly || (e.lastmod && Date.now() - new Date(e.lastmod).getTime() < RECENT_MS))
    .map((e) => e.url)

  if (urls.length === 0) {
    console.log('IndexNow: nothing changed recently, nothing to submit.')
    return
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
  })

  // 200 = accepted, 202 = accepted and key validation pending.
  console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL(s)`)
  urls.forEach((u) => console.log(`  ${u}`))
  if (res.status !== 200 && res.status !== 202) {
    console.error(await res.text())
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
