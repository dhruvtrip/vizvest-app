import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { error } = await resend.contacts.create({ email, unsubscribed: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
