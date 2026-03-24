import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import facilityMonitoringData from '@/data/facilityMonitoring.json'

const floorData = facilityMonitoringData.floorData
const liveData  = facilityMonitoringData.liveData

const statusColor = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function Monitoring() {
  const loading = usePageLoader(700)
  const [selected, setSelected] = useState('electricity')

  if (loading) return <FacilityPageSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-bold text-xl text-slate-800 dark:text-white">Building Monitoring</h1>
        <p className="text-sm text-slate-400 mt-0.5">Real-time building utility status per floor</p>
      </div>

      {/* Live Load Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white">Live Building Load</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total system load % today</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Current:</span>
            <span className="font-bold text-slate-800 dark:text-white">79%</span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
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

      {/* Utility Selector */}
      <div className="flex gap-2">
        {['electricity', 'water', 'thermal'].map(u => (
          <button
            key={u}
            onClick={() => setSelected(u)}
            className={`px-4 py-2 text-sm font-medium rounded-xl capitalize transition-all ${
              selected === u
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Floor Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white capitalize">{selected} Usage per Floor</h2>
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
              {floorData.map(row => {
                const val = row[selected]
                const avg = floorData.reduce((s, r) => s + r[selected], 0) / floorData.length
                const diff = (((val - avg) / avg) * 100).toFixed(1)
                return (
                  <tr key={row.floor} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{row.floor}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200">
                      {val} {selected === 'electricity' ? 'kWh' : selected === 'water' ? 'm³' : 'kBTU/h'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`flex items-center justify-end gap-1 text-xs font-medium ${Number(diff) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {Number(diff) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(diff)}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor[row.status]}`}>
                        {row.status === 'alert' ? '⚠ Alert' : row.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomaly Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-700/40">
        <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-rose-700 dark:text-rose-300 text-sm">Anomaly Detected – 3rd Floor</p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">Thermal energy usage is 32% above the floor average. Possible HVAC malfunction. Recommend inspection.</p>
        </div>
      </div>
    </div>
  )
}
