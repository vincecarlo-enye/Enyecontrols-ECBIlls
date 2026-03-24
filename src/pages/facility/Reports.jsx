import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { FileBarChart, Download } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import facilityReportsData from '@/data/facilityReports.json'

const REPORT_TYPES = facilityReportsData.reportTypes
const dailyEnergy  = facilityReportsData.dailyEnergy
const monthlyWater = facilityReportsData.monthlyWater
const thermalDist  = facilityReportsData.thermalDist
const peakUsage    = facilityReportsData.peakUsage

export default function Reports() {
  const loading = usePageLoader(700)
  const [selected, setSelected] = useState('Daily Energy')

  if (loading) return <ReportsSkeleton />

    const convertToCSV = (data) => {
  if (!data || !data.length) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(obj =>
    headers.map(h => `"${obj[h]}"`).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

const getCurrentData = () => {
  switch (selected) {
    case 'Daily Energy':
      return dailyEnergy
    case 'Monthly Water':
      return monthlyWater
    case 'Thermal Distribution':
      return thermalDist
    case 'Peak Usage':
      return peakUsage
    default:
      return []
  }
}

const handleExport = () => {
  const data = getCurrentData()

  if (!data.length) return

  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `facility-report-${selected.toLowerCase().replace(/\s+/g, '-')}.csv`
  )

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Operational Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Generate and view reports to optimize building efficiency</p>
        </div>
        <button
  onClick={handleExport}
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl 
  bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
  shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
  transition-all duration-200"
>
  <Download className="w-4 h-4" />
  Export CSV
</button>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map(r => (
          <button
            key={r}
            onClick={() => setSelected(r)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              selected === r
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Report Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-800 dark:text-white">{selected} Report</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {selected === 'Daily Energy' && 'Electricity consumption today (kWh by hour)'}
            {selected === 'Monthly Water' && 'Water usage per floor – Jan to Mar 2026 (m³)'}
            {selected === 'Thermal Distribution' && 'Breakdown of thermal energy usage by system'}
            {selected === 'Peak Usage' && 'Peak consumption hours across all utilities'}
          </p>
        </div>

        {selected === 'Daily Energy' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyEnergy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" kWh" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="usage" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Electricity (kWh)" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {selected === 'Monthly Water' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyWater}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="floor" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" m³" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="jan" fill="#06b6d4" radius={[4, 4, 0, 0]} name="January" />
              <Bar dataKey="feb" fill="#0284c7" radius={[4, 4, 0, 0]} name="February" />
              <Bar dataKey="mar" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="March" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {selected === 'Thermal Distribution' && (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={thermalDist} cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3} dataKey="value">
                  {thermalDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 flex-wrap justify-center mt-2">
              {thermalDist.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selected === 'Peak Usage' && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={peakUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="elec" stroke="#f59e0b" strokeWidth={2} dot={false} name="Electricity" />
              <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} dot={false} name="Water" />
              <Line type="monotone" dataKey="thermal" stroke="#f43f5e" strokeWidth={2} dot={false} name="Thermal" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Efficiency Summary – March 2026</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-2 text-xs font-mono uppercase tracking-wider text-slate-400">Metric</th>
                <th className="text-right py-2 text-xs font-mono uppercase tracking-wider text-slate-400">Value</th>
                <th className="text-right py-2 text-xs font-mono uppercase tracking-wider text-slate-400">vs Last Month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { metric: 'Total Electricity', value: '17,991 kWh', diff: '+11%', up: true },
                { metric: 'Total Water', value: '4,800 m³', diff: '+11.6%', up: true },
                { metric: 'Total Thermal', value: '12,400 kBTU/h', diff: '+4.2%', up: true },
                { metric: 'Peak Load Time', value: '12:00 PM', diff: '—', up: null },
                { metric: 'Avg Daily Consumption', value: '598 kWh/day', diff: '-2.1%', up: false },
              ].map(row => (
                <tr key={row.metric} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 text-slate-700 dark:text-slate-200">{row.metric}</td>
                  <td className="py-3 text-right font-mono font-medium text-slate-700 dark:text-slate-200">{row.value}</td>
                  <td className={`py-3 text-right text-xs font-medium ${row.up === true ? 'text-rose-500' : row.up === false ? 'text-emerald-500' : 'text-slate-400'}`}>{row.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
