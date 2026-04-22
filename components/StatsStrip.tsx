'use client'

import { Job, isOverdue } from '@/types/job'

interface StatsStripProps {
  jobs: Job[]
}

export default function StatsStrip({ jobs }: StatsStripProps) {
  const queued = jobs.filter(j => j.status === 'queued').length
  const inProgress = jobs.filter(j => j.status === 'in-progress').length
  const doneToday = jobs.filter(j =>
    j.status === 'done' && j.completed_at &&
    new Date(j.completed_at).toDateString() === new Date().toDateString()
  ).length
  const p1Open = jobs.filter(j => j.priority === 'p1' && j.status !== 'done').length
  const overdue = jobs.filter(j => isOverdue(j)).length
  const atCap = inProgress >= 3

  return (
    <div className="bg-[#0F0F0F] border-b border-white/10">
      <div className="flex items-center px-6 py-2.5 gap-6 text-xs font-mono flex-wrap">
        <span className="text-gray-400">
          Queued: <span className="text-white font-semibold">{queued}</span>
        </span>
        <span className="text-gray-400">
          In Progress:{' '}
          <span className={`font-semibold ${atCap ? 'text-red-400' : 'text-white'}`}>
            {inProgress} / 3
          </span>
        </span>
        <span className="text-gray-400">
          Done Today: <span className="text-white font-semibold">{doneToday}</span>
        </span>
        {p1Open > 0 && (
          <span className="text-gray-400">
            P1 Open: <span className="text-red-400 font-semibold">{p1Open}</span>
          </span>
        )}
        {overdue > 0 && (
          <span className="text-gray-400">
            Overdue: <span className="text-amber-400 font-semibold">{overdue}</span>
          </span>
        )}
      </div>
    </div>
  )
}
