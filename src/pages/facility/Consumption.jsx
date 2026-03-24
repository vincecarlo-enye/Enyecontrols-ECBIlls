import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { Zap, Droplets, Flame, TrendingUp } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import facilityConsumptionData from '@/data/facilityConsumption.json'

const unitConsumption = facilityConsumptionData.unitConsumption
const trendData       = facilityConsumptionData.trendData

const statusBadge = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function Consumption() {
  const loading = usePageLoader(700)
  const [view, setView] = useState('unit')

  if (loading) return <FacilityPageSkeleton />

  const anomalies = unitConsumption.filter(u => u.status === 'alert')

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-bold text-xl text-slate-800 dark:text-white">Utility Consumption</h1>
        <p className="text-sm text-slate-400 mt-0.5">Monitor electricity, water, and thermal usage per unit or floor</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Electricity', val: '4,827 kWh', icon: Zap, color: 'from-amber-400 to-orange-500' },
          { label: 'Water', val: '457 m³', icon: Droplets, color: 'from-cyan-400 to-blue-500' },
          { label: 'Thermal', val: '2,088 kBTU/h', icon: Flame, color: 'from-rose-400 to-pink-500' },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
              <p className="font-bold text-slate-800 dark:text-white text-lg">{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
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

      {/* Anomaly Highlights */}
      {anomalies.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 rounded-2xl p-4">
          <p className="font-semibold text-rose-700 dark:text-rose-300 text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Abnormal Spikes Detected
          </p>
          {anomalies.map(a => (
            <p key={a.unit} className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              • {a.unit} ({a.floor}): Water {a.water} m³ — significantly above average
            </p>
          ))}
        </div>
      )}

      {/* Unit Table */}
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
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Water (m³)</th>
                <th className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Thermal</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {unitConsumption.map(row => (
                <tr key={row.unit} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{row.unit}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{row.floor}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200">{row.electricity}</td>
                  <td className={`px-5 py-3.5 text-right font-mono font-bold ${row.status === 'alert' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>{row.water}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200">{row.thermal}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusBadge[row.status]}`}>
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
