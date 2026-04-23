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

// Left border colour — always visible, 3px
const PRIORITY_LEFT_COLOR: Record<JobPriority, string> = {
  p1: '#E24B4A',
  p2: '#D4A843',
  p3: '#444444',
}

// Pill badge — soft fill matching border colour
const PRIORITY_BADGE: Record<JobPriority, string> = {
  p1: 'bg-[#2A1515] text-[#E87878] border border-[#4A2020]',
  p2: 'bg-[#2A2010] text-[#D4B870] border border-[#4A3A15]',
  p3: 'bg-[#1E1E1E] text-[#888780] border border-[#333]',
}

// Avatar background per user role / index
const AVATAR_COLORS = [
  'bg-emerald-700', 'bg-indigo-700', 'bg-violet-700',
  'bg-sky-700', 'bg-rose-700', 'bg-amber-700', 'bg-teal-700',
]

const STATUS_LABELS: Record<JobStatus, string> = {
  'queued': 'Queued',
  'in-progress': 'In Progress',
  'done': 'Done',
}

const STATUS_ACTIVE: Record<JobStatus, string> = {
  'queued': 'bg-[#1A3A5A] text-[#7EB8E8] border-[#2A5A8A] cursor-default',
  'in-progress': 'bg-[#1A3A1A] text-[#7EC87E] border-[#2A5A2A] cursor-default',
  'done': 'bg-[#1A2A1A] text-[#5A9A5A] border-[#2A4A2A] cursor-default',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Avatar({ user, index }: { user: User; index: number }) {
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div
      title={user.name}
      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${colorClass}`}
    >
      {getInitials(user.name)}
    </div>
  )
}

export default function JobCard({
  job, currentUser, users,
  onStart, onDone, onDelete, onPriorityChange, onStatusChange,
  onDescriptionUpdate, onWorkbookLinkAdd,
  wipAtCap,
}: Omit<JobCardProps, 'index'> & { index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [addingLink, setAddingLink] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [flashing, setFlashing] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descInput, setDescInput] = useState(job.description || '')
  const [savingDesc, setSavingDesc] = useState(false)
  const [hovered, setHovered] = useState(false)

  const overdue = isOverdue(job)
  const isAM = currentUser.role === 'am' || currentUser.role === 'admin'
  const isDev = currentUser.role === 'dev' || currentUser.role === 'admin'
  const isP1 = job.priority === 'p1'
  const isPulsing = isP1 && job.status === 'queued'

  const assignedUser = job.assigned_to === 'all'
    ? null
    : users.find(u => u.id === job.assigned_to)

  const assignedUserIndex = assignedUser
    ? users.findIndex(u => u.id === assignedUser.id)
    : 0

  const createdByUser = users.find(u => u.id === job.created_by)

  const canStart = isDev && job.status === 'queued' &&
    (job.assigned_to === 'all' || job.assigned_to === currentUser.id) &&
    !wipAtCap

  const canDone = isDev && job.status === 'in-progress' &&
    (job.assigned_to === 'all' || job.assigned_to === currentUser.id)

  async function handleAction(fn: () => Promise<void>) {
    setFlashing(true)
    setTimeout(() => setFlashing(false), 600)
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
      layout
      animate={flashing ? {
        backgroundColor: ['#1E2535', '#1A2A1A', '#1E2535'],
        transition: { duration: 0.6 },
      } : { backgroundColor: '#1E2535' }}
      style={{
        backgroundColor: '#1E2535',
        border: '1px solid #2A3347',
        borderLeft: `3px solid ${PRIORITY_LEFT_COLOR[job.priority]}`,
        borderRadius: '10px',
        transition: 'box-shadow 0.2s ease',
        boxShadow: hovered ? '0 2px 12px rgba(0,0,0,0.35)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Collapsed row */}
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Priority pill */}
            <motion.span
              animate={isPulsing ? {
                boxShadow: ['0 0 0 0 rgba(226,75,74,0.5)', '0 0 0 8px rgba(226,75,74,0)'],
                transition: { duration: 1.2, repeat: Infinity },
              } : {}}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${PRIORITY_BADGE[job.priority]}`}
            >
              {job.is_fire_alarm && <Flame size={9} />}
              {job.priority.toUpperCase()}
            </motion.span>

            {overdue && (
              <span className="inline-flex items-center gap-1 text-xs text-[#E87878] font-medium">
                <AlertCircle size={10} />
                Overdue
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-white truncate">{job.title}</p>

          {/* Bottom meta row: avatar + name + timestamp */}
          <div className="flex items-center gap-2 mt-1.5">
            {assignedUser ? (
              <Avatar user={assignedUser} index={assignedUserIndex} />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#2A3347] flex items-center justify-center text-[#606060] text-[9px] font-bold shrink-0">
                ALL
              </div>
            )}
            <span className="text-xs text-[#A0A0A0]">
              {assignedUser ? assignedUser.name : 'All Devs'}
            </span>
            <span className="text-[#3A4A5A]">·</span>
            <span className="text-xs text-[#606060] font-mono">
              {formatTimeShort(job.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* "Open in Workbook" ghost button — appears on hover when link exists */}
          {job.workbook_link && hovered && (
            <a
              href={job.workbook_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#A0A0A0] border border-[#2A3347] rounded-md hover:text-white hover:border-[#3A4A5A] transition-colors"
            >
              Open in Workbook
              <ExternalLink size={10} />
            </a>
          )}

          {canStart && (
            <button
              onClick={e => { e.stopPropagation(); handleAction(() => onStart(job.id)) }}
              className="px-3 py-1.5 text-xs font-semibold bg-[#1A3A5A] text-[#7EB8E8] border border-[#2A5A8A] rounded-md hover:bg-[#2A4A6A] transition-colors"
            >
              Start →
            </button>
          )}
          {wipAtCap && isDev && job.status === 'queued' && (
            <span className="text-xs text-[#EBEBEB] italic">WIP cap</span>
          )}
          {canDone && (
            <button
              onClick={e => { e.stopPropagation(); handleAction(() => onDone(job.id)) }}
              className="px-3 py-1.5 text-xs font-semibold bg-[#1A3A1A] text-[#7EC87E] border border-[#2A5A2A] rounded-md hover:bg-[#2A4A2A] transition-colors"
            >
              Done ✓
            </button>
          )}
          {expanded
            ? <ChevronUp size={14} className="text-[#EBEBEB]" />
            : <ChevronDown size={14} className="text-[#EBEBEB]" />
          }
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[#2A2A2A] pt-3 space-y-3">

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-[#EBEBEB]">Description</p>
                  {!editingDesc && (
                    <button
                      onClick={() => { setDescInput(job.description || ''); setEditingDesc(true) }}
                      className="inline-flex items-center gap-1 text-xs text-[#EBEBEB] hover:text-white transition-colors"
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
                      className="w-full text-sm bg-[#161B24] border border-[#333] text-[#EBEBEB] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#444] resize-none placeholder-[#888]"
                      placeholder="Add context for the dev…"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDescSave}
                        disabled={savingDesc}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1A3A1A] text-[#7EC87E] border border-[#2A5A2A] text-xs rounded hover:bg-[#2A4A2A] disabled:opacity-50 transition-colors"
                      >
                        <Check size={11} />
                        {savingDesc ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingDesc(false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#EBEBEB] hover:text-white border border-[#2A2A2A] rounded hover:border-[#3A3A3A] transition-colors"
                      >
                        <X size={11} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#EBEBEB]">
                    {job.description || <span className="text-[#888]">No description</span>}
                  </p>
                )}
              </div>

              {/* Fire alarm banner */}
              {job.is_fire_alarm && !job.workbook_link && (
                <div className="text-xs text-[#D4B870] bg-[#2A2010] border border-[#4A3A15] rounded px-2 py-1.5">
                  🔥 Remember to add the Workbook link
                </div>
              )}

              {/* Workbook link */}
              {job.workbook_link ? (
                <a
                  href={job.workbook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2230] text-[#EBEBEB] border border-[#3A3A3A] text-sm font-medium rounded-md hover:bg-[#252D3D] hover:text-white transition-colors"
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
                          className="flex-1 text-xs bg-[#161B24] border border-[#333] text-[#EBEBEB] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#444] placeholder-[#888]"
                        />
                        <button onClick={handleLinkSave} className="px-2 py-1 bg-[#1A3A1A] text-[#7EC87E] border border-[#2A5A2A] text-xs rounded hover:bg-[#2A4A2A] transition-colors">Save</button>
                        <button onClick={() => { setAddingLink(false); setLinkError('') }} className="px-2 py-1 text-xs text-[#EBEBEB] hover:text-white border border-[#2A2A2A] rounded transition-colors">Cancel</button>
                      </div>
                      {linkError && <p className="text-xs text-[#E87878]">{linkError}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLink(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#EBEBEB] hover:text-white border border-dashed border-[#3A3A3A] rounded px-2 py-1.5 hover:border-[#555] transition-colors"
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
                  <p className="text-xs font-medium text-[#EBEBEB] mb-1">Assets</p>
                  <div className="flex flex-wrap gap-2">
                    {job.asset_links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#5B9BD5] hover:text-[#7EB8E8] transition-colors">
                        <ExternalLink size={10} />
                        Asset {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="text-xs text-[#EBEBEB] space-y-0.5">
                <div>Assigned to: <span className="text-white">{assignedUser ? assignedUser.name : 'All Devs'}</span></div>
                <div>Created by: <span className="text-white">{createdByUser?.name || '—'}</span></div>
                <div>Created: <span className="text-white font-mono">{formatTime(job.created_at)}</span></div>
                {job.started_at && <div>Started: <span className="text-[#7EC87E] font-mono">{formatTime(job.started_at)}</span></div>}
                {job.completed_at && <div>Completed: <span className="text-[#5CB85C] font-mono">{formatTime(job.completed_at)}</span></div>}
              </div>

              {/* Update status */}
              <div className="pt-2 border-t border-[#2A2A2A]">
                <p className="text-xs font-medium text-[#EBEBEB] mb-1.5">Update status</p>
                <div className="flex gap-1.5">
                  {(['queued', 'in-progress', 'done'] as JobStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleAction(() => onStatusChange(job.id, s))}
                      disabled={job.status === s}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors
                        ${job.status === s
                          ? STATUS_ACTIVE[s]
                          : 'bg-[#1C2230] text-[#EBEBEB] border-[#3A3A3A] hover:border-[#555] hover:text-white'
                        }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM-only: priority + delete */}
              {isAM && (
                <div className="flex items-center gap-2 pt-1 border-t border-[#2A2A2A]">
                  <div className="flex gap-1">
                    {(['p1', 'p2', 'p3'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => onPriorityChange(job.id, p)}
                        className={`px-2 py-0.5 text-xs font-bold rounded transition-colors
                          ${job.priority === p
                            ? p === 'p1' ? 'bg-[#4A1515] text-[#E87878] border border-[#6A2020]'
                              : p === 'p2' ? 'bg-[#3A2A10] text-[#D4B870] border border-[#5A4A20]'
                              : 'bg-[#2A2A2A] text-[#EBEBEB] border border-[#3A3A3A]'
                            : 'bg-[#1C2230] text-[#EBEBEB] border border-[#3A3A3A] hover:border-[#555] hover:text-white'
                          }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={() => onDelete(job.id)}
                    className="inline-flex items-center gap-1 text-xs text-[#EBEBEB] hover:text-[#E87878] transition-colors"
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
