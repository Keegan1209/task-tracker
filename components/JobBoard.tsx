'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Job, User, JobPriority, JobStatus, sortJobs, isToday } from '@/types/job'
import JobCard from './JobCard'

interface JobBoardProps {
  jobs: Job[]
  currentUser: User
  users: User[]
  onStart: (jobId: string) => Promise<void>
  onDone: (jobId: string) => Promise<void>
  onDelete: (jobId: string) => Promise<void>
  onPriorityChange: (jobId: string, priority: JobPriority) => Promise<void>
  onStatusChange: (jobId: string, status: JobStatus) => Promise<void>
  onDescriptionUpdate: (jobId: string, description: string) => Promise<void>
  onWorkbookLinkAdd: (jobId: string, link: string) => Promise<void>
}

function SectionHeader({ title, count, alert }: { title: string; count: number; alert?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h2>
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${alert ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
        {count}
      </span>
    </div>
  )
}

export default function JobBoard({
  jobs, currentUser, users,
  onStart, onDone, onDelete, onPriorityChange, onStatusChange,
  onDescriptionUpdate, onWorkbookLinkAdd,
}: JobBoardProps) {
  const [doneExpanded, setDoneExpanded] = useState(false)

  const inProgress = sortJobs(jobs.filter(j => j.status === 'in-progress'))
  const queued = sortJobs(jobs.filter(j => j.status === 'queued'))
  const doneToday = jobs.filter(j => j.status === 'done' && j.completed_at && isToday(j.completed_at))

  const p1Alarms = queued.filter(j => j.priority === 'p1' && j.is_fire_alarm)
  const p1Regular = queued.filter(j => j.priority === 'p1' && !j.is_fire_alarm)
  const rest = queued.filter(j => j.priority !== 'p1')

  const wipAtCap = inProgress.length >= 3

  function cardProps(job: Job, i: number) {
    return {
      job, currentUser, users, index: i,
      onStart, onDone, onDelete,
      onPriorityChange, onStatusChange,
      onDescriptionUpdate, onWorkbookLinkAdd,
      wipAtCap,
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

      <AnimatePresence>
        {wipAtCap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              WIP cap hit — {inProgress.length}/3 jobs in progress. Finish one before starting another.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* P1 Urgent fire alarms */}
      {p1Alarms.length > 0 && (
        <section>
          <SectionHeader title="🔴 P1 Urgent" count={p1Alarms.length} alert />
          <div className="space-y-2">
            <AnimatePresence>
              {p1Alarms.map((job, i) => <JobCard key={job.id} {...cardProps(job, i)} />)}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* In Progress */}
      <section>
        <SectionHeader title="In Progress" count={inProgress.length} alert={wipAtCap} />
        {inProgress.length === 0
          ? <p className="text-sm text-gray-400 italic">Nothing in progress</p>
          : <div className="space-y-2">
              <AnimatePresence>
                {inProgress.map((job, i) => <JobCard key={job.id} {...cardProps(job, i)} />)}
              </AnimatePresence>
            </div>
        }
      </section>

      {/* Queued */}
      <section>
        <SectionHeader title="Queued" count={queued.length} />
        {queued.length === 0
          ? <p className="text-sm text-gray-400 italic">Queue is clear</p>
          : <div className="space-y-2">
              <AnimatePresence>
                {[...p1Regular, ...rest].map((job, i) => <JobCard key={job.id} {...cardProps(job, i)} />)}
              </AnimatePresence>
            </div>
        }
      </section>

      {/* Done Today */}
      <section>
        <button onClick={() => setDoneExpanded(!doneExpanded)} className="flex items-center gap-2 mb-3 group">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
            Done Today
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{doneToday.length}</span>
          {doneExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </button>
        <AnimatePresence>
          {doneExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {doneToday.length === 0
                ? <p className="text-sm text-gray-400 italic">Nothing completed today</p>
                : <div className="space-y-2 opacity-60">
                    {doneToday.map((job, i) => <JobCard key={job.id} {...cardProps(job, i)} />)}
                  </div>
              }
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
