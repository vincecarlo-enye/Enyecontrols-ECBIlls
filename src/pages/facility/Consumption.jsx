import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Zap, Droplets, Flame, TrendingUp } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import { useFacilityConsumption } from '@/hooks/facilityHooks/useFacilityConsumption'

const statusBadge = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const utilityMeta = {
  electricity: { label: 'Electricity', unit: 'kWh', icon: Zap, color: 'from-amber-400 to-orange-500' },
  water: { label: 'Water', unit: 'm3', icon: Droplets, color: 'from-cyan-400 to-blue-500' },
  thermal: { label: 'Thermal', unit: 'kBTU/h', icon: Flame, color: 'from-rose-400 to-pink-500' },
}

export default function Consumption() {
  const pageLoading = usePageLoader(700)
  const { summary, trendData, unitConsumption, anomalies, loading, error } = useFacilityConsumption()
  const [view] = useState('unit')

  const loadingState = pageLoading || loading
  if (loadingState) return <FacilityPageSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-bold text-xl text-slate-800 dark:text-white">Utility Consumption</h1>
        <p className="text-sm text-slate-400 mt-0.5">Monitor electricity, water, and thermal usage per unit or floor</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(utilityMeta).map(([key, meta]) => {
          const Icon = meta.icon
          return (
            <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{meta.label}</p>
                <p className="font-bold text-slate-800 dark:text-white text-lg">{Number(summary[key] || 0).toLocaleString()} {meta.unit}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Weekly Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="electricity" stroke="#f59e0b" strokeWidth={2} dot={false} name="Electricity" />
            <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} dot={false} name="Water" />
            <Line type="monotone" dataKey="thermal" stroke="#f43f5e" strokeWidth={2} dot={false} name="Thermal" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {anomalies.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 rounded-2xl p-4">
          <p className="font-semibold text-rose-700 dark:text-rose-300 text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Abnormal Spikes Detected
          </p>
          {anomalies.map((row) => (
            <p key={row.unit} className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              - {row.unit} ({row.floor}): Water {Number(row.water || 0).toLocaleString()} m3 above the recent average
            </p>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white">Consumption per Unit</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Unit</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Floor</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Elec (kWh)</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Water (m3)</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Thermal</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {unitConsumption.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No consumption data available yet.</td>
                </tr>
              ) : unitConsumption.map((row) => (
                <tr key={row.unit} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{row.unit}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{row.floor}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200">{Number(row.electricity || 0).toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right font-mono font-bold ${row.status === 'alert' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>{Number(row.water || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200">{Number(row.thermal || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusBadge[row.status] || statusBadge.normal}`}>
                      {row.status}
                    </span>
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
