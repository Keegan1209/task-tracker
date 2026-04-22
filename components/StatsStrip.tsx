'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface StatsStripProps {
  stats: {
    totalActive: number
    inProgress: number
    blocked: number
    overdue: number
    completedThisWeek: number
    p1sThisWeek: number
  }
  wipCapExceeded: boolean
}

const bannerVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.2 } },
}

function StatItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 border-r border-white/10 last:border-r-0">
      <span className={`font-mono text-lg font-bold tabular-nums ${highlight ? 'text-red-400' : 'text-white'}`}>
        {value}
      </span>
      <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>
    </div>
  )
}

export default function StatsStrip({ stats, wipCapExceeded }: StatsStripProps) {
  return (
    <div className="bg-[#0F0F0F]">
      <AnimatePresence>
        {wipCapExceeded && (
          <motion.div
            key="wip-banner"
            variants={bannerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 bg-red-900/40 border-b border-red-800/50 px-4 py-2 text-sm text-red-300">
              <AlertTriangle size={14} />
              WIP cap exceeded — {stats.inProgress} jobs in progress (max 3)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center flex-wrap">
        <StatItem label="Active" value={stats.totalActive} />
        <StatItem label="In Progress" value={stats.inProgress} highlight={wipCapExceeded} />
        <StatItem label="Blocked" value={stats.blocked} />
        <StatItem label="Overdue" value={stats.overdue} />
        <StatItem label="Done This Week" value={stats.completedThisWeek} />
        <StatItem label="P1s This Week" value={stats.p1sThisWeek} />
      </div>
    </div>
  )
}
