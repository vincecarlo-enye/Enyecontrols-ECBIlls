/**
 * components/billing/concerns/TicketStatusBadge.jsx
 */

import {
  Clock, UserCheck, Search, CheckCircle2, RefreshCw,
  XCircle, AlertCircle, RotateCcw, DollarSign
} from 'lucide-react'

const STATUS_CFG = {
  pending:      { label: 'Pending',       cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',       Icon: Clock },
  assigned:     { label: 'Assigned',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',           Icon: UserCheck },
  awaiting_tenant: { label: 'Awaiting Tenant', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', Icon: RefreshCw },
  investigating:{ label: 'Investigating', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',   Icon: Search },
  resolved:     { label: 'Resolved',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: CheckCircle2 },
  adjusted:     { label: 'Adjusted',      cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',           Icon: DollarSign },
  refund_pending: { label: 'Refund Pending', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',       Icon: DollarSign },
  closed:       { label: 'Closed',        cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',       Icon: XCircle },
  rejected:     { label: 'Rejected',      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               Icon: AlertCircle },
  reopened:     { label: 'Reopened',      cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',   Icon: RotateCcw },
}

export default function TicketStatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  const { Icon, label, cls } = cfg

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold ${size === 'xs' ? 'text-[10px]' : 'text-xs'} ${cls}`}>
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {label}
    </span>
  )
}

export { STATUS_CFG }

