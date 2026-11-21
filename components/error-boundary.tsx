'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { CircleAlert } from '@/components/icons'
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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
        <div
          role="alert"
          className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-24"
        >
          <CircleAlert size={24} className="text-muted-foreground" />
          <h2 className="heading-page mt-4">Something went wrong</h2>
          <p className="mt-3 text-base text-muted-foreground">
            This part of the page could not load. Try again first, as reloading clears the file you uploaded.
          </p>
          {this.state.error?.message && (
            <p className="mt-3 max-w-full break-words text-xs font-normal text-muted-foreground">
              {this.state.error.message}
            </p>
          )}
          <Button className="mt-8" onClick={() => this.setState({ hasError: false, error: undefined })}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

