import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: 'CMS Job Tracker <notifications@belooshaeb.resend.app>',
      to: 'delivered@resend.dev', // Resend's test address — always succeeds
      subject: 'CMS Job Tracker — test email',
      html: '<p>Email sending is working.</p>',
    })
    return NextResponse.json({ success: true, result })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
