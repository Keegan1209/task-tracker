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
    <div className="bg-[#101319] border-b border-[#2A2A2A]">
      <div className="flex items-center px-6 py-2.5 gap-6 flex-wrap">
        <Stat label="Queued" value={queued} color="text-[#7EB8E8]" />
        <Stat
          label="In Progress"
          value={`${inProgress} / 3`}
          color={atCap ? 'text-[#E87878]' : 'text-[#7EC87E]'}
          alert={atCap}
        />
        <Stat label="Done Today" value={doneToday} color="text-[#5A9A5A]" />
        {p1Open > 0 && <Stat label="P1 Open" value={p1Open} color="text-[#E87878]" alert />}
        {overdue > 0 && <Stat label="Overdue" value={overdue} color="text-[#D4B870]" alert />}
      </div>
    </div>
  )
}

function Stat({ label, value, color, alert }: {
  label: string
  value: string | number
  color: string
  alert?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#606060]">{label}</span>
      <span className={`text-xs font-bold font-mono tabular-nums ${color} ${alert ? 'animate-pulse' : ''}`}>
        {value}
      </span>
    </div>
  )
}
