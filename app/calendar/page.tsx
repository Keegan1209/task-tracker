'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/db'
import { Job, User } from '@/types/job'
import { fetchUsers, getSessionUser, setSessionUser, clearSessionUser } from '@/lib/users'
import UserPicker from '@/components/UserPicker'
import CalendarGrid from '@/components/CalendarGrid'
import ExportBar from '@/components/ExportBar'

export default function CalendarPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()))

  // Load users + session
  useEffect(() => {
    fetchUsers().then(u => {
      setUsers(u)
      const session = getSessionUser(u)
      if (session) setCurrentUser(session)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Fetch jobs for displayed month
  const fetchJobs = useCallback(async (m: Date) => {
    setJobsLoading(true)
    try {
      const monthStart = startOfMonth(m).toISOString()
      const monthEnd = endOfMonth(m).toISOString()

      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, priority, status, assigned_to, created_by, workbook_link, created_at, started_at, completed_at, due_date, description, is_fire_alarm, asset_links')
        .or(`created_at.gte.${monthStart},completed_at.gte.${monthStart}`)
        .lte('created_at', monthEnd)
        .order('created_at', { ascending: true })

      if (!error && data) setJobs(data as Job[])
    } catch (err) {
      console.error('Failed to fetch calendar jobs:', err)
    } finally {
      setJobsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser) fetchJobs(month)
  }, [currentUser, month, fetchJobs])

  function handleSelectUser(user: User) {
    setCurrentUser(user)
    setSessionUser(user.id)
  }

  function handleSignOut() {
    clearSessionUser()
    setCurrentUser(null)
  }

  const today = startOfMonth(new Date())
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#101319]">
      {/* Sidebar — matches app/page.tsx exactly */}
      <aside
        className="w-52 flex flex-col shrink-0 border-r border-white/5"
        style={{ background: 'linear-gradient(180deg, #0E1219 0%, #101520 60%, #0C1018 100%)' }}
      >
        <div className="px-5 py-5 border-b border-white/5">
          <img src="/audi-rings-white.png" alt="Audi" className="h-8 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/"
            className="block px-2 py-1.5 text-xs text-[#A0A0A0] hover:text-white hover:bg-white/5 rounded-md font-medium transition-colors"
          >
            Job Board
          </Link>
          <div className="px-2 py-1.5 text-xs text-white bg-white/10 rounded-md font-medium">
            Calendar
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-[#161B24] border-b border-[#2A2A2A] shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-white">Calendar</h2>
            {/* Month navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonth(m => subMonths(m, 1))}
                className="p-1 text-[#606060] hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm font-medium text-white min-w-[110px] text-center">
                {format(month, 'MMM yyyy')}
              </span>
              <button
                onClick={() => setMonth(m => addMonths(m, 1))}
                disabled={isCurrentMonth}
                className="p-1 text-[#606060] hover:text-white hover:bg-white/5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            {jobsLoading && (
              <span className="text-xs text-[#505060]">Loading…</span>
            )}
          </div>

          <ExportBar />
        </header>

        {/* Calendar grid */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <CalendarGrid month={month} jobs={jobs} users={users} />
        </div>
      </main>
    </div>
  )
}
