// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createContact, ResendMock } = vi.hoisted(() => {
  const createContact = vi.fn()
  const ResendMock = vi.fn(function (this: { contacts: { create: typeof createContact } }) {
    this.contacts = { create: createContact }
  })
  return { createContact, ResendMock }
})

vi.mock('resend', () => ({ Resend: ResendMock }))

import { POST } from './route'

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    createContact.mockReset()
    ResendMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 503 when RESEND_API_KEY is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const res = await POST(jsonRequest({ email: 'user@example.com' }))

    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'Subscriptions are unavailable' })
    expect(ResendMock).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid email', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')

    const res = await POST(jsonRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid email' })
    expect(createContact).not.toHaveBeenCalled()
  })

  it('returns 400 for a body that is not valid JSON', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')

    const res = await POST(jsonRequest('{not json'))

    expect(res.status).toBe(400)
    expect(createContact).not.toHaveBeenCalled()
  })

  it('creates the contact and returns 200 when the key is set', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    createContact.mockResolvedValue({ data: { id: 'contact_1' }, error: null })

    const res = await POST(jsonRequest({ email: 'user@example.com' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(ResendMock).toHaveBeenCalledWith('re_test')
    expect(createContact).toHaveBeenCalledWith({ email: 'user@example.com', unsubscribed: false })
  })

  it('returns 500 when Resend returns an error', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    createContact.mockResolvedValue({ data: null, error: { message: 'boom', name: 'application_error' } })

    const res = await POST(jsonRequest({ email: 'user@example.com' }))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to subscribe' })
  })
})
