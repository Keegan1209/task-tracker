'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'
import { Job } from '@/types/job'
import DayPanel from './DayPanel'
import { User } from '@/types/job'

interface CalendarGridProps {
  month: Date
  jobs: Job[]
  users: User[]
}

const PRIORITY_PILL_BG: Record<string, string> = {
  p1: 'bg-[#2A1515] border-l-2 border-[#E24B4A] text-[#E87878]',
  p2: 'bg-[#2A2010] border-l-2 border-[#D4A843] text-[#D4B870]',
  p3: 'bg-[#1E1E1E] border-l-2 border-[#444] text-[#888780]',
}

// CI accent colour for density fill
const CI = '91, 155, 213' // #5B9BD5 in RGB

function densityStyle(count: number): React.CSSProperties {
  if (count === 0) return {}
  if (count <= 2) return { backgroundColor: `rgba(${CI}, 0.06)` }
  if (count <= 4) return { backgroundColor: `rgba(${CI}, 0.12)` }
  return { backgroundColor: `rgba(${CI}, 0.22)`, boxShadow: `inset 0 0 0 1px rgba(${CI}, 0.25)` }
}

export default function CalendarGrid({ month, jobs, users }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start so Monday = col 0
  const startDow = (getDay(monthStart) + 6) % 7 // 0=Mon
  const paddedDays: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...days,
  ]
  // Pad end to complete last row
  while (paddedDays.length % 7 !== 0) paddedDays.push(null)

  function getBriefedJobs(day: Date): Job[] {
    return jobs.filter(j => isSameDay(new Date(j.created_at), day))
  }

  function getCompletedJobs(day: Date): Job[] {
    return jobs.filter(j => j.completed_at && isSameDay(new Date(j.completed_at), day))
  }

  function handleDayClick(day: Date) {
    setSelectedDate(day)
    setPanelOpen(true)
  }

  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-[#252D3D]">
        {DOW_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-medium text-[#505060] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto">
        {paddedDays.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`empty-${i}`}
                className="min-h-[110px] border-b border-r border-[#1A1F2A]"
              />
            )
          }

          const briefed = getBriefedJobs(day)
          const completed = getCompletedJobs(day)
          const allPills = [
            ...briefed.map(j => ({ type: 'briefed' as const, job: j })),
            ...completed.map(j => ({ type: 'completed' as const, job: j })),
          ]
          const totalCount = allPills.length
          const visiblePills = allPills.slice(0, 2)
          const overflow = totalCount - 2

          const today = isToday(day)

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              style={densityStyle(totalCount)}
              className={`
                min-h-[110px] border-b border-r border-[#1A1F2A] p-2 cursor-pointer
                hover:bg-white/5 transition-colors group
                ${today ? 'ring-inset ring-1 ring-[#5B9BD5]/40' : ''}
              `}
            >
              {/* Date number */}
              <div className={`
                text-xs font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full
                ${today
                  ? 'bg-[#5B9BD5] text-white'
                  : 'text-[#A0A0A0] group-hover:text-white'
                }
              `}>
                {format(day, 'd')}
              </div>

              {/* Pills */}
              <div className="space-y-0.5">
                {visiblePills.map(({ type, job }, idx) => (
                  type === 'briefed' ? (
                    <div
                      key={`b-${job.id}-${idx}`}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate leading-tight ${PRIORITY_PILL_BG[job.priority]}`}
                      title={job.title}
                    >
                      {job.title}
                    </div>
                  ) : (
                    <div
                      key={`c-${job.id}-${idx}`}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate leading-tight bg-[#1A3A1A] border-l-2 border-[#5CB85C] text-[#7EC87E]"
                      title={`✓ ${job.title}`}
                    >
                      ✓ {job.title}
                    </div>
                  )
                ))}

                {overflow > 0 && (
                  <div className="text-[10px] text-[#5B9BD5] font-medium px-1 pt-0.5">
                    +{overflow} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Day panel */}
      <DayPanel
        date={selectedDate}
        jobs={jobs}
        users={users}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </>
  )
}
