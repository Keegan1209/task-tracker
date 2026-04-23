import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

function fmt(ts: string | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const hrs = (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60 / 60
  return hrs.toFixed(1)
}

function escape(val: string): string {
  return `"${String(val ?? '').replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return new Response('Missing from/to params', { status: 400 })
  }

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, priority, status, assigned_to, created_by, workbook_link, created_at, started_at, completed_at')
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Export query error:', error)
    return new Response('DB error', { status: 500 })
  }

  // Resolve user names
  const { data: users } = await supabase
    .from('users')
    .select('id, name')

  const userMap: Record<string, string> = Object.fromEntries(
    (users || []).map(u => [u.id, u.name])
  )

  const headers = [
    'Job Title', 'Priority', 'Status',
    'Assigned To', 'Created By',
    'Briefed Date', 'Started Date', 'Completed Date',
    'Duration (hrs)', 'Workbook Link',
  ]

  const rows = (jobs || []).map(job => [
    job.title ?? '',
    (job.priority ?? '').toUpperCase(),
    job.status ?? '',
    job.assigned_to === 'all' ? 'All Devs' : (userMap[job.assigned_to] ?? job.assigned_to ?? ''),
    userMap[job.created_by] ?? job.created_by ?? '',
    fmt(job.created_at),
    fmt(job.started_at),
    fmt(job.completed_at),
    duration(job.started_at, job.completed_at),
    job.workbook_link ?? '',
  ])

  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="jobs-${from}-to-${to}.csv"`,
    },
  })
}
