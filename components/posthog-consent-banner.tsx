'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X } from '@/components/icons'
import { getConsentStatus, setConsentStatus } from '@/lib/posthog-privacy'
import { OPEN_CONSENT_EVENT } from '@/components/manage-analytics-button'

export function PostHogConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentConsent, setCurrentConsent] = useState<'accepted' | 'rejected' | null>(null)

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

  // Stay mounted once hydrated so the banner can play its exit.
  if (!mounted) {
    return null
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="consent-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
          exit={{ opacity: 0, y: 8, transition: { duration: 0.15, ease: 'easeOut' } }}
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex justify-center"
        >
          <div
            role="alert"
            aria-labelledby="consent-title"
            aria-describedby="consent-description"
            className="pointer-events-auto w-full max-w-[45rem] rounded-3xl border border-foreground/10 bg-background p-5 text-foreground shadow-lift sm:p-6"
          >
            <div className="flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p id="consent-title" className="text-base font-medium">
                    Privacy and analytics
                  </p>
                  {hasExistingChoice && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleDismiss}
                      aria-label="Close without changing analytics settings"
                      className="-mr-1.5 -mt-1 min-[520px]:hidden"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
                <div id="consent-description" className="mt-1.5 space-y-1.5 text-sm font-normal leading-relaxed text-muted-foreground">
                  <p>
                    We use analytics to see which features people use and where Vizvest can improve. Your portfolio
                    data, such as tickers and amounts, is never collected.{' '}
                    <Link
                      href="/privacy"
                      className="rounded-sm text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 ease-ui hover:decoration-foreground"
                    >
                      Privacy policy
                    </Link>
                  </p>
                  {hasExistingChoice && (
                    <p>
                      Current setting:{' '}
                      <strong className="font-medium text-foreground">
                        {currentConsent === 'accepted' ? 'Analytics on' : 'Analytics off'}
                      </strong>
                      . You can change it here.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 min-[520px]:flex min-[520px]:items-center">
                <Button variant="outline" onClick={handleReject} className="w-full min-[520px]:w-24">
                  {currentConsent === 'rejected' ? 'Keep off' : 'Decline'}
                </Button>
                <Button onClick={handleAccept} className="w-full min-[520px]:w-24">
                  {currentConsent === 'accepted' ? 'Keep on' : 'Accept'}
                </Button>
                {hasExistingChoice && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    aria-label="Close without changing analytics settings"
                    className="hidden min-[520px]:inline-flex"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
