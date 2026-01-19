import posthog from 'posthog-js'

// Only initialize PostHog in production and not on localhost
if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost:3000'

  if (!isLocalhost && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: '/ingest',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2025-11-30',
      capture_exceptions: true,
      debug: false,
    })
  }
}
