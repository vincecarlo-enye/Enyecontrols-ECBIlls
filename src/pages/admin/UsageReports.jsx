import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import utilitiesData from '@/data/mock/utilities.json'
const { electricityDaily, waterDaily, thermalDaily, monthlyOverview } = utilitiesData
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import { Download, Filter, CheckCircle2 } from 'lucide-react'

const chartData = [
  { title: 'Electricity', data: electricityDaily, key: 'usage', unit: 'kWh',    color: '#f59e0b', grad: 'elecR' },
  { title: 'Water',       data: waterDaily,       key: 'usage', unit: 'm³',     color: '#06b6d4', grad: 'waterR' },
  { title: 'Thermal',     data: thermalDaily,     key: 'usage', unit: 'kBTU/h', color: '#f43f5e', grad: 'thermR' },
]

export default function UsageReports() {
  const loading = usePageLoader(700)
  const { addToast } = useApp()
  const [activeCharts, setActiveCharts] = useState(['Electricity','Water','Thermal'])
  const [showFilter, setShowFilter]     = useState(false)

  if (loading) return <ReportsSkeleton />

  const toggleChart = (title) => {
    setActiveCharts(prev =>
      prev.includes(title) ? prev.filter(c => c !== title) : [...prev, title]
    )
  }

  // ── Export monthly overview as CSV ─────────────────────────
  const handleExport = () => {
    const rows = [
      ['SmartBuild Tower — Usage Report'],
      ['Generated:', new Date().toLocaleDateString('en-PH')],
      [],
      ['Month', 'Electricity (PHP)', 'Water (PHP)', 'Thermal (PHP)', 'Total (PHP)'],
      ...monthlyOverview.map(d => [
        d.month,
        d.electricity.toLocaleString(),
        d.water.toLocaleString(),
        d.thermal.toLocaleString(),
        (d.electricity + d.water + d.thermal).toLocaleString(),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    const month = new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }).replace(' ', '-')
    a.download = `usage-report-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Usage report exported to CSV')
  }

  // ── Export daily data as CSV ────────────────────────────────
  const handleExportDaily = () => {
    const rows = [
      ['SmartBuild Tower — Daily Usage Report'],
      [],
      ['Day', 'Electricity (kWh)', 'Water (m³)', 'Thermal (kBTU/h)'],
      ...electricityDaily.map((e, i) => [
        e.day,
        e.usage,
        waterDaily[i]?.usage ?? '',
        thermalDaily[i]?.usage ?? '',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'daily-usage-report-March2026.csv'; a.click()
    URL.revokeObjectURL(url)
    addToast('Daily usage exported to CSV')
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Usage Reports</h2>
          <p className="text-sm text-slate-400 mt-0.5">Detailed utility consumption analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <div className="relative">
            <button onClick={() => setShowFilter(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${showFilter ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}>
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/50 p-3 z-10" style={{animation:'slideUp .2s ease-out'}}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 px-1">Show Charts</p>
                {['Electricity','Water','Thermal'].map(label => (
                  <button key={label} onClick={() => toggleChart(label)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${activeCharts.includes(label) ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 opacity-50'} hover:bg-slate-100 dark:hover:bg-slate-700/60`}>
                    <CheckCircle2 className={`w-4 h-4 transition-colors ${activeCharts.includes(label) ? 'text-blue-500' : 'text-slate-300'}`} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleExportDaily}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Daily CSV</span>
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Individual charts - filterable */}
      {activeCharts.length > 0 && (
        <div className={`grid grid-cols-1 gap-4 ${activeCharts.length === 3 ? 'lg:grid-cols-3' : activeCharts.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-lg'}`}>
          {chartData.filter(c => activeCharts.includes(c.title)).map(chart => (
            <div key={chart.title} className="glass rounded-2xl p-5 shadow-lg">
              <h3 className="font-display font-700 text-[14px] text-slate-800 dark:text-white mb-1">{chart.title} Usage</h3>
              <p className="text-xs text-slate-400 mb-4">Last 7 days</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={chart.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id={chart.grad} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'rgba(255,255,255,0.95)', borderRadius:'10px', border:'1px solid rgba(226,232,240,0.8)', fontSize:'11px' }}
                    formatter={v => [`${v} ${chart.unit}`, chart.title]} />
                  <Area type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} fill={`url(#${chart.grad})`}
                    dot={{ fill: chart.color, r: 3, stroke: '#fff', strokeWidth: 1.5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Monthly breakdown */}
      <div className="glass rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">Monthly Cost Breakdown</h3>
          <button onClick={handleExport} className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">Oct 2025 – Mar 2026</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyOverview} barSize={14} barGap={3} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:'rgba(255,255,255,0.95)', borderRadius:'12px', border:'1px solid rgba(226,232,240,0.8)', fontSize:'12px' }}
              formatter={(value) => [`PHP ${value.toLocaleString()}`, '']} />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
            <Bar dataKey="electricity" name="Electricity" fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="water"       name="Water"       fill="#06b6d4" radius={[4,4,0,0]} />
            <Bar dataKey="thermal"     name="Thermal"     fill="#f43f5e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost trend */}
      <div className="glass rounded-2xl p-5 shadow-lg">
        <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white mb-1">Total Cost Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Combined utility costs</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyOverview.map(d => ({ ...d, total: d.electricity + d.water + d.thermal }))} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:'rgba(255,255,255,0.95)', borderRadius:'12px', border:'1px solid rgba(226,232,240,0.8)', fontSize:'12px' }}
              formatter={(value) => [`PHP ${value.toLocaleString()}`, 'Total']} />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
              dot={{ fill:'#3b82f6', r:5, stroke:'#fff', strokeWidth:2 }} activeDot={{ r:7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
