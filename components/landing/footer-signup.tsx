'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function FooterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

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
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          New features and portfolio insights, in your inbox.
        </p>
      </div>

      {status === 'success' ? (
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--brand))]" />
          You&apos;re on the list.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              className="h-9 w-56 text-sm"
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="h-9 px-4 text-sm bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90 cursor-pointer shrink-0"
            >
              {status === 'loading' ? 'Subscribing…' : 'Notify me'}
            </Button>
          </form>
          {status === 'error' && (
            <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
          )}
        </div>
      )}
    </div>
  )
}
