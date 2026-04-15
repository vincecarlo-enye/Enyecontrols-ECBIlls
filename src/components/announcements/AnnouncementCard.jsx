/**
 * components/announcements/AnnouncementCard.jsx
 * Shows a single announcement with system-wide badge for SA announcements.
 */
import { Pencil, Trash2, Globe, AlertTriangle, Info, Bell } from 'lucide-react'
import { isSystemAnnouncement } from '@/permissions'

const TYPE_CONFIG = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/50', icon_cls: 'text-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  info:    { icon: Info,          bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-700/50',   icon_cls: 'text-blue-500',  badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'   },
  notice:  { icon: Bell,          bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-200 dark:border-slate-700/50', icon_cls: 'text-slate-500', badge: 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400' },
}

const PRIORITY_BADGE = {
  high:   'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  low:    'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
}

export default function AnnouncementCard({ ann, canEdit, canDelete, onEdit, onDelete }) {
  const tc = TYPE_CONFIG[ann.type] || TYPE_CONFIG.notice
  const Icon = tc.icon
  const systemWide = isSystemAnnouncement(ann)

  return (
    <div className={`relative min-w-0 rounded-xl border p-3 ${tc.bg} ${tc.border} group transition-all sm:p-4`}>
      {systemWide && (
        <div className="flex items-center gap-1 mb-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <Globe className="w-2.5 h-2.5"/>System-wide
          </span>
        </div>
      )}
      <div className="flex min-w-0 items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${tc.bg}`}>
          <Icon className={`w-4 h-4 ${tc.icon_cls}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="min-w-0 break-words text-sm font-semibold leading-snug text-slate-800 dark:text-white">{ann.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 sm:flex-shrink-0">
              {ann.priority && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${PRIORITY_BADGE[ann.priority]}`}>{ann.priority}</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${tc.badge}`}>{ann.type}</span>
            </div>
          </div>
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-500 dark:text-slate-400">{ann.body}</p>
          <p className="mt-2 break-words text-[10px] text-slate-400 dark:text-slate-500">{ann.date} · {ann.author}</p>
        </div>
      </div>
      {(canEdit || canDelete) && (
        <div className="mt-3 flex justify-end gap-1 sm:absolute sm:right-3 sm:top-3 sm:mt-0 sm:hidden sm:group-hover:flex">
          {canEdit && (
            <button onClick={() => onEdit(ann)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-500 transition-colors shadow-sm"><Pencil className="w-3 h-3"/></button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(ann.id)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-red-500 transition-colors shadow-sm"><Trash2 className="w-3 h-3"/></button>
          )}
        </div>
      )}
    </div>
  )
}

