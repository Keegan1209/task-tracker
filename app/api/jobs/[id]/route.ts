import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { isValidWorkbookLink, JobStatus } from '@/types/job'
import { sendJobDoneEmail } from '@/lib/email'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, workbook_link, priority, asset_links, description } = body

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    // Status transition
    if (status && status !== job.status) {
      const validStatuses: JobStatus[] = ['queued', 'in-progress', 'done']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status: ${status}` },
          { status: 400 }
        )
      }
      updates.status = status
      // Set timestamps based on transition
      if (status === 'in-progress' && !job.started_at) {
        updates.started_at = new Date().toISOString()
      }
      if (status === 'done') {
        updates.completed_at = new Date().toISOString()
      }
      // Clear timestamps if moving back
      if (status === 'queued') {
        updates.started_at = null
        updates.completed_at = null
      }
    }

    // Workbook link update
    if (workbook_link !== undefined) {
      if (workbook_link && !isValidWorkbookLink(workbook_link)) {
        return NextResponse.json(
          { error: 'Workbook link must start with https://wb.ogilvy.co.za#' },
          { status: 400 }
        )
      }
      updates.workbook_link = workbook_link || null
    }

    // Priority update (AM only action, enforced client-side)
    if (priority) updates.priority = priority

    // Asset links update
    if (asset_links !== undefined) updates.asset_links = asset_links

    // Description update
    if (description !== undefined) updates.description = description || null

    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PATCH /api/jobs/[id]:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Send "job done" email to the AM who created it
    if (updates.status === 'done') {
      try {
        const { data: creator } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', job.created_by)
          .single()

        const { data: completedByUser } = await supabase
          .from('users')
          .select('name')
          .eq('id', body.completed_by || job.created_by)
          .single()

        if (creator?.email) {
          await sendJobDoneEmail({
            toEmail: creator.email,
            toName: creator.name,
            jobTitle: job.title,
            completedBy: completedByUser?.name || 'Dev',
          })
        }
      } catch (emailErr) {
        console.error('Job done email failed:', emailErr)
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /api/jobs/[id] unexpected:', err)
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
    console.error('DELETE /api/jobs/[id] unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
