import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { isValidWorkbookLink } from '@/types/job'
import { sendNewJobEmail, sendFireAlarmEmail } from '@/lib/email'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('GET /api/jobs:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/jobs unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title, description, workbook_link, asset_links,
      priority, assigned_to, created_by, due_date, is_fire_alarm,
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!created_by) {
      return NextResponse.json({ error: 'created_by is required' }, { status: 400 })
    }
    if (!is_fire_alarm && !workbook_link) {
      return NextResponse.json({ error: 'workbook_link is required' }, { status: 400 })
    }
    if (workbook_link && !isValidWorkbookLink(workbook_link)) {
      return NextResponse.json(
        { error: 'Workbook link must start with https://wb.ogilvy.co.za#' },
        { status: 400 }
      )
    }

    const payload = {
      title: title.trim(),
      description: description || null,
      workbook_link: workbook_link || null,
      asset_links: asset_links || [],
      priority: is_fire_alarm ? 'p1' : (priority || 'p2'),
      status: 'queued',
      assigned_to: assigned_to || 'all',
      created_by,
      is_fire_alarm: !!is_fire_alarm,
      due_date: due_date || null,
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('POST /api/jobs:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Send email notifications
    try {
      // Get recipients — assigned dev(s) or all devs
      let recipientQuery = supabase
        .from('users')
        .select('name, email')
        .eq('active', true)
        .not('email', 'is', null)

      if (payload.assigned_to === 'all') {
        recipientQuery = recipientQuery.in('role', ['dev', 'admin'])
      } else {
        recipientQuery = recipientQuery.eq('id', payload.assigned_to)
      }

      const { data: recipients } = await recipientQuery

      // Get creator name
      const { data: creator } = await supabase
        .from('users')
        .select('name')
        .eq('id', payload.created_by)
        .single()

      if (recipients && creator) {
        const emailFn = payload.is_fire_alarm ? sendFireAlarmEmail : sendNewJobEmail
        await Promise.all(
          recipients
            .filter(r => r.email)
            .map(r => emailFn({
              toEmail: r.email,
              toName: r.name,
              jobTitle: payload.title,
              ...(payload.is_fire_alarm
                ? { raisedBy: creator.name, description: payload.description }
                : { createdBy: creator.name, priority: payload.priority, description: payload.description }
              ),
            }))
        )
      }
    } catch (emailErr) {
      // Don't fail the request if email fails — log and continue
      console.error('Email notification failed:', emailErr)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('POST /api/jobs unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
