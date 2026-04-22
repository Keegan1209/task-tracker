'use client'

import { useState } from 'react'
import { ExternalLink, Plus, AlertTriangle } from 'lucide-react'
import { isValidWorkbookLink, WORKBOOK_LINK_PREFIX } from '@/types/job'

interface WorkbookButtonProps {
  link: string | null
  jobId: string
  isFireAlarm?: boolean
  onLinkAdd: (jobId: string, link: string) => Promise<void>
}

export default function WorkbookButton({ link, jobId, isFireAlarm, onLinkAdd }: WorkbookButtonProps) {
  const [adding, setAdding] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
      >
        Open in Workbook
        <ExternalLink size={13} />
      </a>
    )
  }

  if (adding) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setError('') }}
            placeholder={`${WORKBOOK_LINK_PREFIX}...`}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button
            onClick={async () => {
              if (!isValidWorkbookLink(inputVal)) {
                setError(`Must start with ${WORKBOOK_LINK_PREFIX}`)
                return
              }
              setSaving(true)
              await onLinkAdd(jobId, inputVal)
              setSaving(false)
              setAdding(false)
            }}
            disabled={saving}
            className="px-2 py-1 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            onClick={() => { setAdding(false); setError('') }}
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {isFireAlarm && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          <AlertTriangle size={12} />
          Remember to log this in Workbook
        </div>
      )}
      <button
        onClick={() => setAdding(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 text-sm rounded-md hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <Plus size={13} />
        Add Workbook link
      </button>
    </div>
  )
}
