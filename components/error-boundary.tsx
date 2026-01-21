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

    // Track error with PostHog (only error type/name, not full message)
    posthog.capture('error_boundary_triggered', {
      error_type: sanitized.error_type,
      error_name: sanitized.error_name,
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
              <Button
                variant="outline"
                size="sm"
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

