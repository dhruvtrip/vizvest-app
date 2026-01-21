'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getConsentStatus, setConsentStatus } from '@/lib/posthog-privacy'

export function PostHogConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already given consent
    const consent = getConsentStatus()
    if (consent === null) {
      // Show banner if no consent has been given
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    setConsentStatus(true)
    setShowBanner(false)

    // Opt in to PostHog (safe to call even if not fully loaded yet)
    if (typeof window !== 'undefined') {
      try {
        posthog.opt_in_capturing()
      } catch (error) {
        // PostHog might not be fully initialized yet, but consent is saved
        console.debug('PostHog opt-in called before initialization')
      }
    }
  }

  const handleReject = () => {
    setConsentStatus(false)
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

  if (!mounted || !showBanner) {
    return null
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <Alert className={cn(
              'shadow-lg border-2',
              'bg-background/95 backdrop-blur-sm'
            )}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 space-y-2">
                  <AlertDescription className="text-sm">
                    <p className="font-medium mb-1">Privacy & Analytics</p>
                    <p className="text-muted-foreground">
                      We use analytics to improve your experience. We <strong>never</strong> collect
                      sensitive portfolio data like stock tickers, amounts, or financial information.
                    </p>
                  </AlertDescription>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    className="flex-1 sm:flex-none hover:bg-transparent hover:text-foreground hover:border-input"
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="flex-1 sm:flex-none"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
