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

  const stats = [
    { label: 'Queued', value: String(queued), color: 'text-[#7EB8E8]', alert: false },
    {
      label: 'In Progress',
      value: `${inProgress} / 3`,
      color: atCap ? 'text-[#E87878]' : 'text-[#7EC87E]',
      alert: atCap,
    },
    { label: 'Done Today', value: String(doneToday), color: 'text-[#5A9A5A]', alert: false },
    ...(p1Open > 0 ? [{ label: 'P1 Open', value: String(p1Open), color: 'text-[#E87878]', alert: true }] : []),
    ...(overdue > 0 ? [{ label: 'Overdue', value: String(overdue), color: 'text-[#D4B870]', alert: true }] : []),
  ]

  return (
    <div className="bg-[#0D1017] border-b border-[#1E2535]">
      <div className="flex items-center px-6 py-3 gap-0 flex-wrap">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center">
            <div className="flex items-center gap-2.5 px-4">
              <span className="text-[11px] font-medium text-[#505060] uppercase tracking-wider">{stat.label}</span>
              <span
                className={`text-sm font-bold font-mono tabular-nums ${stat.color} ${stat.alert ? 'animate-pulse' : ''}`}
              >
                {stat.value}
              </span>
            </div>
            {i < stats.length - 1 && (
              <div className="w-px h-4 bg-[#252D3D]" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
