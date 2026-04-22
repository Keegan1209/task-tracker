'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Job, JobStatus, assignZone, sortJobs } from '@/types/job'
import JobCard from './JobCard'
import { FilterType, SortType } from './FilterBar'

interface JobBoardProps {
  jobs: Job[]
  role: 'am' | 'dev'
  filter: FilterType
  sort: SortType
  search: string
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>
  onWorkbookLinkAdd: (jobId: string, link: string) => Promise<void>
}

function applyFilter(jobs: Job[], filter: FilterType, search: string): Job[] {
  let result = jobs
  if (filter === 'p1') result = result.filter(j => j.priority === 'p1')
  else if (filter === 'in-progress') result = result.filter(j => j.status === 'in-progress')
  else if (filter === 'blocked') result = result.filter(j => j.status === 'awaiting-assets')
  else if (filter === 'in-review') result = result.filter(j => j.status === 'in-review')

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(j =>
      j.title.toLowerCase().includes(q) || j.client.toLowerCase().includes(q)
    )
  }
  return result
}

function applySort(jobs: Job[], sort: SortType): Job[] {
  if (sort === 'priority') return sortJobs(jobs)
  if (sort === 'due-date') {
    return [...jobs].sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
  }
  return [...jobs].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

function ZoneHeader({ title, count, muted }: { title: string; count: number; muted?: boolean }) {
  return (
    <div className={`flex items-center gap-2 mb-3 ${muted ? 'opacity-60' : ''}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{count}</span>
    </div>
  )
}

export default function JobBoard({ jobs, role, filter, sort, search, onStatusChange, onWorkbookLinkAdd }: JobBoardProps) {
  const [doneExpanded, setDoneExpanded] = useState(false)

  const filtered = applyFilter(jobs, filter, search)
  const sorted = applySort(filtered, sort)

  const needsInfo = sorted.filter(j => assignZone(j) === 'needs-info')
  const active = sorted.filter(j => assignZone(j) === 'active')
  const done = sorted.filter(j => assignZone(j) === 'done')

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
      {/* Needs Info — AM only */}
      {role === 'am' && (
        <section>
          <ZoneHeader title="Needs Info" count={needsInfo.length} muted />
          {needsInfo.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No jobs waiting on info</p>
          ) : (
            <div className="space-y-2 opacity-75">
              <AnimatePresence>
                {needsInfo.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    role={role}
                    index={i}
                    onStatusChange={onStatusChange}
                    onWorkbookLinkAdd={onWorkbookLinkAdd}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      )}

      {/* Active Queue */}
      <section>
        <ZoneHeader title="Active Queue" count={active.length} />
        {active.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Queue is clear</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {active.map((job, i) => (
                <JobCard
                  key={job.id}
                  job={job}
                  role={role}
                  index={i}
                  onStatusChange={onStatusChange}
                  onWorkbookLinkAdd={onWorkbookLinkAdd}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Done This Week */}
      <section>
        <button
          onClick={() => setDoneExpanded(!doneExpanded)}
          className="flex items-center gap-2 mb-3 group"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
            Done This Week
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{done.length}</span>
          {doneExpanded ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
        </button>

        <AnimatePresence>
          {doneExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {done.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nothing completed yet this week</p>
              ) : (
                <div className="space-y-2 opacity-60">
                  {done.map((job, i) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      role={role}
                      index={i}
                      onStatusChange={onStatusChange}
                      onWorkbookLinkAdd={onWorkbookLinkAdd}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
