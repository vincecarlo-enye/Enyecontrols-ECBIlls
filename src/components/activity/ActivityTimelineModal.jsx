import { createPortal } from 'react-dom'
import { Clock3, Route, X } from 'lucide-react'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function prettyLabel(value) {
  if (!value) return 'General'
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function renderMetaValue(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function ActivityTimelineModal({ open, onClose, entityLabel, entityKey, loading, error, items = [] }) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-display font-700 text-[16px] text-slate-800 dark:text-white">Approval Timeline</h3>
            <p className="text-xs text-slate-400 mt-1">{entityLabel || 'Entity'} · {entityKey || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading timeline...</div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No timeline history found for this record yet.</div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id || `${item.entity_type}-${item.entity_id}-${index}`} className="relative pl-8">
                  <div className="absolute left-2 top-2 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30" />

                  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-800/60 p-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                            {prettyLabel(item.action)}
                          </span>
                          <span className="text-xs text-slate-400">{prettyLabel(item.role)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{item.description}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.user_name || 'System'}</p>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{formatDate(item.created_at)}</div>
                        <div className="flex items-center gap-1"><Route className="w-3.5 h-3.5" />{item.method ? `${item.method} ` : ''}{item.path || 'N/A'}</div>
                      </div>
                    </div>

                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <div key={key} className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 px-3 py-2">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{prettyLabel(key)}</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 break-words">{renderMetaValue(value)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
