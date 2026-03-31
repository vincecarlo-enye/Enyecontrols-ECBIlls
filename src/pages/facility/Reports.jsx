import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import { Download, Gauge, Clock3, CheckCircle2, AlertTriangle } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import { useFacilityReports } from '@/hooks/facilityHooks/useFacilityReports'

const TYPE_LABELS = {
  electricity: 'Electricity',
  water: 'Water',
  thermal: 'Thermal',
}

const TYPE_BADGES = {
  electricity: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  water: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
  thermal: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
}

const APPROVAL_BADGES = {
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  pending_approval: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
  no_data: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
}

function formatDateTime(value) {
  if (!value) return 'No reading yet'
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

function formatApprovalLabel(value) {
  if (!value) return 'No data'
  return String(value).replace(/_/g, ' ')
}

export default function Reports() {
  const pageLoading = usePageLoader(700)
  const {
    reportTypes,
    dailyEnergy,
    monthlyWater,
    thermalDistribution,
    peakUsage,
    summary,
    latestMeterReadings,
    overview,
    loading,
    error,
  } = useFacilityReports()
  const [selected, setSelected] = useState('Daily Energy')

  const currentData = useMemo(() => {
    switch (selected) {
      case 'Daily Energy':
        return dailyEnergy
      case 'Monthly Water':
        return monthlyWater
      case 'Thermal Distribution':
        return thermalDistribution
      case 'Peak Usage':
        return peakUsage
      default:
        return []
    }
  }, [selected, dailyEnergy, monthlyWater, thermalDistribution, peakUsage])

  const loadingState = pageLoading || loading
  if (loadingState) return <ReportsSkeleton />

  const convertToCSV = (data) => {
    if (!data || !data.length) return ''
    const headers = Object.keys(data[0])
    const rows = data.map((obj) => headers.map((header) => `"${obj[header] ?? ''}"`).join(','))
    return [headers.join(','), ...rows].join('\n')
  }

  const handleExport = () => {
    const exportData = selected === 'Peak Usage' || selected === 'Daily Energy' || selected === 'Monthly Water' || selected === 'Thermal Distribution'
      ? currentData
      : latestMeterReadings

    if (!exportData.length) return

    const csv = convertToCSV(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `facility-report-${selected.toLowerCase().replace(/\s+/g, '-')}.csv`)
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
          <p className="text-sm text-slate-400 mt-0.5">Cleaner facility reports with live meter reading visibility and trend analytics</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Meters', value: overview.totalMeters, icon: Gauge, tone: 'text-blue-600 dark:text-blue-400' },
          { label: 'With Recent Reading', value: overview.withRecentReading, icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending Approval', value: overview.pendingApproval, icon: AlertTriangle, tone: 'text-amber-600 dark:text-amber-400' },
          { label: 'Latest Sync', value: overview.latestRecordedAt ? formatDateTime(overview.latestRecordedAt) : 'No reading yet', icon: Clock3, tone: 'text-slate-700 dark:text-slate-200' },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center">
                <card.icon className={`w-5 h-5 ${card.tone}`} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className={`mt-1 ${card.label === 'Latest Sync' ? 'text-sm font-semibold' : 'text-2xl font-bold'} ${card.tone}`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-5">
            {reportTypes.map((reportType) => (
              <button
                key={reportType}
                onClick={() => setSelected(reportType)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  selected === reportType
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {reportType}
              </button>
            ))}
          </div>

          <div className="mb-5">
            <h2 className="font-semibold text-slate-800 dark:text-white">{selected}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selected === 'Daily Energy' && 'Electricity consumption for today by hour.'}
              {selected === 'Monthly Water' && 'Three-month water comparison per floor.'}
              {selected === 'Thermal Distribution' && 'Thermal usage share by monitored system.'}
              {selected === 'Peak Usage' && 'Peak utility hours across the last 7 days.'}
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
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" m3" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="oldest" fill="#67e8f9" radius={[4, 4, 0, 0]} name={monthlyWater[0]?.oldest_label || 'Oldest'} />
                <Bar dataKey="previous" fill="#06b6d4" radius={[4, 4, 0, 0]} name={monthlyWater[0]?.previous_label || 'Previous'} />
                <Bar dataKey="current" fill="#1d4ed8" radius={[4, 4, 0, 0]} name={monthlyWater[0]?.current_label || 'Current'} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selected === 'Thermal Distribution' && (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={thermalDistribution} cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3} dataKey="value">
                    {thermalDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 flex-wrap justify-center mt-2">
                {thermalDistribution.map((row) => (
                  <div key={row.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: row.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{row.name}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{row.value}%</span>
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

        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Efficiency Summary</h2>
          <div className="space-y-3">
            {summary.map((row) => (
              <div key={row.metric} className="rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{row.metric}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{row.value}</p>
                </div>
                <p className={`mt-1 text-xs font-medium ${row.up === true ? 'text-rose-500' : row.up === false ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {row.diff}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white">Latest Meter Readings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Clear view of each meter’s latest reading, latest usage delta, and approval state.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Meter', 'Type', 'Page', 'Unit / Floor', 'Current Reading', 'Latest Usage', 'Recorded At', 'Approval'].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {latestMeterReadings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No meter readings available yet.</td>
                </tr>
              ) : latestMeterReadings.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.meter_name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{row.watch_name}</p>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${TYPE_BADGES[row.type] || 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {TYPE_LABELS[row.type] || row.type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.page_name || '-'}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.unit_label} / {row.floor_label}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {row.current_reading === null ? '-' : `${Number(row.current_reading).toLocaleString()} ${row.reading_unit || ''}`}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {row.latest_usage === null ? '-' : Number(row.latest_usage).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateTime(row.recorded_at)}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${APPROVAL_BADGES[row.approval_status] || APPROVAL_BADGES.no_data}`}>
                      {formatApprovalLabel(row.approval_status)}
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
