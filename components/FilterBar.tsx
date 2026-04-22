'use client'

import { Search } from 'lucide-react'

export type FilterType = 'all' | 'p1' | 'in-progress' | 'blocked' | 'in-review'
export type SortType = 'priority' | 'due-date' | 'created'

interface FilterBarProps {
  filter: FilterType
  sort: SortType
  search: string
  onFilterChange: (f: FilterType) => void
  onSortChange: (s: SortType) => void
  onSearchChange: (s: string) => void
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'p1', label: 'P1 Only' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'in-review', label: 'In Review' },
]

export default function FilterBar({ filter, sort, search, onFilterChange, onSortChange, onSearchChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white flex-wrap">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors
              ${filter === f.value
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Sort */}
      <select
        value={sort}
        onChange={e => onSortChange(e.target.value as SortType)}
        className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
      >
        <option value="priority">Sort: Priority</option>
        <option value="due-date">Sort: Due Date</option>
        <option value="created">Sort: Date Created</option>
      </select>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search jobs…"
          className="pl-8 pr-3 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 w-44"
        />
      </div>
    </div>
  )
}
