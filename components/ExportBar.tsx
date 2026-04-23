'use client'

import { useState } from 'react'
import { format, startOfWeek } from 'date-fns'
import { CalendarIcon, Download } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ExportBarProps {
  defaultFrom?: Date
  defaultTo?: Date
}

// Minimal inline calendar for range picking — no external dependency beyond date-fns
function MiniCalendar({
  month,
  selected,
  onSelect,
  rangeStart,
}: {
  month: Date
  selected: Date | null
  onSelect: (d: Date) => void
  rangeStart: Date | null
}) {
  const year = month.getFullYear()
  const mon = month.getMonth()
  const firstDay = new Date(year, mon, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, mon + 1, 0).getDate()
  // Shift so Monday = 0
  const startOffset = (firstDay + 6) % 7

  const days: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, mon, i + 1)),
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function isInRange(d: Date) {
    if (!rangeStart || !selected) return false
    const lo = rangeStart < selected ? rangeStart : selected
    const hi = rangeStart < selected ? selected : rangeStart
    return d >= lo && d <= hi
  }

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-[10px] text-[#505060] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d, i) => {
          if (!d) return <div key={i} />
          const isToday = d.getTime() === today.getTime()
          const isSel = selected && d.getTime() === selected.getTime()
          const isStart = rangeStart && d.getTime() === rangeStart.getTime()
          const inRange = isInRange(d)
          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className={`
                text-xs py-1 rounded transition-colors
                ${isSel || isStart ? 'bg-[#5B9BD5] text-white font-semibold' : ''}
                ${inRange && !isSel && !isStart ? 'bg-[#5B9BD5]/20 text-[#7EB8E8]' : ''}
                ${!isSel && !isStart && !inRange ? 'text-[#C0C0C0] hover:bg-white/10' : ''}
                ${isToday && !isSel && !isStart ? 'ring-1 ring-[#5B9BD5]/50' : ''}
              `}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ExportBar({ defaultFrom, defaultTo }: ExportBarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const defaultStart = defaultFrom ?? startOfWeek(today, { weekStartsOn: 1 })
  const defaultEnd = defaultTo ?? today

  const [from, setFrom] = useState<Date>(defaultStart)
  const [to, setTo] = useState<Date>(defaultEnd)
  const [open, setOpen] = useState(false)
  const [pickingEnd, setPickingEnd] = useState(false)
  const [tempFrom, setTempFrom] = useState<Date>(defaultStart)
  const [calMonth, setCalMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))
  const [exporting, setExporting] = useState(false)

  function handleDayClick(d: Date) {
    if (!pickingEnd) {
      setTempFrom(d)
      setPickingEnd(true)
    } else {
      const lo = tempFrom < d ? tempFrom : d
      const hi = tempFrom < d ? d : tempFrom
      setFrom(lo)
      setTo(hi)
      setPickingEnd(false)
      setOpen(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const f = format(from, 'yyyy-MM-dd')
      const t = format(to, 'yyyy-MM-dd')
      const res = await fetch(`/api/export?from=${f}&to=${t}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobs-${f}-to-${t}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const prevMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  return (
    <div className="flex items-center gap-2">
      {/* Date range picker */}
      <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setPickingEnd(false) }}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#C0C0C0] bg-transparent border border-white/10 rounded-md hover:border-white/20 hover:text-white transition-all">
            <CalendarIcon size={13} />
            <span>
              {format(from, 'd MMM yyyy')}
              <span className="mx-1.5 text-[#505060]">→</span>
              {format(to, 'd MMM yyyy')}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="text-[#606060] hover:text-white px-1 transition-colors">‹</button>
            <span className="text-xs font-semibold text-white">
              {format(calMonth, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="text-[#606060] hover:text-white px-1 transition-colors">›</button>
          </div>
          <p className="text-[10px] text-[#505060] mb-2">
            {pickingEnd ? 'Click end date' : 'Click start date'}
          </p>
          <MiniCalendar
            month={calMonth}
            selected={pickingEnd ? null : from}
            rangeStart={pickingEnd ? tempFrom : null}
            onSelect={handleDayClick}
          />
        </PopoverContent>
      </Popover>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C0C0C0] bg-transparent border border-white/10 rounded-md hover:border-white/20 hover:text-white hover:-translate-y-px transition-all disabled:opacity-50"
      >
        <Download size={13} />
        {exporting ? 'Exporting…' : 'Export CSV'}
      </button>
    </div>
  )
}
