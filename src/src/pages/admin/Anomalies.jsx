import { useMemo, useState } from 'react'
import { ShieldAlert, Lightbulb } from 'lucide-react'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'
import { useAdminAnomalies } from '@/hooks/adminHooks/useAdminAnomalies'
import { useApp } from '@/context/AppContext'

const severityCls = {
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const statusCls = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export default function AdminAnomalies() {
  const { addToast } = useApp()
  const { anomalies, summary, loading, saving, error, saveAnomaly } = useAdminAnomalies()
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const isInitialLoading = loading && anomalies.length === 0 && !error
  const isRefreshing = !isInitialLoading && loading

  const filtered = useMemo(() => anomalies.filter((row) => {
    return (statusFilter === 'all' || row.status === statusFilter) && (severityFilter === 'all' || row.severity === severityFilter)
  }), [anomalies, statusFilter, severityFilter])

  const handleUpdate = async (id, payload) => {
    const result = await saveAnomaly(id, payload)
    addToast(result.message, result.success ? 'success' : 'error')
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div>
        <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-500" />AI Anomaly Oversight</h1>
        <p className="text-sm text-slate-400 mt-0.5">Monitor anomaly handling, reclassify severity, and review history</p>
        </div>
        <UpdatingBadge show={isRefreshing} />
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Today', value: summary.total_today, color: 'text-slate-800 dark:text-white' },
          { label: 'Critical', value: summary.critical_today, color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Minor', value: summary.minor_today, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Resolution Rate', value: `${summary.resolution_rate || 0}%`, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
            <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={item.value} className={`text-2xl font-bold ${item.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">
          <option value="all">All Severity</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Title', 'Meter', 'Floor', 'Severity', 'Status', 'Last vs Baseline', 'AI Insight', 'Admin Actions'].map((header) => (
                  <th key={header} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isInitialLoading ? (
                <TableLoadingRow colSpan={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No anomalies match the current filters.</td>
                </tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors align-top">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 min-w-[240px]">{row.title}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.meterName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.floor}</td>
                  <td className="px-4 py-3">
                    <select value={row.severity} onChange={(e) => handleUpdate(row.id, { severity: e.target.value })} disabled={saving} className={`px-2.5 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer ${severityCls[row.severity] || severityCls.medium}`}>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={row.status} onChange={(e) => handleUpdate(row.id, { status: e.target.value })} disabled={saving} className={`px-2.5 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer ${statusCls[row.status] || statusCls.open}`}>
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{row.lastValue.toLocaleString()} / {row.baselineValue.toLocaleString()}</td>
                  <td className="px-4 py-3 min-w-[320px]">
                    <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800/40 p-3">
                      {row.insightSummary && <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">{row.insightSummary}</p>}
                      <p className="text-xs text-violet-700/90 dark:text-violet-200 mb-2">{row.possibleCause}</p>
                      <div className={row.autoResolveCandidate
                        ? 'rounded-lg px-2.5 py-2 mb-2 bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'rounded-lg px-2.5 py-2 mb-2 bg-white/70 text-slate-600 dark:bg-slate-900/30 dark:text-slate-300'}>
                        <p className="text-[11px] font-semibold mb-1">Recommended Handling</p>
                        <p className="text-xs">
                          {row.recommendedHandling || 'Verify the site condition first, then resolve manually when confirmed.'}
                        </p>
                      </div>
                      {!!row.suggestedActions?.length && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                            <Lightbulb className="w-3.5 h-3.5" /> Suggested Actions
                          </div>
                          {row.suggestedActions.slice(0, 3).map((action, index) => (
                            <div key={`${row.id}-suggestion-${index}`} className="text-xs text-violet-700/90 dark:text-violet-200 flex gap-2">
                              <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[260px]">
                    <textarea defaultValue={row.notes} rows={2} onBlur={(e) => { if (e.target.value !== row.notes) handleUpdate(row.id, { notes: e.target.value }) }} className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none" placeholder="Admin note or override reason" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
