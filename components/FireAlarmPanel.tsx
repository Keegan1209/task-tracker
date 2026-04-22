'use client'

import { useState } from 'react'
import { X, Flame } from 'lucide-react'
import { FireAlarmPayload, User, WORKBOOK_PREFIX, isValidWorkbookLink } from '@/types/job'

interface FireAlarmPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (job: FireAlarmPayload) => Promise<void>
  currentUser: User
  users: User[]
}

export default function FireAlarmPanel({ open, onOpenChange, onSubmit, currentUser, users }: FireAlarmPanelProps) {
  const devs = users.filter(u => u.role === 'dev' || u.role === 'admin')
  const [form, setForm] = useState({ client: 'Audi', description: '', assigned_to: 'all', workbook_link: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.client.trim()) e.client = 'Required'
    if (!form.description.trim()) e.description = 'Required'
    if (form.workbook_link && !isValidWorkbookLink(form.workbook_link)) {
      e.workbook_link = `Must start with ${WORKBOOK_PREFIX}`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: `[${form.client.trim()}] ${form.description.trim()}`,
        client_context: form.description.trim(),
        assigned_to: form.assigned_to,
        created_by: currentUser.id,
        workbook_link: form.workbook_link || undefined,
      })
      onOpenChange(false)
      setForm({ client: 'Audi', description: '', assigned_to: 'all', workbook_link: '' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-sm bg-[#161B24] h-full overflow-y-auto shadow-2xl flex flex-col border-l border-[#2A2A2A]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A1515] bg-[#1E0A0A]">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-[#E87878]" />
            <h2 className="text-base font-semibold text-[#E87878]">Raise Urgent P1</h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-[#606060] hover:text-[#A0A0A0] transition-colors"><X size={18} /></button>
        </div>

        <div className="px-6 py-3 bg-[#1E0A0A] border-b border-[#3A1515]">
          <p className="text-xs text-[#D4B870]">Goes straight to the top of the queue. Add Workbook link now or after.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Client</label>
            <div className="px-3 py-2 bg-[#1E1E1E] border border-[#333] rounded-md text-sm text-[#A0A0A0] font-medium">
              Audi
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">What&apos;s broken / the ask <span className="text-[#E87878]">*</span></label>
            <textarea
              className={inp(errors.description)}
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the issue or request in as much detail as needed…"
            />
            {errors.description && <p className="text-xs text-[#E87878] mt-0.5">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Assign to</label>
            <select className={inp()} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="all">All Devs</option>
              {devs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Workbook link <span className="text-[#606060]">(optional)</span></label>
            <input className={inp(errors.workbook_link)} value={form.workbook_link} onChange={e => set('workbook_link', e.target.value)} placeholder={`${WORKBOOK_PREFIX}...`} />
            {errors.workbook_link && <p className="text-xs text-[#E87878] mt-0.5">{errors.workbook_link}</p>}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-[#3A1515] text-[#E87878] border border-[#5A2020] text-sm font-semibold rounded-lg hover:bg-[#4A1515] disabled:opacity-50 transition-colors">
              {submitting ? 'Raising…' : '🔴 Raise Urgent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function inp(error?: string) {
  return `w-full text-sm bg-[#1E1E1E] border rounded-md px-3 py-2 text-[#F0F0F0] placeholder-[#606060] focus:outline-none focus:ring-1 transition-colors
    ${error ? 'border-[#5A2020] focus:ring-[#4A1515]' : 'border-[#333] focus:ring-[#444]'}`
}
