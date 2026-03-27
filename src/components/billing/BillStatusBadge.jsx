import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle, Send } from 'lucide-react'

export const STATUS_CFG = {
  draft:              { label: 'Draft',              Icon: FileText,       cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  published:          { label: 'Published',          Icon: Send,           cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  submitted:          { label: 'Submitted',          Icon: Clock,          cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  payment_submitted:  { label: 'Payment Submitted',  Icon: Clock,          cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  paid:               { label: 'Paid',               Icon: CheckCircle2,   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  overdue:            { label: 'Overdue',            Icon: AlertTriangle,  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  verified:           { label: 'Verified',           Icon: CheckCircle2,   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected:           { label: 'Rejected',           Icon: XCircle,        cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  partial:            { label: 'Partial',            Icon: Clock,          cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  // legacy fallbacks
  unpaid:             { label: 'Unpaid',             Icon: XCircle,        cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  pending:            { label: 'Pending',            Icon: Clock,          cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

export default function BillStatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.published
  const { Icon, label, cls } = cfg
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-[11px]'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${textSize} ${cls}`}>
      <Icon className={iconSize} />
      {label}
    </span>
  )
}
