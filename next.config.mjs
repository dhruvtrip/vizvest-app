/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Article pages, the sitemap, RSS and llms.txt read content/articles at
  // request time when they revalidate (scheduled articles go live that way),
  // so the MDX files have to ship with the server functions.
  outputFileTracingIncludes: {
    '/**': ['./content/articles/**/*'],
  },
  experimental: {
    // Inline the (small) stylesheet into the HTML so it no longer blocks first
    // render as a separate request. Lighthouse flagged ~150 ms on mobile.
    inlineCss: true,
  },
  async redirects() {
    return [
      // skipTrailingSlashRedirect (needed for PostHog's /ingest proxy) turns
      // off Next's own trailing-slash redirect, so /articles/ served a 200
      // duplicate of /articles. Redirect everything except /ingest ourselves.
      {
        source: '/:path((?!ingest(?:/|$)).+)/',
        destination: '/:path',
        permanent: true,
      },
      { source: '/index', destination: '/', permanent: true },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
}

export default nextConfig
