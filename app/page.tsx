'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flame, Plus } from 'lucide-react'
import { Job, CreateJobPayload, FireAlarmPayload } from '@/types/job'
import { requestNotificationPermission, sendP1Notification } from '@/lib/notifications'
import StatsStrip from '@/components/StatsStrip'
import DevBoard from '@/components/DevBoard'
import AMBoard from '@/components/AMBoard'
import NewJobPanel from '@/components/NewJobPanel'
import FireAlarmPanel from '@/components/FireAlarmPanel'

type Role = 'am' | 'dev'
const ROLE_KEY = 'cms_tracker_role'

function computeStats(jobs: Job[]) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  return {
    totalActive: jobs.filter(j => j.status !== 'live').length,
    inProgress: jobs.filter(j => j.status === 'in-progress').length,
    blocked: 0,
    overdue: jobs.filter(j => {
      if (!j.due_date || j.status === 'done' || j.status === 'live') return false
      return new Date(j.due_date) < new Date(now.toDateString())
    }).length,
    completedThisWeek: jobs.filter(j =>
      (j.status === 'done' || j.status === 'live') &&
      j.completed_at && new Date(j.completed_at) >= weekStart
    ).length,
    p1sThisWeek: jobs.filter(j =>
      j.priority === 'p1' && new Date(j.created_at) >= weekStart
    ).length,
  }
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role>('am')
  const [newJobOpen, setNewJobOpen] = useState(false)
  const [fireAlarmOpen, setFireAlarmOpen] = useState(false)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs?include_live=true')
      if (res.ok) setJobs(await res.json())
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(ROLE_KEY) as Role | null
    if (saved) setRole(saved)
    requestNotificationPermission()
    fetchJobs()
  }, [fetchJobs])

  function toggleRole() {
    const next: Role = role === 'am' ? 'dev' : 'am'
    setRole(next)
    sessionStorage.setItem(ROLE_KEY, next)
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
  const handleDone = useCallback((jobId: string) => patch(jobId, { status: 'done' }), [patch])
  const handleMarkLive = useCallback((jobId: string) => patch(jobId, { status: 'live' }), [patch])
  const handleWorkbookLinkAdd = useCallback((jobId: string, link: string) => patch(jobId, { workbook_link: link }), [patch])

  const handleNewJob = useCallback(async (payload: CreateJobPayload) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const created = await res.json()
      setJobs(prev => [created, ...prev])
      if (payload.priority === 'p1') sendP1Notification(payload.title, payload.client || '')
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create job')
    }
  }, [])

  const handleFireAlarm = useCallback(async (payload: FireAlarmPayload) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, is_fire_alarm: true }),
    })
    if (res.ok) {
      const created = await res.json()
      setJobs(prev => [created, ...prev])
      sendP1Notification(payload.title, payload.client)
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to raise urgent job')
    }
  }, [])

  const stats = computeStats(jobs)

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="w-52 bg-[#0F0F0F] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <h1 className="text-white font-semibold text-sm tracking-tight">CMS Job Tracker</h1>
          <p className="text-gray-500 text-xs mt-0.5">Ogilvy CMS Team</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="px-2 py-1.5 text-xs text-white bg-white/10 rounded-md font-medium">
            Job Board
          </div>
        </nav>

        {/* Role toggle */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-2">Viewing as</p>
          <button
            onClick={toggleRole}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/15 rounded-md transition-colors"
          >
            <span className="text-xs text-white font-medium">
              {role === 'am' ? '👤 AM / PM' : '💻 Developer'}
            </span>
            <span className="text-xs text-gray-500">switch</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {role === 'dev' ? 'Your Queue' : 'Job Board'}
            </h2>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {role === 'am' && (
              <button
                onClick={() => setNewJobOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
                New Job
              </button>
            )}
            <button
              onClick={() => setFireAlarmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              <Flame size={14} />
              Raise Urgent
            </button>
          </div>
        </header>

        {/* Stats strip */}
        <StatsStrip stats={stats} wipCapExceeded={stats.inProgress >= 3} />

        {/* Board */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Loading…
          </div>
        ) : role === 'dev' ? (
          <DevBoard
            jobs={jobs}
            onStart={handleStart}
            onDone={handleDone}
          />
        ) : (
          <AMBoard
            jobs={jobs}
            onWorkbookLinkAdd={handleWorkbookLinkAdd}
            onMarkLive={handleMarkLive}
          />
        )}
      </main>

      <NewJobPanel open={newJobOpen} onOpenChange={setNewJobOpen} onSubmit={handleNewJob} />
      <FireAlarmPanel open={fireAlarmOpen} onOpenChange={setFireAlarmOpen} onSubmit={handleFireAlarm} />
    </div>
  )
}
