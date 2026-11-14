'use client'

import { useId, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function FooterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    posthog.capture('footer_signup_submitted')
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setStatus('success')
      posthog.capture('footer_signup_success')
    } else {
      setStatus('error')
      posthog.capture('footer_signup_error')
    }
  }

  return (
    <div className="flex max-w-[360px] flex-col gap-3">
      <p id={hintId} className="text-p-sm text-fg-secondary">
        New features and portfolio insights, in your inbox.
      </p>

      <div aria-live="polite">
        {status === 'success' ? (
          <p className="flex h-10 items-center gap-2 text-p-sm text-foreground">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 shrink-0 text-brand" />
            You&apos;re on the list.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                aria-describedby={status === 'error' ? `${hintId} ${errorId}` : hintId}
                aria-invalid={status === 'error' || undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className={cn(
                  'min-w-0 flex-1',
                  status === 'error' && 'shadow-[inset_0_0_0_1px_hsl(var(--negative)/0.5)]'
                )}
              />
              <Button type="submit" size="lg" variant="secondary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Subscribing…' : 'Notify me'}
              </Button>
            </form>
            {status === 'error' && (
              <p id={errorId} className="text-p-sm text-negative">
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
