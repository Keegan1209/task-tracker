'use client'

import { User } from '@/types/job'

interface UserPickerProps {
  users: User[]
  onSelect: (user: User) => void
}

export default function UserPicker({ users, onSelect }: UserPickerProps) {
  const admins = users.filter(u => u.role === 'admin')
  const ams = users.filter(u => u.role === 'am')
  const devs = users.filter(u => u.role === 'dev')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <h1 className="text-white text-xl font-semibold mb-1">CMS Job Tracker</h1>
          <p className="text-gray-500 text-sm">Who are you?</p>
        </div>

        <div className="space-y-6">
          {admins.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Admin</p>
              <div className="space-y-2">
                {admins.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onSelect(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {user.initial}
                    </div>
                    <div>
                      <span className="text-white text-sm font-medium">{user.name}</span>
                      <span className="ml-2 text-xs text-purple-400">Full access</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">AM / PM</p>
            <div className="space-y-2">
              {ams.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSelect(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {user.initial}
                  </div>
                  <span className="text-white text-sm font-medium">{user.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Developer</p>
            <div className="space-y-2">
              {devs.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSelect(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {user.initial}
                  </div>
                  <span className="text-white text-sm font-medium">{user.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
