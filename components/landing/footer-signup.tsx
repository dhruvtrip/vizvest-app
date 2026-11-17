'use client'

import { useId, useState } from 'react'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SuccessCheck, useShake } from '@/components/motion'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function FooterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const inputId = useId()
  const errorId = useId()
  const { ref: formRef, shake } = useShake<HTMLFormElement>()

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
      shake()
      posthog.capture('footer_signup_error')
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3 lg:max-w-none">
      <label htmlFor={inputId} className="text-sm text-muted-foreground">
        New features and portfolio insights, in your inbox.
      </label>

      {status === 'success' ? (
        <p role="status" className="flex h-10 items-center gap-2 text-sm font-medium">
          <SuccessCheck size={20} className="text-up" />
          You&apos;re on the list.
        </p>
      ) : (
        <>
          <form ref={formRef} onSubmit={handleSubmit} className="flex w-full flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center">
            <Input
              id={inputId}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? errorId : undefined}
              className="min-[400px]:min-w-0 min-[400px]:flex-1"
            />
            <Button type="submit" size="lg" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing' : 'Notify me'}
            </Button>
          </form>
          {status === 'error' && (
            <p id={errorId} role="alert" className="text-sm font-normal text-destructive">
              That didn&apos;t go through. Please try again.
            </p>
          )}
        </>
      )}
    </div>
  )
}
