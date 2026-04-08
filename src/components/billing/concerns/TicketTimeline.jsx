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

export default function TicketTimeline({ timeline = [] }) {
  const rows = Array.isArray(timeline)
    ? timeline.map((entry, idx) => ({
        id: safeText(entry?.id, `timeline-${idx}`),
        role: safeText(entry?.role, 'admin'),
        action: safeText(entry?.action, 'Update recorded'),
        by: safeText(entry?.by, 'System'),
        date: safeText(entry?.date, ''),
        note: safeText(entry?.note, ''),
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
                {entry.by} · {entry.date}
              </p>
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
