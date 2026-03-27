/**
 * components/billing/concerns/TicketCard.jsx
 */

import { Eye, Calendar, Building2 } from 'lucide-react'
import TicketStatusBadge from './TicketStatusBadge'

const PRIORITY_CFG = {
  high:   'text-red-600 dark:text-red-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low:    'text-slate-500 dark:text-slate-400',
}

export default function TicketCard({ concern, onView }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-slate-400">{concern.id}</span>
            <TicketStatusBadge status={concern.status} />
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_CFG[concern.priority] || PRIORITY_CFG.medium}`}>
              {concern.priority}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1 truncate">
            {concern.category}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
            {concern.message}
          </p>
        </div>
        <button
          onClick={() => onView(concern)}
          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Building2 className="w-3 h-3" />
          <span>Bill: <span className="font-mono text-slate-600 dark:text-slate-300">{concern.billId}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{concern.dateSubmitted || concern.createdAt}</span>
        </div>
      </div>
    </div>
  )
}
