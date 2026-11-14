'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, X } from 'lucide-react'
import { EASE } from '@/lib/motion'
import { getConsentStatus, setConsentStatus } from '@/lib/posthog-privacy'
import { OPEN_CONSENT_EVENT } from '@/components/manage-analytics-button'

export function PostHogConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentConsent, setCurrentConsent] = useState<'accepted' | 'rejected' | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
    // Check if user has already given consent
    const consent = getConsentStatus()
    setCurrentConsent(consent)
    if (consent === null) {
      // First visit: show banner until a choice is made
      setShowBanner(true)
    }

    // Allow the banner to be re-opened later (e.g. from the "Manage analytics"
    // control in the footer / privacy page) so consent can be withdrawn or
    // changed as easily as it was given — GDPR Art. 7(3).
    const handleOpenRequest = () => {
      setCurrentConsent(getConsentStatus())
      setShowBanner(true)
    }
    window.addEventListener(OPEN_CONSENT_EVENT, handleOpenRequest)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, handleOpenRequest)
  }, [])

  const handleAccept = () => {
    setConsentStatus(true)
    setCurrentConsent('accepted')
    setShowBanner(false)

    // Opt in and upgrade to persistent storage now that user has consented (GDPR)
    if (typeof window !== 'undefined') {
      try {
        posthog.set_config({ persistence: 'localStorage+cookie' })
        posthog.opt_in_capturing()
        posthog.register({ consent_state: 'accepted' })
      } catch (error) {
        // PostHog might not be fully initialized yet, but consent is saved
        console.debug('PostHog opt-in called before initialization')
      }
    }
  }

  const handleReject = () => {
    setConsentStatus(false)
    setCurrentConsent('rejected')
    setShowBanner(false)

    // Opt out of PostHog (safe to call even if not fully loaded yet)
    if (typeof window !== 'undefined') {
      try {
        posthog.opt_out_capturing()
      } catch (error) {
        // PostHog might not be fully initialized yet, but consent is saved
        console.debug('PostHog opt-out called before initialization')
      }
    }
  }

  // Closing without choosing is only offered once a decision already exists
  // (i.e. the banner was re-opened via "Manage analytics"). On first visit the
  // user must make an explicit choice.
  const handleDismiss = () => setShowBanner(false)
  const hasExistingChoice = currentConsent !== null

  // Only the mount guard returns early; AnimatePresence handles `showBanner`
  // so the panel can play its exit before it unmounts.
  if (!mounted) {
    return null
  }

  // House transition: opacity + 4px blur + 12px rise in 300ms, out in 150ms.
  // Reduced motion keeps only the opacity cross-fade.
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="consent-banner"
          initial={hidden}
          animate={{
            ...shown,
            // Drop the filter once settled so the panel's backdrop blur works
            transitionEnd: reduceMotion ? undefined : { filter: 'none' },
            transition: { duration: 0.3, ease: EASE.smoothOut },
          }}
          exit={{ ...hidden, transition: { duration: 0.15, ease: EASE.out } }}
          className="fixed bottom-3 left-3 right-3 z-[100] sm:bottom-4 sm:left-4 sm:right-auto sm:w-[420px]"
        >
          <Alert className="rounded-xl border-border bg-surface-1/95 p-4 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <Shield
                aria-hidden="true"
                strokeWidth={1.5}
                className="mt-0.5 size-4 shrink-0 text-fg-secondary"
              />

              <div className="min-w-0 flex-1">
                <AlertDescription>
                  <p className="font-medium text-foreground">Privacy &amp; analytics</p>
                  <p className="mt-1 text-pretty">
                    We use analytics to improve your experience. We{' '}
                    <strong className="font-medium text-foreground">never</strong> collect sensitive
                    portfolio data like stock tickers, amounts, or financial information.
                  </p>
                  {hasExistingChoice && (
                    <p className="mt-2">
                      Current setting:{' '}
                      <strong className="font-medium text-foreground">
                        {currentConsent === 'accepted' ? 'Analytics on' : 'Analytics off'}
                      </strong>
                      . You can change it below.
                    </p>
                  )}
                </AlertDescription>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleReject}
                    className="flex-1 sm:flex-none"
                  >
                    {currentConsent === 'rejected' ? 'Keep off' : 'Decline'}
                  </Button>
                  <Button onClick={handleAccept} className="flex-1 sm:flex-none">
                    {currentConsent === 'accepted' ? 'Keep on' : 'Accept'}
                  </Button>
                </div>
              </div>

              {hasExistingChoice && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  aria-label="Close without changing analytics settings"
                  className="-mr-1.5 -mt-1.5 size-7 shrink-0 text-fg-secondary"
                >
                  <X strokeWidth={1.5} />
                </Button>
              )}
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
