import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import { useFacilityMonitoring } from '@/hooks/facilityHooks/useFacilityMonitoring'
import { useApp } from '@/context/AppContext'

const statusColor = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const utilityLabel = {
  electricity: 'Electricity',
  water: 'Water',
  thermal: 'Thermal',
}

const utilityUnit = {
  electricity: 'kWh',
  water: 'm3',
  thermal: 'kBTU/h',
}

function formatUpdatedAt(value) {
  if (!value) return 'Never'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatReadingDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Monitoring() {
  const pageLoading = usePageLoader(700)
  const { addToast } = useApp()
  const {
    liveData,
    currentLoad,
    trend,
    floorData,
    anomaly,
    pendingReadings,
    approvalSummary,
    loading,
    acting,
    error,
    lastUpdated,
    reload,
    approveReading,
    rejectReading,
  } = useFacilityMonitoring()
  const [selected, setSelected] = useState('electricity')
  const [refreshing, setRefreshing] = useState(false)

  const loadingState = pageLoading || loading
  const average = useMemo(() => {
    if (!floorData.length) return 0
    return floorData.reduce((sum, row) => sum + Number(row?.[selected] || 0), 0) / floorData.length
  }, [floorData, selected])

  const peakFloor = useMemo(() => {
    if (!floorData.length) return null

    return floorData.reduce((highest, row) => {
      if (!highest) return row
      return Number(row?.[selected] || 0) > Number(highest?.[selected] || 0) ? row : highest
    }, null)
  }, [floorData, selected])

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await reload()
    } finally {
      setRefreshing(false)
    }
  }

  const handleApprove = async (readingId) => {
    const result = await approveReading(readingId)
    addToast(result.message, result.success ? 'success' : 'error')
  }

  const handleReject = async (readingId) => {
    const result = await rejectReading(readingId)
    addToast(result.message, result.success ? 'info' : 'error')
  }

  if (loadingState) return <FacilityPageSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Building Monitoring</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time building utility status plus meter reading approval queue</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
            Updated {formatUpdatedAt(lastUpdated)}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Current Load', value: `${Math.round(currentLoad)}%`, tone: 'text-blue-600 dark:text-blue-400', icon: Activity },
          { label: 'Trend', value: `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`, tone: trend > 0 ? 'text-rose-500' : 'text-emerald-500', icon: trend > 0 ? TrendingUp : TrendingDown },
          { label: 'Peak Floor', value: peakFloor?.floor || '-', tone: 'text-slate-800 dark:text-white', icon: AlertTriangle },
          { label: 'Pending Approval', value: approvalSummary?.pending || 0, tone: 'text-amber-600 dark:text-amber-400', icon: Clock },
          { label: 'Approved Today', value: approvalSummary?.approved || 0, tone: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center">
                <card.icon className={`w-5 h-5 ${card.tone}`} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className={`text-xl font-bold ${card.tone}`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white">Live Building Load</h2>
            <p className="text-xs text-slate-400 mt-0.5">Auto-refreshes every 30 seconds</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Current:</span>
            <span className="font-bold text-slate-800 dark:text-white">{Math.round(currentLoad)}%</span>
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={liveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Line type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="Load %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white">Pending Reading Approval</h2>
            <p className="text-xs text-slate-400 mt-0.5">Only approved readings should be used by Finance for bill generation</p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-50 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            {pendingReadings.length} pending
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Recorded At', 'Meter', 'Page', 'Floor/Unit', 'Type', 'Reading', 'Usage', 'Actions'].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingReadings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                    No pending meter readings. Finance can generate bills from approved readings.
                  </td>
                </tr>
              ) : pendingReadings.map((reading) => (
                <tr key={reading.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatReadingDate(reading.recorded_at)}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{reading.watch_name}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{reading.page_name || '-'}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{reading.floor_label || reading.unit_label || '-'}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 capitalize whitespace-nowrap">{reading.type || '-'}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">{Number(reading.reading_value || 0).toLocaleString()} {reading.unit || ''}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">{Number(reading.usage_value || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(reading.id)}
                        disabled={acting}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-900/20 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(reading.id)}
                        disabled={acting}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-900/20 dark:text-rose-400"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['electricity', 'water', 'thermal'].map((utility) => (
          <button
            key={utility}
            onClick={() => setSelected(utility)}
            className={`px-4 py-2 text-sm font-medium rounded-xl capitalize transition-all ${
              selected === utility
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {utilityLabel[utility]}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white capitalize">{utilityLabel[selected]} Usage per Floor</h2>
          <p className="text-xs text-slate-400">Average: {average.toLocaleString(undefined, { maximumFractionDigits: 1 })} {utilityUnit[selected]}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Floor</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Usage</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">vs Avg</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {floorData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                    No monitoring data available yet.
                  </td>
                </tr>
              ) : floorData.map((row) => {
                const value = Number(row?.[selected] || 0)
                const diff = average > 0 ? (((value - average) / average) * 100).toFixed(1) : '0.0'

                return (
                  <tr key={row.floor} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{row.floor}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200">
                      {value.toLocaleString()} {utilityUnit[selected]}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`flex items-center justify-end gap-1 text-xs font-medium ${Number(diff) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {Number(diff) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(Number(diff)).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor[row.status] || statusColor.normal}`}>
                        {row.status === 'alert' ? 'Alert' : row.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
        anomaly?.severity === 'alert'
          ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700/40'
          : anomaly?.severity === 'high'
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/40'
            : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/40'
      }`}>
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          anomaly?.severity === 'alert'
            ? 'text-rose-500'
            : anomaly?.severity === 'high'
              ? 'text-amber-500'
              : 'text-emerald-500'
        }`} />
        <div>
          <p className={`font-semibold text-sm ${
            anomaly?.severity === 'alert'
              ? 'text-rose-700 dark:text-rose-300'
              : anomaly?.severity === 'high'
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300'
          }`}>
            {anomaly?.title || 'No anomaly detected'}
          </p>
          <p className={`text-xs mt-0.5 ${
            anomaly?.severity === 'alert'
              ? 'text-rose-600 dark:text-rose-400'
              : anomaly?.severity === 'high'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {anomaly?.message || 'All monitored floors are within the expected usage range.'}
          </p>
        </div>
      </div>
    </div>
  )
}

