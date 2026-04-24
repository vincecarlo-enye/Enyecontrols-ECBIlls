import { formatDate, formatPeso} from '@/utils/filterUtils'
import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { History, TrendingUp, TrendingDown } from 'lucide-react'
import ChartExportButton from '@/components/common/ChartExportButton'

const TYPE_COLORS = {
  electricity: '#f59e0b',
  water: '#06b6d4',
  thermal: '#f43f5e',
}



function buildChartData(history = []) {
  const grouped = new Map()

  history
    .slice()
    .reverse()
    .forEach((entry) => {
      const label = formatDate(entry.created_at || entry.effective_from)
      const existing = grouped.get(label) || {
        label,
        electricity: null,
        water: null,
        thermal: null,
      }

      existing[entry.type] = Number(entry.new_price_per_unit || 0)
      grouped.set(label, existing)
    })

  return Array.from(grouped.values())
}

export default function RateHistoryPanel({ history = [], loading = false, compact = false }) {
  const chartData = useMemo(() => buildChartData(history), [history])
  const recentHistory = useMemo(() => history.slice(0, compact ? 4 : 8), [history, compact])

  if (loading && history.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <p className="text-sm text-slate-400">Loading rate history...</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <p className="text-sm text-slate-400">No rate history recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div data-chart-export-panel="true" className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">Rate Movement Trend</h3>
          </div>
          <ChartExportButton title="Rate Movement Trend" rows={chartData} />
        </div>
        <p className="text-xs text-slate-400 mb-4">Tracks when billing rates changed and the latest value applied over time.</p>
        <ResponsiveContainer width="100%" height={compact ? 220 : 280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip formatter={(value) => formatPeso(value)} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="electricity" name="Electricity" stroke={TYPE_COLORS.electricity} strokeWidth={2.5} connectNulls />
            <Line type="monotone" dataKey="water" name="Water" stroke={TYPE_COLORS.water} strokeWidth={2.5} connectNulls />
            <Line type="monotone" dataKey="thermal" name="Thermal" stroke={TYPE_COLORS.thermal} strokeWidth={2.5} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">Rate Change History</h3>
        </div>

        <div className="space-y-3">
          {recentHistory.map((entry) => {
            const increased = Number(entry.new_price_per_unit || 0) >= Number(entry.old_price_per_unit || 0)

            return (
              <div key={entry.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white capitalize">{entry.type}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {entry.changed_by_name} - {formatDate(entry.created_at || entry.effective_from)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${increased ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {increased ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {formatPeso(entry.old_price_per_unit)} to {formatPeso(entry.new_price_per_unit)}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                  {entry.impact_summary}
                </p>

                <p className="text-[11px] text-slate-400 mt-2">
                  Effective from {formatDate(entry.effective_from)} {entry.effective_to ? `to ${formatDate(entry.effective_to)}` : 'until now'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
