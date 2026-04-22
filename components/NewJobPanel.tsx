'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { CreateJobPayload, JOB_TYPES, WORKBOOK_LINK_PREFIX, isValidWorkbookLink } from '@/types/job'

interface NewJobPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (job: CreateJobPayload) => Promise<void>
}

const AM_KEY = 'cms_tracker_am_name'

export default function NewJobPanel({ open, onOpenChange, onSubmit }: NewJobPanelProps) {
  const [form, setForm] = useState<Partial<CreateJobPayload>>({ priority: 'p2' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const savedAm = sessionStorage.getItem(AM_KEY) || ''
      setForm(f => ({ ...f, am: savedAm }))
    }
  }, [open])

  function set(field: keyof CreateJobPayload, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.title?.trim()) e.title = 'Required'
    if (form.workbook_link && !isValidWorkbookLink(form.workbook_link)) {
      e.workbook_link = `Must start with ${WORKBOOK_LINK_PREFIX}`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (form.am) sessionStorage.setItem(AM_KEY, form.am)
      await onSubmit(form as CreateJobPayload)
      onOpenChange(false)
      setForm({ priority: 'p2', am: form.am })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">New Job</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">

          {/* Title — required */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Job title <span className="text-red-500">*</span>
            </label>
            <input
              className={inp(errors.title)}
              value={form.title || ''}
              onChange={e => set('title', e.target.value)}
              placeholder="What needs doing?"
            />
            {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className={inp()}
              rows={3}
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Any extra context for the dev…"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
            <input
              className={inp()}
              value={form.client || ''}
              onChange={e => set('client', e.target.value)}
              placeholder="e.g. BMW"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['p1', 'p2', 'p3'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md border transition-colors
                    ${form.priority === p
                      ? p === 'p1' ? 'bg-red-600 text-white border-red-600'
                        : p === 'p2' ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-gray-600 text-white border-gray-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Job type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Job type</label>
            <select
              className={inp()}
              value={form.type || ''}
              onChange={e => set('type', e.target.value || undefined)}
            >
              <option value="">Select type…</option>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Workbook link */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Workbook link</label>
            <input
              className={inp(errors.workbook_link)}
              value={form.workbook_link || ''}
              onChange={e => set('workbook_link', e.target.value)}
              placeholder={`${WORKBOOK_LINK_PREFIX}...`}
            />
            {errors.workbook_link
              ? <p className="text-xs text-red-500 mt-0.5">{errors.workbook_link}</p>
              : <p className="text-xs text-gray-400 mt-0.5">Optional — add now or later</p>
            }
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Due date</label>
            <input
              type="date"
              className={inp()}
              value={form.due_date || ''}
              onChange={e => set('due_date', e.target.value)}
            />
          </div>

          {/* AM name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Your name</label>
            <input
              className={inp()}
              value={form.am || ''}
              onChange={e => set('am', e.target.value)}
              placeholder="e.g. Sarah M"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating…' : 'Push to Dev Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function inp(error?: string) {
  return `w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors
    ${error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-gray-400'}`
}
