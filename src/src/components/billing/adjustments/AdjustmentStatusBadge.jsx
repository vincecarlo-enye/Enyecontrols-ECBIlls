import { Ban, CheckCircle2, Clock3, FileText, XCircle } from 'lucide-react'

const STATUS_MAP = {
  draft: {
    label: 'Draft',
    Icon: FileText,
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  pending_approval: {
    label: 'Pending Approval',
    Icon: Clock3,
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    Icon: CheckCircle2,
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  applied: {
    label: 'Applied',
    Icon: CheckCircle2,
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  rejected: {
    label: 'Rejected',
    Icon: XCircle,
    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  cancelled: {
    label: 'Cancelled',
    Icon: Ban,
    cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  },
}

export default function AdjustmentStatusBadge({ status }) {
  const config = STATUS_MAP[status] || STATUS_MAP.draft
  const { Icon, label, cls } = config

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
