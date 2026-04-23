'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Flame, Plus, LogOut } from 'lucide-react'
import { Job, User, JobPriority, JobStatus, CreateJobPayload, FireAlarmPayload } from '@/types/job'
import { fetchUsers, getSessionUser, setSessionUser, clearSessionUser } from '@/lib/users'
import { requestNotificationPermission, sendP1Notification, sendFireAlarmNotification, sendAssignmentNotification } from '@/lib/notifications'
import UserPicker from '@/components/UserPicker'
import StatsStrip from '@/components/StatsStrip'
import JobBoard from '@/components/JobBoard'
import NewJobPanel from '@/components/NewJobPanel'
import FireAlarmPanel from '@/components/FireAlarmPanel'

function RaiseUrgentButton({ hasP1, onClick }: { hasP1: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      animate={!hasP1 ? {
        boxShadow: [
          '0 0 0 0 rgba(220,38,38,0)',
          '0 0 0 6px rgba(220,38,38,0.25)',
          '0 0 0 0 rgba(220,38,38,0)',
        ],
      } : {}}
      transition={!hasP1 ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
    >
      <Flame size={14} />
      Raise Urgent
    </motion.button>
  )
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [newJobOpen, setNewJobOpen] = useState(false)
  const [fireAlarmOpen, setFireAlarmOpen] = useState(false)

  // Load users on mount
  useEffect(() => {
    fetchUsers().then(u => {
      setUsers(u)
      const session = getSessionUser(u)
      if (session) setCurrentUser(session)
      setLoading(false)
    }).catch(() => setLoading(false))
    requestNotificationPermission()
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) setJobs(await res.json())
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
  }, [])

  useEffect(() => {
    if (currentUser) fetchJobs()
  }, [currentUser, fetchJobs])

  // Poll every 30s to stay in sync
  useEffect(() => {
    if (!currentUser) return
    const interval = setInterval(fetchJobs, 30000)
    return () => clearInterval(interval)
  }, [currentUser, fetchJobs])

  function handleSelectUser(user: User) {
    setCurrentUser(user)
    setSessionUser(user.id)
  }

  function handleSignOut() {
    clearSessionUser()
    setCurrentUser(null)
  }

  const patch = useCallback(async (jobId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j))
    } else {
      const err = await res.json()
      alert(err.error || 'Something went wrong')
    }
  }, [])

  const handleStart = useCallback((jobId: string) => patch(jobId, { status: 'in-progress' }), [patch])
  const handleDone = useCallback((jobId: string) => patch(jobId, { status: 'done', completed_by: currentUser?.id }), [patch, currentUser])
  const handlePriorityChange = useCallback((jobId: string, priority: JobPriority) => patch(jobId, { priority }), [patch])
  const handleWorkbookLinkAdd = useCallback((jobId: string, link: string) => patch(jobId, { workbook_link: link }), [patch])
  const handleStatusChange = useCallback((jobId: string, status: string) => patch(jobId, { status }), [patch])
  const handleDescriptionUpdate = useCallback((jobId: string, description: string) => patch(jobId, { description }), [patch])

  const handleDelete = useCallback(async (jobId: string) => {
    if (!confirm('Delete this job?')) return
    const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
    if (res.ok) setJobs(prev => prev.filter(j => j.id !== jobId))
  }, [])

  const handleNewJob = useCallback(async (payload: CreateJobPayload) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const created = await res.json()
      setJobs(prev => [created, ...prev])
      if (payload.priority === 'p1') sendP1Notification(payload.title)
      if (payload.assigned_to !== 'all') sendAssignmentNotification(payload.title)
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create job')
    }
  }, [])

  const handleFireAlarm = useCallback(async (payload: FireAlarmPayload) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        description: payload.client_context,
        workbook_link: payload.workbook_link,
        assigned_to: payload.assigned_to,
        created_by: payload.created_by,
        is_fire_alarm: true,
        priority: 'p1',
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setJobs(prev => [created, ...prev])
      sendFireAlarmNotification(payload.client_context)
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to raise urgent job')
    }
  }, [])

  // Show user picker if no session
  if (!loading && !currentUser) {
    return <UserPicker users={users} onSelect={handleSelectUser} />
  }

  if (loading || !currentUser) {
    return (
      <div className="fixed inset-0 bg-[#101319] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    )
  }

  const isAM = currentUser.role === 'am' || currentUser.role === 'admin'

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <aside
        className="w-52 flex flex-col shrink-0 border-r border-white/5"
        style={{
          background: 'linear-gradient(180deg, #0E1219 0%, #101520 60%, #0C1018 100%)',
        }}
      >
        <div className="px-5 py-5 border-b border-white/5">
          <img
            src="/audi-rings-white.png"
            alt="Audi"
            className="h-8 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="px-2 py-1.5 text-xs text-white bg-white/10 rounded-md font-medium">
            Job Board
          </div>
        </nav>

        {/* Current user */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0
              ${currentUser.role === 'admin' ? 'bg-purple-600' : currentUser.role === 'am' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              {currentUser.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-gray-500 text-xs">{currentUser.role === 'am' ? 'AM / PM' : currentUser.role === 'admin' ? 'Admin' : 'Developer'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
          >
            <LogOut size={12} />
            Switch user
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-base">
        <header className="flex items-center justify-between px-6 py-3 bg-bg-surface border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Job Board</h2>
            <p className="text-xs text-text-secondary">
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAM && (
              <button
                onClick={() => setNewJobOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#C0C0C0] bg-transparent border border-white/10 rounded-md hover:border-white/20 hover:text-white hover:-translate-y-px transition-all duration-150"
              >
                <Plus size={14} />
                New Job
              </button>
            )}
            <RaiseUrgentButton
              hasP1={jobs.some(j => j.priority === 'p1' && j.status !== 'done')}
              onClick={() => setFireAlarmOpen(true)}
            />
          </div>
        </header>

        <StatsStrip jobs={jobs} />

        <JobBoard
          jobs={jobs}
          currentUser={currentUser}
          users={users}
          onStart={handleStart}
          onDone={handleDone}
          onDelete={handleDelete}
          onPriorityChange={handlePriorityChange}
          onStatusChange={handleStatusChange}
          onDescriptionUpdate={handleDescriptionUpdate}
          onWorkbookLinkAdd={handleWorkbookLinkAdd}
        />
      </main>

      {isAM && (
        <NewJobPanel
          open={newJobOpen}
          onOpenChange={setNewJobOpen}
          onSubmit={handleNewJob}
          currentUser={currentUser}
          users={users}
        />
      )}
      <FireAlarmPanel
        open={fireAlarmOpen}
        onOpenChange={setFireAlarmOpen}
        onSubmit={handleFireAlarm}
        currentUser={currentUser}
        users={users}
      />
    </div>
  )
}
