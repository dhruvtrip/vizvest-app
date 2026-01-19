'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

// This provider only wraps the app with the PostHog context for hooks like usePostHog
export function PostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PHProvider client={posthog}>
            {children}
        </PHProvider>
    )
}
