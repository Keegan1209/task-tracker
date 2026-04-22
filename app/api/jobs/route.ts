import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { isValidWorkbookLink } from '@/types/job'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const includeLive = searchParams.get('include_live') === 'true'

  try {
    let query = supabase
      .from('jobs')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })

    if (!includeLive) {
      query = query.neq('status', 'live')
    }

    const { data, error } = await query

    if (error) {
      console.error('GET /api/jobs error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/jobs unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, client, type, priority, am, workbook_link, due_date, is_fire_alarm } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
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
      client: client || null,
      type: is_fire_alarm ? 'Urgent fix' : (type || null),
      priority: is_fire_alarm ? 'p1' : (priority || 'p2'),
      am: am || null,
      status: 'queued',
      is_fire_alarm: !!is_fire_alarm,
      workbook_link: workbook_link || null,
      due_date: due_date || null,
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('POST /api/jobs error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('POST /api/jobs unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
