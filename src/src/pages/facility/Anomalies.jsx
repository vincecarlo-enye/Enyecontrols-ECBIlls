import { formatDate } from '@/utils/filterUtils'
﻿import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, LineChart as LineChartIcon, MessageSquareText, Save, Lightbulb,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ChartExportButton from '@/components/common/ChartExportButton'
import { useFacilityAnomalies } from '@/hooks/facilityHooks/useFacilityAnomalies'
import { useApp } from '@/context/AppContext'
import { ChartLoadingState, LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'

const severityCls = {
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const statusCls = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}


export default function FacilityAnomalies() {
  const { addToast } = useApp()
  const { anomalies, analytics, stats, loading, saving, error, saveAnomaly } = useFacilityAnomalies()
  const [selectedId, setSelectedId] = useState(null)
  const [draftNotes, setDraftNotes] = useState('')

  const isInitialLoading = loading && anomalies.length === 0 && !error
  const isRefreshing = loading && anomalies.length > 0
  const selected = useMemo(() => anomalies.find((row) => row.id === selectedId) || anomalies[0] || null, [anomalies, selectedId])

  const handleSelect = (row) => {
    setSelectedId(row.id)
    setDraftNotes(row.notes || '')
  }

  const handleSave = async (payload) => {
    if (!selected) return
    const result = await saveAnomaly(selected.id, payload)
    addToast(result.message, result.success ? 'success' : 'error')
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">AI Anomaly Center</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time anomaly alerts, insights, and response actions</p>
        </div>
        <UpdatingBadge show={isRefreshing} />
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: stats.total, color: 'text-slate-800 dark:text-white' },
          { label: 'Open', value: stats.open, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Critical', value: stats.critical, color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Resolution Rate', value: `${analytics.resolved_rate || 0}%`, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
            <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={item.value} className={`text-2xl font-bold ${item.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
          </div>
        ))}
      </div>

      <div data-chart-export-panel="true" className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-slate-800 dark:text-white">Recurring Trend</h2>
          </div>
          <ChartExportButton title="Recurring Trend" rows={analytics.trend || []} />
        </div>
        {(analytics.trend || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="critical" stroke="#f43f5e" strokeWidth={2} dot={false} name="Critical" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        ) : isInitialLoading ? (
          <ChartLoadingState />
        ) : (
          <ChartLoadingState text="No chart data available yet." />
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-white">Live Alerts</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[560px] overflow-y-auto">
            {anomalies.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">No anomalies detected right now.</div>
            ) : anomalies.map((row) => (
              <button key={row.id} onClick={() => handleSelect(row)} className={`w-full text-left px-5 py-4 transition-colors ${selected?.id === row.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{row.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{row.meterName} - {row.floor}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium uppercase ${severityCls[row.severity] || severityCls.medium}`}>{row.severity}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium uppercase ${statusCls[row.status] || statusCls.open}`}>{row.status}</span>
                  <span className="text-[10px] text-slate-400">{formatDate(row.detectedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm p-5 space-y-5">
          {!selected ? (
            <div className="py-20 text-center text-sm text-slate-400">Select an anomaly to view details.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">{selected.title}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{selected.meterName} - {selected.unit} - {selected.floor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase ${severityCls[selected.severity] || severityCls.medium}`}>{selected.severity}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase ${statusCls[selected.status] || statusCls.open}`}>{selected.status}</span>
                </div>
              </div>

              {selected.insightSummary && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/40 p-4">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">AI Insight</p>
                  <p className="text-sm text-blue-700/90 dark:text-blue-200">{selected.insightSummary}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Current Reading</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{selected.lastValue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Baseline</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{selected.baselineValue.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/40 p-4">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Possible Cause</p>
                <p className="text-sm text-amber-700/90 dark:text-amber-200">{selected.possibleCause}</p>
              </div>

              <div className={selected.autoResolveCandidate
                ? 'rounded-xl p-4 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/40'
                : 'rounded-xl p-4 border border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700'}>
                <p className={selected.autoResolveCandidate
                  ? 'text-xs font-semibold mb-1 text-emerald-700 dark:text-emerald-300'
                  : 'text-xs font-semibold mb-1 text-slate-700 dark:text-slate-200'}>
                  AI Recommended Handling
                </p>
                <p className={selected.autoResolveCandidate
                  ? 'text-sm text-emerald-700/90 dark:text-emerald-200'
                  : 'text-sm text-slate-600 dark:text-slate-300'}>
                  {selected.recommendedHandling || 'Inspect on site, confirm the issue is fixed, then update the alert manually.'}
                </p>
                {selected.autoResolveCandidate && (
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/90 mt-2">
                    Readings look stable again, but this alert should still be verified on site before marking it resolved.
                  </p>
                )}
              </div>
              {!!selected.suggestedActions?.length && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-violet-600 dark:text-violet-300" />
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Suggested Actions</p>
                  </div>
                  <ul className="space-y-2 text-sm text-violet-700/90 dark:text-violet-200">
                    {selected.suggestedActions.map((action, index) => (
                      <li key={`${selected.id}-action-${index}`} className="flex gap-2">
                        <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Response Notes</label>
                <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={4} className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all resize-none" placeholder="e.g. leak fixed, faulty meter replaced" />
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleSave({ notes: draftNotes })} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                  <Save className="w-4 h-4" /> Save Notes
                </button>
                {selected.status !== 'resolved' && (
                  <button onClick={() => handleSave({ status: 'resolved', notes: draftNotes })} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">
                    <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                  </button>
                )}
                {selected.status === 'resolved' && (
                  <button onClick={() => handleSave({ status: 'open', notes: draftNotes })} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium disabled:opacity-50">
                    <AlertTriangle className="w-4 h-4" /> Reopen
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <MessageSquareText className="w-3.5 h-3.5" />
                Detected: {formatDate(selected.detectedAt)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
