'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { CreateJobPayload, User, JOB_TYPES, WORKBOOK_PREFIX, isValidWorkbookLink } from '@/types/job'

interface NewJobPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (job: CreateJobPayload) => Promise<void>
  currentUser: User
  users: User[]
}

export default function NewJobPanel({ open, onOpenChange, onSubmit, currentUser, users }: NewJobPanelProps) {
  const devs = users.filter(u => u.role === 'dev' || u.role === 'admin')

  const [form, setForm] = useState({
    title: '',
    description: '',
    workbook_link: '',
    asset_links: [''],
    priority: 'p2' as 'p1' | 'p2' | 'p3',
    assigned_to: 'all',
    due_date: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.workbook_link.trim()) e.workbook_link = 'Required'
    else if (!isValidWorkbookLink(form.workbook_link)) e.workbook_link = `Must start with ${WORKBOOK_PREFIX}`
    if (form.priority === 'p1' && !form.due_date) e.due_date = 'Required for P1 jobs'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        workbook_link: form.workbook_link.trim(),
        asset_links: form.asset_links.filter(l => l.trim()),
        priority: form.priority,
        assigned_to: form.assigned_to,
        created_by: currentUser.id,
        due_date: form.due_date || undefined,
      })
      onOpenChange(false)
      setForm({ title: '', description: '', workbook_link: '', asset_links: [''], priority: 'p2', assigned_to: 'all', due_date: '' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-md bg-[#161B24] h-full overflow-y-auto shadow-2xl flex flex-col border-l border-[#2A2A2A]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-base font-semibold text-[#F0F0F0]">New Job</h2>
          <button onClick={() => onOpenChange(false)} className="text-[#606060] hover:text-[#A0A0A0] transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <Field label="Job title" error={errors.title} required>
            <input className={inp(errors.title)} value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs doing?" />
          </Field>

          <Field label="Description">
            <textarea className={inp()} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief context for the dev…" />
          </Field>

          <Field label="Workbook link" error={errors.workbook_link} required hint={`Must start with ${WORKBOOK_PREFIX}`}>
            <input className={inp(errors.workbook_link)} value={form.workbook_link} onChange={e => set('workbook_link', e.target.value)} placeholder={`${WORKBOOK_PREFIX}...`} />
          </Field>

          <Field label="Asset links" hint="Figma, Drive, WeTransfer, etc.">
            <div className="space-y-2">
              {form.asset_links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inp()}
                    value={link}
                    onChange={e => {
                      const updated = [...form.asset_links]
                      updated[i] = e.target.value
                      set('asset_links', updated)
                    }}
                    placeholder="https://..."
                  />
                  {form.asset_links.length > 1 && (
                    <button type="button" onClick={() => set('asset_links', form.asset_links.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => set('asset_links', [...form.asset_links, ''])} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                <Plus size={12} /> Add link
              </button>
            </div>
          </Field>

          <Field label="Priority">
            <div className="flex gap-2">
              {(['p1', 'p2', 'p3'] as const).map(p => (
                <button key={p} type="button" onClick={() => set('priority', p)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md border transition-colors
                    ${form.priority === p
                      ? p === 'p1' ? 'bg-red-600 text-white border-red-600'
                        : p === 'p2' ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-gray-600 text-white border-gray-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Assign to">
            <select className={inp()} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="all">All Devs</option>
              {devs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>

          {form.priority === 'p1' && (
            <Field label="Due date" error={errors.due_date} required>
              <input type="date" className={inp(errors.due_date)} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </Field>
          )}

          <div className="pt-2">
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-[#1A3A5A] text-[#7EB8E8] border border-[#2A5A8A] text-sm font-semibold rounded-lg hover:bg-[#2A4A6A] disabled:opacity-50 transition-colors">
              {submitting ? 'Creating…' : 'Push to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, hint, required, children }: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
        {label}{required && <span className="text-[#E87878] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#606060] mt-0.5">{hint}</p>}
      {error && <p className="text-xs text-[#E87878] mt-0.5">{error}</p>}
    </div>
  )
}

function inp(error?: string) {
  return `w-full text-sm bg-[#1E1E1E] border rounded-md px-3 py-2 text-[#F0F0F0] placeholder-[#606060] focus:outline-none focus:ring-1 transition-colors
    ${error ? 'border-[#5A2020] focus:ring-[#4A1515]' : 'border-[#333] focus:ring-[#444]'}`
}
