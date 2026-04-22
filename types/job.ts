export type JobStatus =
  | 'queued'
  | 'in-progress'
  | 'done'
  | 'live'

export type JobType =
  | 'Content update'
  | 'HTML emailer'
  | 'Bug fix'
  | 'Urgent fix'
  | 'New asset upload'
  | 'Campaign page'
  | 'Copy change'
  | 'Other'

export interface Job {
  id: string
  title: string
  client: string | null
  description: string | null
  type: JobType | null
  priority: 'p1' | 'p2' | 'p3'
  status: JobStatus
  am: string | null
  due_date: string | null
  workbook_link: string | null
  is_fire_alarm: boolean
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface CreateJobPayload {
  title: string
  description?: string
  client?: string
  type?: JobType
  priority?: 'p1' | 'p2' | 'p3'
  workbook_link?: string
  due_date?: string
  am?: string
}

export interface FireAlarmPayload {
  title: string
  client: string
  workbook_link?: string
}

export const PRIORITY_ORDER: Record<'p1' | 'p2' | 'p3', number> = {
  p1: 0,
  p2: 1,
  p3: 2,
}

export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  'queued':      ['in-progress'],
  'in-progress': ['done'],
  'done':        ['live'],
  'live':        [],
}

export const WORKBOOK_LINK_PREFIX = 'https://wb.ogilvy.co.za#'

export function isValidWorkbookLink(link: string): boolean {
  return link.startsWith(WORKBOOK_LINK_PREFIX) && link.length > WORKBOOK_LINK_PREFIX.length
}

export function assignZone(job: Job): 'queue' | 'in-progress' | 'done' {
  if (job.status === 'queued') return 'queue'
  if (job.status === 'in-progress') return 'in-progress'
  return 'done'
}

export function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (pDiff !== 0) return pDiff
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return a.created_at.localeCompare(b.created_at)
  })
}

export const JOB_TYPES: JobType[] = [
  'Content update',
  'HTML emailer',
  'Bug fix',
  'Urgent fix',
  'New asset upload',
  'Campaign page',
  'Copy change',
  'Other',
]

export const STATUS_LABELS: Record<JobStatus, string> = {
  'queued':      'Queued',
  'in-progress': 'In Progress',
  'done':        'Done',
  'live':        'Live',
}
