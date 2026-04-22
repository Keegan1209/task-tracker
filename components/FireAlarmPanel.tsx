'use client'

import { useState } from 'react'
import { X, Flame } from 'lucide-react'
import { FireAlarmPayload, isValidWorkbookLink, WORKBOOK_LINK_PREFIX } from '@/types/job'

interface FireAlarmPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (job: FireAlarmPayload) => Promise<void>
}

export default function FireAlarmPanel({ open, onOpenChange, onSubmit }: FireAlarmPanelProps) {
  const [form, setForm] = useState<Partial<FireAlarmPayload>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function set(field: keyof FireAlarmPayload, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.client?.trim()) e.client = 'Required'
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
      await onSubmit(form as FireAlarmPayload)
      onOpenChange(false)
      setForm({})
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-red-600" />
            <h2 className="text-base font-semibold text-red-900">Raise Urgent P1</h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-700">
            This job goes straight to the active queue. Add the Workbook link now or after — it&apos;s required before marking Live.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <input
              className={inp(errors.client)}
              value={form.client || ''}
              onChange={e => set('client', e.target.value)}
              placeholder="e.g. BMW"
            />
            {errors.client && <p className="text-xs text-red-500 mt-0.5">{errors.client}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              What&apos;s broken / the ask <span className="text-red-500">*</span>
            </label>
            <input
              className={inp(errors.title)}
              value={form.title || ''}
              onChange={e => set('title', e.target.value)}
              placeholder="One-line description of the issue"
            />
            {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="px-3 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-md">
              🔴 P1 — Locked
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Workbook link <span className="text-gray-400">(optional — add later if needed)</span>
            </label>
            <input
              className={inp(errors.workbook_link)}
              value={form.workbook_link || ''}
              onChange={e => set('workbook_link', e.target.value)}
              placeholder={`${WORKBOOK_LINK_PREFIX}...`}
            />
            {errors.workbook_link && <p className="text-xs text-red-500 mt-0.5">{errors.workbook_link}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Raising…' : '🔴 Raise Urgent'}
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
