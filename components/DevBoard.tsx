'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flame, CheckCircle2, AlertCircle } from 'lucide-react'
import { Job, sortJobs } from '@/types/job'

interface DevBoardProps {
  jobs: Job[]
  onStart: (jobId: string) => Promise<void>
  onDone: (jobId: string) => Promise<void>
}

const PRIORITY_BORDER: Record<string, string> = {
  p1: 'border-l-[#E24B4A]',
  p2: 'border-l-[#EF9F27]',
  p3: 'border-l-[#D1D5DB]',
}

const PRIORITY_BADGE: Record<string, string> = {
  p1: 'bg-red-100 text-red-700',
  p2: 'bg-amber-100 text-amber-700',
  p3: 'bg-gray-100 text-gray-500',
}

function isOverdue(job: Job): boolean {
  if (!job.due_date || job.status === 'done' || job.status === 'live') return false
  return new Date(job.due_date) < new Date(new Date().toDateString())
}

export default function DevBoard({ jobs, onStart, onDone }: DevBoardProps) {
  const queued = sortJobs(jobs.filter(j => j.status === 'queued'))
  const inProgress = jobs.filter(j => j.status === 'in-progress')
  const completedToday = jobs.filter(j =>
    (j.status === 'done' || j.status === 'live') &&
    j.completed_at &&
    new Date(j.completed_at).toDateString() === new Date().toDateString()
  )

  const wipOver = inProgress.length >= 3

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8 max-w-2xl mx-auto w-full">

      {/* WIP warning */}
      <AnimatePresence>
        {wipOver && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              <AlertCircle size={15} />
              WIP cap hit — finish something before starting another
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Yours to do</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{queued.length}</span>
        </div>
        {queued.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Queue is clear</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {queued.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, y: -6 }}
                  className={`bg-white border border-[#E5E7EB] border-l-4 ${PRIORITY_BORDER[job.priority]} rounded-lg px-4 py-3 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow ${job.is_fire_alarm ? 'bg-[#FFF5F5]' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[job.priority]}`}>
                        {job.is_fire_alarm && <Flame size={9} className="inline mr-0.5" />}
                        {job.priority.toUpperCase()}
                      </span>
                      {isOverdue(job) && (
                        <span className="text-xs text-red-500 font-medium">Overdue</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    {job.client && <p className="text-xs text-gray-400">{job.client}</p>}
                  </div>
                  <button
                    onClick={() => onStart(job.id)}
                    disabled={wipOver}
                    className="shrink-0 px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Start
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* In Progress */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">In Progress</h2>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${wipOver ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
            {inProgress.length} / 3
          </span>
        </div>
        {inProgress.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nothing in progress</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {inProgress.map(job => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`bg-white border border-[#E5E7EB] border-l-4 ${PRIORITY_BORDER[job.priority]} rounded-lg px-4 py-3 flex items-center justify-between gap-4 ${job.is_fire_alarm ? 'bg-[#FFF5F5]' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[job.priority]}`}>
                        {job.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    {job.client && <p className="text-xs text-gray-400">{job.client}</p>}
                  </div>
                  <button
                    onClick={() => onDone(job.id)}
                    className="shrink-0 px-4 py-1.5 text-sm font-semibold bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                  >
                    Done ✓
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Completed today */}
      {completedToday.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Completed Today</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{completedToday.length}</span>
          </div>
          <div className="space-y-2 opacity-50">
            {completedToday.map(job => (
              <div key={job.id} className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center gap-3">
                <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{job.title}</p>
                  {job.client && <p className="text-xs text-gray-400">{job.client}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
