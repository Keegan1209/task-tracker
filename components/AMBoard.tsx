'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink, Flame } from 'lucide-react'
import { Job, sortJobs, isValidWorkbookLink, WORKBOOK_LINK_PREFIX } from '@/types/job'
import WorkbookButton from './WorkbookButton'

interface AMBoardProps {
  jobs: Job[]
  onWorkbookLinkAdd: (jobId: string, link: string) => Promise<void>
  onMarkLive: (jobId: string) => Promise<void>
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

function JobRow({ job, onWorkbookLinkAdd, onMarkLive }: {
  job: Job
  onWorkbookLinkAdd: (jobId: string, link: string) => Promise<void>
  onMarkLive: (jobId: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [liveError, setLiveError] = useState(false)

  async function handleMarkLive() {
    if (!job.workbook_link || !isValidWorkbookLink(job.workbook_link)) {
      setLiveError(true)
      setTimeout(() => setLiveError(false), 3000)
      return
    }
    await onMarkLive(job.id)
  }

  return (
    <div className={`bg-white border border-[#E5E7EB] border-l-4 ${PRIORITY_BORDER[job.priority]} rounded-lg ${job.is_fire_alarm ? 'bg-[#FFF5F5]' : ''}`}>
      <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[job.priority]}`}>
              {job.is_fire_alarm && <Flame size={9} className="inline mr-0.5" />}
              {job.priority.toUpperCase()}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
              ${job.status === 'in-progress' ? 'bg-green-100 text-green-700' :
                job.status === 'done' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'}`}>
              {job.status === 'in-progress' ? 'In Progress' : job.status === 'done' ? 'Done — needs Workbook link' : 'Live'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
          {job.client && <p className="text-xs text-gray-400">{job.client}</p>}
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-400 shrink-0" /> : <ChevronDown size={15} className="text-gray-400 shrink-0" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
              {job.description && (
                <p className="text-sm text-gray-600">{job.description}</p>
              )}

              {job.is_fire_alarm && !job.workbook_link && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  🔥 Fire alarm — remember to log this in Workbook before marking Live
                </div>
              )}

              <WorkbookButton
                link={job.workbook_link}
                jobId={job.id}
                isFireAlarm={job.is_fire_alarm}
                onLinkAdd={onWorkbookLinkAdd}
              />

              {job.status === 'done' && (
                <div className="space-y-1">
                  <button
                    onClick={handleMarkLive}
                    className="w-full py-2 text-sm font-medium bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                  >
                    Mark Live ✓
                  </button>
                  {liveError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                      Add the Workbook link before marking this live
                    </p>
                  )}
                </div>
              )}

              {job.status === 'live' && job.workbook_link && (
                <a
                  href={job.workbook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                >
                  <ExternalLink size={12} />
                  Open in Workbook
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AMBoard({ jobs, onWorkbookLinkAdd, onMarkLive }: AMBoardProps) {
  const [doneExpanded, setDoneExpanded] = useState(true)

  const queued = sortJobs(jobs.filter(j => j.status === 'queued'))
  const inProgress = jobs.filter(j => j.status === 'in-progress')
  const done = jobs.filter(j => j.status === 'done')
  const live = jobs.filter(j => j.status === 'live')

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

      {/* Queued */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">In Queue</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{queued.length}</span>
        </div>
        {queued.length === 0
          ? <p className="text-sm text-gray-400 italic">Nothing queued</p>
          : <div className="space-y-2">
              {queued.map(job => (
                <JobRow key={job.id} job={job} onWorkbookLinkAdd={onWorkbookLinkAdd} onMarkLive={onMarkLive} />
              ))}
            </div>
        }
      </section>

      {/* In Progress */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">In Progress</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{inProgress.length}</span>
        </div>
        {inProgress.length === 0
          ? <p className="text-sm text-gray-400 italic">Nothing in progress</p>
          : <div className="space-y-2">
              {inProgress.map(job => (
                <JobRow key={job.id} job={job} onWorkbookLinkAdd={onWorkbookLinkAdd} onMarkLive={onMarkLive} />
              ))}
            </div>
        }
      </section>

      {/* Done — needs Workbook link */}
      {done.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600">Done — Add Workbook Link</h2>
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{done.length}</span>
          </div>
          <div className="space-y-2">
            {done.map(job => (
              <JobRow key={job.id} job={job} onWorkbookLinkAdd={onWorkbookLinkAdd} onMarkLive={onMarkLive} />
            ))}
          </div>
        </section>
      )}

      {/* Live this week */}
      <section>
        <button
          onClick={() => setDoneExpanded(!doneExpanded)}
          className="flex items-center gap-2 mb-3 group"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
            Live This Week
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{live.length}</span>
          {doneExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </button>
        <AnimatePresence>
          {doneExpanded && live.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 opacity-60">
                {live.map(job => (
                  <JobRow key={job.id} job={job} onWorkbookLinkAdd={onWorkbookLinkAdd} onMarkLive={onMarkLive} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
