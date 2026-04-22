'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink, Flame, AlertCircle, Trash2, Link, Pencil, Check, X } from 'lucide-react'
import { Job, User, JobPriority, JobStatus, isOverdue, isValidWorkbookLink, WORKBOOK_PREFIX } from '@/types/job'

interface JobCardProps {
  job: Job
  currentUser: User
  users: User[]
  index: number
  onStart: (jobId: string) => Promise<void>
  onDone: (jobId: string) => Promise<void>
  onDelete: (jobId: string) => Promise<void>
  onPriorityChange: (jobId: string, priority: JobPriority) => Promise<void>
  onStatusChange: (jobId: string, status: JobStatus) => Promise<void>
  onDescriptionUpdate: (jobId: string, description: string) => Promise<void>
  onWorkbookLinkAdd: (jobId: string, link: string) => Promise<void>
  wipAtCap: boolean
}

const PRIORITY_BORDER: Record<JobPriority, string> = {
  p1: 'border-l-[#E24B4A]',
  p2: 'border-l-[#EF9F27]',
  p3: 'border-l-[#D1D5DB]',
}

const PRIORITY_BADGE: Record<JobPriority, string> = {
  p1: 'bg-red-100 text-red-700',
  p2: 'bg-amber-100 text-amber-700',
  p3: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<JobStatus, string> = {
  'queued': 'Queued',
  'in-progress': 'In Progress',
  'done': 'Done',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function JobCard({
  job, currentUser, users, index,
  onStart, onDone, onDelete, onPriorityChange, onStatusChange,
  onDescriptionUpdate, onWorkbookLinkAdd,
  wipAtCap,
}: JobCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [addingLink, setAddingLink] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [flashing, setFlashing] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descInput, setDescInput] = useState(job.description || '')
  const [savingDesc, setSavingDesc] = useState(false)

  const overdue = isOverdue(job)
  const isAM = currentUser.role === 'am' || currentUser.role === 'admin'
  const isDev = currentUser.role === 'dev' || currentUser.role === 'admin'
  const isP1 = job.priority === 'p1'
  const isPulsing = isP1 && job.status === 'queued'

  const assignedUser = job.assigned_to === 'all'
    ? null
    : users.find(u => u.id === job.assigned_to)
  const createdByUser = users.find(u => u.id === job.created_by)

  const canStart = isDev && job.status === 'queued' &&
    (job.assigned_to === 'all' || job.assigned_to === currentUser.id) &&
    !wipAtCap

  const canDone = isDev && job.status === 'in-progress' &&
    (job.assigned_to === 'all' || job.assigned_to === currentUser.id)

  async function handleAction(fn: () => Promise<void>) {
    setFlashing(true)
    setTimeout(() => setFlashing(false), 700)
    await fn()
  }

  async function handleLinkSave() {
    if (!isValidWorkbookLink(linkInput)) {
      setLinkError(`Must start with ${WORKBOOK_PREFIX}`)
      return
    }
    await onWorkbookLinkAdd(job.id, linkInput)
    setAddingLink(false)
    setLinkInput('')
    setLinkError('')
  }

  async function handleDescSave() {
    setSavingDesc(true)
    await onDescriptionUpdate(job.id, descInput)
    setSavingDesc(false)
    setEditingDesc(false)
  }

  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 8 }}
      animate={flashing
        ? { backgroundColor: ['#ffffff', '#f0fdf4', '#ffffff'] as unknown as string }
        : { opacity: 1, y: 0, transition: { delay: index * 0.04, duration: 0.2 } }
      }
      className={`
        bg-white border border-[#E5E7EB] border-l-4 rounded-lg
        ${PRIORITY_BORDER[job.priority]}
        ${job.is_fire_alarm ? 'bg-[#FFF5F5]' : ''}
        hover:border-[#D1D5DB] hover:shadow-sm transition-all
      `}
    >
      {/* Collapsed row */}
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <motion.span
              animate={isPulsing ? {
                boxShadow: ['0 0 0 0 rgba(226,75,74,0.4)', '0 0 0 8px rgba(226,75,74,0)'],
                transition: { duration: 1.2, repeat: Infinity },
              } : {}}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_BADGE[job.priority]}`}
            >
              {job.is_fire_alarm && <Flame size={9} />}
              {job.priority.toUpperCase()}
            </motion.span>

            {overdue && (
              <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertCircle size={10} />
                Overdue
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
            <span>{assignedUser ? assignedUser.name : 'All Devs'}</span>
            <span>·</span>
            <span>{formatTime(job.created_at)}</span>
            {job.started_at && (
              <>
                <span>·</span>
                <span>Started {formatTime(job.started_at)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canStart && (
            <button
              onClick={e => { e.stopPropagation(); handleAction(() => onStart(job.id)) }}
              className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Start
            </button>
          )}
          {wipAtCap && isDev && job.status === 'queued' && (
            <span className="text-xs text-gray-400 italic">WIP cap</span>
          )}
          {canDone && (
            <button
              onClick={e => { e.stopPropagation(); handleAction(() => onDone(job.id)) }}
              className="px-3 py-1.5 text-xs font-semibold bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
            >
              Done ✓
            </button>
          )}
          {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded detail */}
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

              {/* Description — editable by both roles */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-500">Description</p>
                  {!editingDesc && (
                    <button
                      onClick={() => { setDescInput(job.description || ''); setEditingDesc(true) }}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Pencil size={11} />
                      Edit
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="space-y-1.5">
                    <textarea
                      autoFocus
                      rows={3}
                      value={descInput}
                      onChange={e => setDescInput(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
                      placeholder="Add context for the dev…"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDescSave}
                        disabled={savingDesc}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Check size={11} />
                        {savingDesc ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingDesc(false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:border-gray-300"
                      >
                        <X size={11} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {job.description || <span className="text-gray-400 italic">No description</span>}
                  </p>
                )}
              </div>

              {/* Fire alarm banner */}
              {job.is_fire_alarm && !job.workbook_link && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  🔥 Remember to add the Workbook link
                </div>
              )}

              {/* Workbook link */}
              {job.workbook_link ? (
                <a
                  href={job.workbook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                >
                  Open in Workbook
                  <ExternalLink size={12} />
                </a>
              ) : (
                <div>
                  {addingLink ? (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={linkInput}
                          onChange={e => { setLinkInput(e.target.value); setLinkError('') }}
                          placeholder={`${WORKBOOK_PREFIX}...`}
                          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                        <button onClick={handleLinkSave} className="px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-700">Save</button>
                        <button onClick={() => { setAddingLink(false); setLinkError('') }} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                      {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLink(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded px-2 py-1.5 hover:border-gray-400 transition-colors"
                    >
                      <Link size={11} />
                      Add Workbook link
                    </button>
                  )}
                </div>
              )}

              {/* Asset links */}
              {job.asset_links && job.asset_links.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Assets</p>
                  <div className="flex flex-wrap gap-2">
                    {job.asset_links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                        <ExternalLink size={10} />
                        Asset {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="text-xs text-gray-400 space-y-0.5">
                <div>Assigned to: <span className="text-gray-600">{assignedUser ? assignedUser.name : 'All Devs'}</span></div>
                <div>Created by: <span className="text-gray-600">{createdByUser?.name || '—'}</span></div>
                <div>Created: <span className="text-gray-600">{formatTime(job.created_at)}</span></div>
                {job.started_at && <div>Started: <span className="text-gray-600">{formatTime(job.started_at)}</span></div>}
                {job.completed_at && <div>Completed: <span className="text-gray-600">{formatTime(job.completed_at)}</span></div>}
              </div>

              {/* Update status — available to both AM and Dev */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Update status</p>
                <div className="flex gap-1.5">
                  {(['queued', 'in-progress', 'done'] as JobStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleAction(() => onStatusChange(job.id, s))}
                      disabled={job.status === s}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors
                        ${job.status === s
                          ? s === 'queued' ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-default'
                            : s === 'in-progress' ? 'bg-green-100 text-green-700 border-green-200 cursor-default'
                            : 'bg-blue-100 text-blue-700 border-blue-200 cursor-default'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                        }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM-only: priority + delete */}
              {isAM && (
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <div className="flex gap-1">
                    {(['p1', 'p2', 'p3'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => onPriorityChange(job.id, p)}
                        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors
                          ${job.priority === p
                            ? p === 'p1' ? 'bg-red-600 text-white'
                              : p === 'p2' ? 'bg-amber-500 text-white'
                              : 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={() => onDelete(job.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
