import posthog from 'posthog-js'
import { filterSensitiveProperties, validateEvent, getConsentStatus } from '@/lib/posthog-privacy'

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

      // Privacy & GDPR Compliance Settings
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,

      // Disable session recording to protect sensitive portfolio data
      disable_session_recording: true,

      // GDPR: Start with opt-out by default, then opt-in after initialization
      opt_out_capturing_by_default: true,

      // Exception capture is still enabled for error tracking (but sanitized)
      capture_exceptions: true,
      debug: false,

      before_send: (event) => {
        if (!validateEvent(event)) {
          return null
        }

        const hasConsented = getConsentStatus() === 'accepted'

        const sanitized = filterSensitiveProperties(event, hasConsented)

        if (sanitized.properties) {
          delete sanitized.properties.$ip
        }

        return sanitized
      },

      // After PostHog is loaded, wait for user consent
      loaded: (posthog) => {
        const consent = getConsentStatus()
        if (consent === 'accepted') {
          posthog.opt_in_capturing()
        } else if (consent === 'rejected') {
          posthog.opt_out_capturing()
        }
      },
    })
  }
}
