'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, AlertCircle, Flame } from 'lucide-react'
import { Job, JobStatus, VALID_TRANSITIONS, STATUS_LABELS } from '@/types/job'
import WorkbookButton from './WorkbookButton'

interface JobCardProps {
  job: Job
  role: 'am' | 'dev'
  index: number
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>
  onWorkbookLinkAdd: (jobId: string, link: string) => Promise<void>
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.2, ease: 'easeOut' },
  }),
}

const pulseVariants = {
  pulse: {
    boxShadow: [
      '0 0 0 0 rgba(226,75,74,0.4)',
      '0 0 0 8px rgba(226,75,74,0)',
    ],
    transition: { duration: 1.2, repeat: Infinity },
  },
}

const flashVariants = {
  flash: {
    backgroundColor: ['#ffffff', '#f0fdf4', '#ffffff'],
    transition: { duration: 0.6 },
  },
}

const PRIORITY_BORDER: Record<string, string> = {
  p1: 'border-l-[#E24B4A]',
  p2: 'border-l-[#EF9F27]',
  p3: 'border-l-[#D1D5DB]',
}

const PRIORITY_LABEL: Record<string, string> = {
  p1: 'P1',
  p2: 'P2',
  p3: 'P3',
}

const PRIORITY_BADGE: Record<string, string> = {
  p1: 'bg-red-100 text-red-700',
  p2: 'bg-amber-100 text-amber-700',
  p3: 'bg-gray-100 text-gray-600',
}

const STATUS_BADGE: Record<JobStatus, string> = {
  'needs-info': 'bg-gray-100 text-gray-600',
  'briefed': 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-green-100 text-green-700',
  'awaiting-assets': 'bg-amber-100 text-amber-700',
  'in-review': 'bg-purple-100 text-purple-700',
  'awaiting-approval': 'bg-indigo-100 text-indigo-700',
  'live': 'bg-green-100 text-green-800',
}

function getAvailableActions(job: Job, role: 'am' | 'dev'): { label: string; status: JobStatus }[] {
  const transitions = VALID_TRANSITIONS[job.status]
  const actions: { label: string; status: JobStatus }[] = []

  for (const next of transitions) {
    if (next === 'in-progress' && role !== 'dev') continue
    if (next === 'in-review' && job.status === 'in-progress' && role !== 'dev') continue
    if (next === 'awaiting-approval' && role !== 'am') continue

    const labels: Partial<Record<JobStatus, string>> = {
      'briefed': 'Mark Ready',
      'in-progress': 'Start Job',
      'awaiting-assets': 'Flag: Awaiting Assets',
      'in-review': 'Send to Review',
      'awaiting-approval': 'Approve — Awaiting Client',
      'live': 'Push Live',
    }
    if (labels[next]) {
      actions.push({ label: labels[next]!, status: next })
    }
  }

  if (job.status === 'awaiting-assets') {
    actions.unshift({ label: 'Assets Received', status: 'briefed' })
  }

  return actions
}

function isOverdue(job: Job): boolean {
  if (!job.due_date) return false
  if (job.status === 'live') return false
  return new Date(job.due_date) < new Date(new Date().toDateString())
}

export default function JobCard({ job, role, index, onStatusChange, onWorkbookLinkAdd }: JobCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [liveError, setLiveError] = useState(false)
  const [flashing, setFlashing] = useState(false)

  const overdue = isOverdue(job)
  const isPulsingP1 = job.priority === 'p1' && job.status === 'briefed'
  const actions = getAvailableActions(job, role)

  async function handleAction(status: JobStatus) {
    if (status === 'live' && !job.workbook_link) {
      setLiveError(true)
      setTimeout(() => setLiveError(false), 3000)
      return
    }
    setFlashing(true)
    setTimeout(() => setFlashing(false), 700)
    await onStatusChange(job.id, status)
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={flashing ? 'flash' : 'visible'}
      // @ts-expect-error framer-motion dynamic variants
      variants={flashing ? flashVariants : cardVariants}
      className={`
        bg-white border border-[#E5E7EB] border-l-4 rounded-lg
        ${PRIORITY_BORDER[job.priority]}
        ${job.is_fire_alarm ? 'bg-[#FFF5F5]' : ''}
        hover:border-[#D1D5DB] hover:shadow-sm transition-all cursor-pointer
      `}
    >
      {/* Card header */}
      <div className="px-4 py-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Priority badge */}
              <motion.span
                animate={isPulsingP1 ? 'pulse' : undefined}
                variants={pulseVariants}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_BADGE[job.priority]}`}
              >
                {job.is_fire_alarm && <Flame size={10} className="mr-1" />}
                {PRIORITY_LABEL[job.priority]}
              </motion.span>

              {/* Status badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[job.status]}`}>
                {STATUS_LABELS[job.status]}
              </span>

              {/* Overdue */}
              {overdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  <AlertCircle size={10} />
                  Overdue
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{job.client} · {job.am}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {job.due_date && (
              <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {new Date(job.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
              {/* Brief */}
              {job.brief && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{job.brief}</p>
                </div>
              )}

              {/* Asset notes */}
              {job.asset_notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Asset notes</p>
                  <p className="text-sm text-gray-700">{job.asset_notes}</p>
                </div>
              )}

              {/* Job type */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Type: <span className="text-gray-700">{job.type}</span></span>
              </div>

              {/* Workbook button */}
              <WorkbookButton
                link={job.workbook_link}
                jobId={job.id}
                isFireAlarm={job.is_fire_alarm}
                onLinkAdd={onWorkbookLinkAdd}
              />

              {/* Live error */}
              {liveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                  Add the Workbook job link before marking this live
                </p>
              )}

              {/* Actions */}
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {actions.map(action => (
                    <button
                      key={action.status}
                      onClick={() => handleAction(action.status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                        ${action.status === 'live'
                          ? 'bg-green-700 text-white hover:bg-green-800'
                          : action.status === 'awaiting-assets'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-gray-900 text-white hover:bg-gray-700'
                        }
                      `}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
