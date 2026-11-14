'use client'

import { Component, ReactNode } from 'react'
import posthog from 'posthog-js'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { sanitizeError } from '@/lib/posthog-privacy'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /**
   * Non-sensitive label for where this boundary sits (e.g. "dividends_dashboard").
   * Sent with the error event so failures can be grouped by area without
   * exposing any message or stack trace.
   */
  area?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)

    // Sanitize error data to prevent sensitive information from being captured
    const sanitized = sanitizeError(error)

    // Track error with PostHog (only error type/name, not full message).
    // `area` + `route` are non-PII grouping context so we can still tell WHERE
    // errors happen without capturing WHAT the user's data was.
    posthog.capture('error_boundary_triggered', {
      error_type: sanitized.error_type,
      error_name: sanitized.error_name,
      area: this.props.area ?? 'unknown',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      // Explicitly do NOT include error.message to avoid capturing sensitive data
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6">
          <Alert className="mx-auto max-w-[560px] rounded-xl p-5 [&>svg]:left-5 [&>svg]:top-[22px] [&>svg]:text-negative [&>svg~*]:pl-7">
            <AlertCircle className="size-4" strokeWidth={1.5} aria-hidden="true" />
            <AlertTitle className="mb-0">Something went wrong</AlertTitle>
            <AlertDescription className="mt-1">
              <p className="text-pretty">{this.state.error?.message || 'An unexpected error occurred'}</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

