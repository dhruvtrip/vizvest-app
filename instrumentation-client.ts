import posthog from 'posthog-js'
import { filterSensitiveProperties, validateEvent, getConsentStatus } from '@/lib/posthog-privacy'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost:3000'

  const savedConsent = getConsentStatus()

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: isLocalhost ? process.env.NEXT_PUBLIC_POSTHOG_HOST! : '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2025-11-30',

      // Privacy & GDPR Compliance Settings
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,

      // Disable session recording to protect sensitive portfolio data
      disable_session_recording: true,

      // GDPR: Only opt out if user has explicitly declined.
      // Before consent decision, allow anonymous tracking (no cookies/localStorage)
      // with personal data stripped by the before_send hook.
      opt_out_capturing_by_default: savedConsent === 'rejected',

      // GDPR: Use memory-only persistence until user consents (no cookies or localStorage).
      // This ensures no persistent identifiers are stored without explicit consent.
      persistence: savedConsent === 'accepted' ? 'localStorage+cookie' : 'memory',

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

      // After PostHog is loaded, apply saved consent decision
      loaded: (posthog) => {
        // Tag every event with environment so traffic can be distinguished
        posthog.register({
          environment: isLocalhost ? 'localhost' : 'production',
        })

        if (savedConsent === 'rejected') {
          posthog.opt_out_capturing()
        }
      },
    })
}
