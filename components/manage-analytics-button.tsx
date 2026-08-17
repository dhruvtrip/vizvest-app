'use client'

/**
 * A small client control that re-opens the analytics consent banner so a user
 * can change or withdraw a previous choice. GDPR (Art. 7(3)) requires that
 * withdrawing consent be as easy as giving it — this is the persistent entry
 * point for that, surfaced in the footer and on the privacy page.
 *
 * It dispatches the `posthog-open-consent` event that PostHogConsentBanner
 * listens for; it intentionally holds no PostHog logic of its own.
 */

export const OPEN_CONSENT_EVENT = 'posthog-open-consent'

interface ManageAnalyticsButtonProps {
  className?: string
  children?: React.ReactNode
}

export function ManageAnalyticsButton({
  className,
  children = 'Manage analytics',
}: ManageAnalyticsButtonProps) {
  const openConsent = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT))
    }
  }

  return (
    <button type="button" onClick={openConsent} className={className}>
      {children}
    </button>
  )
}
