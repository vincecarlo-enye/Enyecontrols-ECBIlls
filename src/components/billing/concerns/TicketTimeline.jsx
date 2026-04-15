/**
 * components/billing/concerns/TicketTimeline.jsx
 */

import { User, ShieldCheck, Banknote } from 'lucide-react'

const ROLE_CFG = {
  tenant: {
    label: 'Tenant',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    Icon: User,
  },
  admin: {
    label: 'Admin',
    cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    Icon: ShieldCheck,
  },
  finance: {
    label: 'Finance',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    Icon: Banknote,
  },
}

function safeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function formatPeso(value) {
  const amount = Number(value || 0)
  return `PHP ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getAdjustmentSummary(metadata = {}) {
  const rawType = safeText(metadata?.workflow_type && metadata.workflow_type !== 'direct_adjustment' ? metadata.workflow_type : metadata?.adjustment_type)
  const type = rawType === 'additional_charge' ? 'charge' : rawType
  const displayAmount = Number(metadata?.display_amount || Math.abs(Number(metadata?.adjustment_amount || 0)))
  const newBillAmount = Number(metadata?.new_bill_amount || 0)

  if (!type || !displayAmount) return null

  const direction = type === 'refund' ? 'Refund to GCash' : type === 'credit' ? 'Deduction/Credit' : 'Additional Charge'
  const parts = [`${direction}: ${formatPeso(displayAmount)}`]
  if (newBillAmount) parts.push(`New bill total: ${formatPeso(newBillAmount)}`)
  if (metadata?.bill_id) parts.push(`Bill #${metadata.bill_id}`)

  return parts.join(' | ')
}

export default function TicketTimeline({ timeline = [] }) {
  const rows = Array.isArray(timeline)
    ? timeline.map((entry, idx) => ({
        id: safeText(entry?.id, `timeline-${idx}`),
        role: safeText(entry?.role, 'admin'),
        action: safeText(entry?.action, 'Update recorded'),
        by: safeText(entry?.by, 'System'),
        date: safeText(entry?.date, ''),
        note: safeText(entry?.note, ''),
        adjustmentSummary: getAdjustmentSummary(entry?.metadata || {}),
      }))
    : []

  if (!rows.length) return null

  return (
    <div className="space-y-0">
      {rows.map((entry, idx) => {
        const cfg = ROLE_CFG[entry.role] || ROLE_CFG.admin
        const { Icon, cls } = cfg
        const isLast = idx === rows.length - 1

        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cls}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1" />}
            </div>

            <div className="pb-4">
              <p className="text-sm font-medium text-slate-800 dark:text-white leading-snug">
                {entry.action}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {entry.by} - {entry.date}
              </p>
              {entry.adjustmentSummary && (
                <p className="mt-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 rounded-lg px-3 py-2 border border-teal-100 dark:border-teal-700/40">
                  {entry.adjustmentSummary}
                </p>
              )}
              {entry.note && (
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-700/50">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


