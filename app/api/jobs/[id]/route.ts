import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { VALID_TRANSITIONS, isValidWorkbookLink, JobStatus } from '@/types/job'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status: newStatus, workbook_link, ...rest } = body

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { ...rest }

    if (workbook_link !== undefined) {
      if (workbook_link && !isValidWorkbookLink(workbook_link)) {
        return NextResponse.json(
          { error: 'Workbook link must start with https://wb.ogilvy.co.za#' },
          { status: 400 }
        )
      }
      updates.workbook_link = workbook_link || null
    }

    if (newStatus && newStatus !== job.status) {
      const validNext = VALID_TRANSITIONS[job.status as JobStatus] || []
      if (!validNext.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from ${job.status} to ${newStatus}` },
          { status: 400 }
        )
      }

      // Workbook link required to go live
      const effectiveLink = updates.workbook_link !== undefined ? updates.workbook_link : job.workbook_link
      if (newStatus === 'live' && !effectiveLink) {
        return NextResponse.json(
          { error: 'Add the Workbook job link before marking this live' },
          { status: 400 }
        )
      }

      updates.status = newStatus
      if (newStatus === 'done' || newStatus === 'live') {
        updates.completed_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PATCH /api/jobs/[id] error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /api/jobs/[id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase.from('jobs').delete().eq('id', params.id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/jobs/[id] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
