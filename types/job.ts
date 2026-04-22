export type JobStatus = 'queued' | 'in-progress' | 'done'
export type JobPriority = 'p1' | 'p2' | 'p3'
export type UserRole = 'am' | 'dev' | 'admin'

export interface User {
  id: string
  name: string
  role: UserRole
  initial: string
  active: boolean
}

export interface Job {
  id: string
  title: string
  description: string | null
  workbook_link: string | null
  asset_links: string[]
  priority: JobPriority
  status: JobStatus
  assigned_to: string        // user id or 'all'
  created_by: string         // user id
  is_fire_alarm: boolean
  due_date: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface CreateJobPayload {
  title: string
  description?: string
  workbook_link: string
  asset_links?: string[]
  priority: JobPriority
  assigned_to: string
  created_by: string
  due_date?: string
}

export interface FireAlarmPayload {
  title: string
  client_context: string     // stored in description
  assigned_to: string
  created_by: string
  workbook_link?: string
}

export const PRIORITY_ORDER: Record<JobPriority, number> = { p1: 0, p2: 1, p3: 2 }

export const PRIORITY_LABEL: Record<JobPriority, string> = { p1: 'P1', p2: 'P2', p3: 'P3' }

export const WORKBOOK_PREFIX = 'https://wb.ogilvy.co.za#'

export function isValidWorkbookLink(link: string): boolean {
  return link.startsWith(WORKBOOK_PREFIX) && link.length > WORKBOOK_PREFIX.length
}

export function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    // Fire alarms first within P1
    if (a.priority === 'p1' && b.priority === 'p1') {
      if (a.is_fire_alarm && !b.is_fire_alarm) return -1
      if (!a.is_fire_alarm && b.is_fire_alarm) return 1
    }
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (pDiff !== 0) return pDiff
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return a.created_at.localeCompare(b.created_at)
  })
}

export function isOverdue(job: Job): boolean {
  if (!job.due_date) return false
  if (job.status === 'done') return false
  return new Date(job.due_date) < new Date(new Date().toDateString())
}

export function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

export const JOB_TYPES = [
  'Content update',
  'HTML emailer',
  'Bug fix',
  'Urgent fix',
  'New asset upload',
  'Campaign page',
  'Copy change',
  'Other',
] as const
