'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Job, User, JobPriority, JobStatus, sortJobs, isToday } from '@/types/job'
import JobCard from './JobCard'
import ZoneBlock from './ZoneBlock'

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

const ZONE_COLORS = {
  p1: '#E24B4A',
  progress: '#D4A843',
  queue: '#5B9BD5',
  done: '#5CB85C',
}

const ZONE_BADGES = {
  p1: 'bg-[#2A1515] text-[#E87878] border border-[#4A2020]',
  progress: 'bg-[#2A2010] text-[#D4B870] border border-[#4A3A15]',
  progressAlert: 'bg-[#4A2020] text-[#E87878] border border-[#6A2020]',
  queue: 'bg-[#1A3A5A] text-[#7EB8E8] border border-[#2A5A8A]',
  done: 'bg-[#1A3A1A] text-[#7EC87E] border border-[#2A5A2A]',
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

  function AnimatedCards({ items }: { items: Job[] }) {
    return (
      <AnimatePresence mode="popLayout">
        {items.map((job, i) => (
          <motion.div
            key={job.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.04 }}
          >
            <JobCard {...cardProps(job, i)} />
          </motion.div>
        ))}
      </AnimatePresence>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

      {/* WIP cap banner */}
      <AnimatePresence>
        {wipAtCap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="bg-[#2A1515] border border-[#4A2020] rounded-lg px-4 py-2.5 text-sm text-[#E87878]">
              ⚠ WIP cap hit — {inProgress.length}/3 jobs in progress. Finish one before starting another.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* P1 Urgent */}
      <AnimatePresence>
        {p1Alarms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ZoneBlock hoverColor={ZONE_COLORS.p1} label="P1 Urgent">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS.p1 }} />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-white">🔴 P1 Urgent</h2>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${ZONE_BADGES.p1}`}>{p1Alarms.length}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {p1Alarms.map((job, i) => <JobCard key={job.id} {...cardProps(job, i)} />)}
                </AnimatePresence>
              </div>
            </ZoneBlock>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In Progress */}
      <ZoneBlock hoverColor={ZONE_COLORS.progress} label="In Progress">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS.progress }} />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white">In Progress</h2>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${wipAtCap ? ZONE_BADGES.progressAlert : ZONE_BADGES.progress}`}>
            {inProgress.length} / 3
          </span>
        </div>
        {inProgress.length === 0
          ? <p className="text-sm italic text-[#606060]">Nothing in progress</p>
          : <div className="space-y-2"><AnimatedCards items={inProgress} /></div>
        }
      </ZoneBlock>

      {/* Queued */}
      <ZoneBlock hoverColor={ZONE_COLORS.queue} label="Queued">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS.queue }} />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white">Queued</h2>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${ZONE_BADGES.queue}`}>{queued.length}</span>
        </div>
        {queued.length === 0
          ? <p className="text-sm italic text-[#606060]">Queue is clear</p>
          : <div className="space-y-2"><AnimatedCards items={[...p1Regular, ...rest]} /></div>
        }
      </ZoneBlock>

      {/* Done Today */}
      <ZoneBlock hoverColor={ZONE_COLORS.done} label="Done Today">
        <button
          onClick={() => setDoneExpanded(!doneExpanded)}
          className="flex items-center gap-2 mb-4 w-full text-left"
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS.done }} />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white">Done Today</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ZONE_BADGES.done}`}>{doneToday.length}</span>
          <span className="ml-auto">
            {doneExpanded
              ? <ChevronUp size={13} className="text-[#EBEBEB]" />
              : <ChevronDown size={13} className="text-[#EBEBEB]" />
            }
          </span>
        </button>
        <AnimatePresence>
          {doneExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              {doneToday.length === 0
                ? <p className="text-sm italic text-[#606060]">Nothing completed today</p>
                : <div className="space-y-2 opacity-70">
                    <AnimatedCards items={doneToday} />
                  </div>
              }
            </motion.div>
          )}
        </AnimatePresence>
      </ZoneBlock>
    </div>
  )
}
