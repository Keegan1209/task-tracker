'use client'

import { format, differenceInHours, differenceInDays } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Job, User } from '@/types/job'

interface DayPanelProps {
  date: Date | null
  jobs: Job[]
  users: User[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRIORITY_BADGE: Record<string, string> = {
  p1: 'bg-[#2A1515] text-[#E87878] border border-[#4A2020]',
  p2: 'bg-[#2A2010] text-[#D4B870] border border-[#4A3A15]',
  p3: 'bg-[#1E1E1E] text-[#888780] border border-[#333]',
}

function formatTs(iso: string | null): string {
  if (!iso) return '—'
  return format(new Date(iso), 'EEE d MMM yyyy, HH:mm')
}

function calcDuration(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const s = new Date(start)
  const e = new Date(end)
  const totalHours = (e.getTime() - s.getTime()) / 1000 / 60 / 60
  const days = Math.floor(totalHours / 24)
  const hours = Math.floor(totalHours % 24)
  return `${days}d ${hours}h`
}

export default function DayPanel({ date, jobs, users, open, onOpenChange }: DayPanelProps) {
  if (!date) return null

  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  // Jobs active on this date: created_at <= date AND (completed_at >= date OR completed_at IS NULL)
  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)
  const dateEnd = new Date(date)
  dateEnd.setHours(23, 59, 59, 999)

  const activeJobs = jobs.filter(j => {
    const created = new Date(j.created_at)
    const completed = j.completed_at ? new Date(j.completed_at) : null
    return created <= dateEnd && (completed === null || completed >= dateStart)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{format(date, 'EEEE, d MMMM yyyy')}</SheetTitle>
          <SheetDescription>{activeJobs.length} job{activeJobs.length !== 1 ? 's' : ''} active on this date</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-100px)] px-6 py-4 space-y-3">
          {activeJobs.length === 0 ? (
            <p className="text-sm text-[#606060] text-center py-12">No jobs active on this date</p>
          ) : (
            activeJobs.map(job => {
              const assignedUser = job.assigned_to === 'all' ? null : userMap[job.assigned_to]
              const createdByUser = userMap[job.created_by]
              const duration = calcDuration(job.started_at, job.completed_at)

              return (
                <div
                  key={job.id}
                  className="bg-[#1C2230] border border-[#252D3D] rounded-lg p-4 space-y-2.5"
                  style={{ borderLeft: `3px solid ${job.priority === 'p1' ? '#E24B4A' : job.priority === 'p2' ? '#D4A843' : '#444'}` }}
                >
                  {/* Title + priority */}
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded-full font-bold ${PRIORITY_BADGE[job.priority]}`}>
                      {job.priority.toUpperCase()}
                    </span>
                    <p className="text-sm font-semibold text-white leading-snug">{job.title}</p>
                  </div>

                  {/* Timestamps */}
                  <div className="space-y-1 text-xs">
                    <div className="flex gap-2">
                      <span className="text-[#505060] w-20 shrink-0">Briefed</span>
                      <span className="text-[#C0C0C0] font-mono">{formatTs(job.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#505060] w-20 shrink-0">Started</span>
                      <span className="text-[#C0C0C0] font-mono">{formatTs(job.started_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#505060] w-20 shrink-0">Completed</span>
                      <span className={`font-mono ${job.completed_at ? 'text-[#7EC87E]' : 'text-[#C0C0C0]'}`}>
                        {formatTs(job.completed_at)}
                      </span>
                    </div>
                    {duration && (
                      <div className="flex gap-2">
                        <span className="text-[#505060] w-20 shrink-0">Duration</span>
                        <span className="text-[#D4B870] font-mono font-semibold">{duration}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-[#505060] w-20 shrink-0">Dev</span>
                      <span className="text-[#C0C0C0]">
                        {assignedUser ? assignedUser.name : 'All Devs'}
                      </span>
                    </div>
                  </div>

                  {/* Workbook link */}
                  {job.workbook_link && (
                    <a
                      href={job.workbook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#7EB8E8] hover:text-white border border-[#2A5A8A] rounded px-2.5 py-1 hover:border-[#5B9BD5] transition-colors"
                    >
                      Open in Workbook
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-3 border-t border-[#252D3D] bg-[#161B24]">
          <p className="text-xs text-[#505060]">
            {activeJobs.length} job{activeJobs.length !== 1 ? 's' : ''} active on {format(date, 'd MMM yyyy')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
