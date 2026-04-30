import { formatDateTime } from '@/utils/filterUtils'
﻿import { useMemo, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import { Download, Gauge, Clock3, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useFacilityReports } from '@/hooks/facilityHooks/useFacilityReports'
import PageActionBar from '@/components/common/PageActionBar'
import ChartExportButton from '@/components/common/ChartExportButton'
import { downloadCsv } from '@/utils/exportCsv'
import { printElement } from '@/utils/reporting'
import { ChartLoadingState, LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

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


function formatApprovalLabel(value) {
  if (!value) return 'No data'
  return String(value).replace(/_/g, ' ')
}

export default function Reports() {
  const printRef = useRef(null)
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
  const [readingSearch, setReadingSearch] = useState('')
  const [readingType, setReadingType] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')

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

  const filteredMeterReadings = useMemo(() => {
    const query = readingSearch.trim().toLowerCase()

    return latestMeterReadings.filter((row) => {
      const matchesType = readingType === 'all' || row.type === readingType
      const matchesApproval = approvalFilter === 'all' || (row.approval_status || 'no_data') === approvalFilter
      const haystack = [
        row.meter_name,
        row.watch_name,
        row.page_name,
        row.unit_label,
        row.floor_label,
        TYPE_LABELS[row.type] || row.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesSearch = !query || haystack.includes(query)

      return matchesType && matchesApproval && matchesSearch
    })
  }, [latestMeterReadings, readingSearch, readingType, approvalFilter])

  const isInitialLoading = loading && latestMeterReadings.length === 0 && currentData.length === 0 && !error
  const isRefreshing = loading && (latestMeterReadings.length > 0 || currentData.length > 0)
  const handleExport = () => {
    const rows = [
      ['Facility Operational Reports'],
      ['Selected Report', selected],
      [],
      ['Overview'],
      ['Metric', 'Value'],
      ['Total Meters', overview.totalMeters],
      ['With Recent Reading', overview.withRecentReading],
      ['Pending Approval', overview.pendingApproval],
      ['Latest Sync', overview.latestRecordedAt ? formatDateTime(overview.latestRecordedAt) : 'No reading yet'],
      [],
      [selected],
      currentData.length > 0 && typeof currentData[0] === 'object'
        ? Object.keys(currentData[0])
        : ['Value'],
      ...currentData.map((row) =>
        typeof row === 'object'
          ? Object.keys(currentData[0]).map((key) => row?.[key] ?? '')
          : [row]
      ),
      [],
      ['Efficiency Summary'],
      ['Metric', 'Value', 'Difference'],
      ...summary.map((row) => [row.metric, row.value, row.diff]),
      [],
      ['Latest Meter Readings'],
      ['Meter', 'Type', 'Page', 'Unit', 'Floor', 'Current Reading', 'Reading Unit', 'Latest Usage', 'Recorded At', 'Approval'],
      ...filteredMeterReadings.map((row) => [
        row.meter_name,
        TYPE_LABELS[row.type] || row.type || 'Unknown',
        row.page_name || '-',
        row.unit_label || '-',
        row.floor_label || '-',
        row.current_reading ?? '-',
        row.reading_unit || '',
        row.latest_usage ?? '-',
        formatDateTime(row.recorded_at),
        formatApprovalLabel(row.approval_status),
      ]),
    ]

    downloadCsv(`facility-report-${selected.toLowerCase().replace(/\s+/g, '-')}.csv`, rows)
  }

  const handlePrint = () => {
    printElement({
      title: 'Facility Operational Reports',
      subtitle: `${selected} report and latest meter readings`,
      element: printRef.current,
      mode: 'visual',
    })
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Operational Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cleaner facility reports with live meter reading visibility and trend analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <UpdatingBadge show={isRefreshing} />
          <PageActionBar onExport={handleExport} onPrint={handlePrint} exportLabel="Export Visible Data" />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div ref={printRef} className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-facility-overview">
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
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`mt-1 ${card.label === 'Latest Sync' ? 'text-sm font-semibold' : 'text-2xl font-bold'} ${card.tone}`} spinnerClassName="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr] print-facility-report-main">
        <div data-chart-export-panel="true" className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm print-facility-chart-card">
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

          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">{selected}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selected === 'Daily Energy' && 'Electricity consumption for today by hour.'}
                {selected === 'Monthly Water' && 'Three-month water comparison per floor.'}
                {selected === 'Thermal Distribution' && 'Thermal usage share by monitored system.'}
                {selected === 'Peak Usage' && 'Peak utility hours across the last 7 days.'}
              </p>
            </div>
            <ChartExportButton
              title={selected}
              getRows={() => (
                selected === 'Daily Energy'
                  ? dailyEnergy
                  : selected === 'Monthly Water'
                    ? monthlyWater
                    : selected === 'Thermal Distribution'
                      ? thermalDistribution
                      : peakUsage
              )}
            />
          </div>

          {selected === 'Daily Energy' && (
            <div className="print-facility-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyEnergy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" kWh" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="usage" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Electricity (kWh)" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}

          {selected === 'Monthly Water' && (
            <div className="print-facility-chart-wrap">
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
            </div>
          )}

          {selected === 'Thermal Distribution' && (
            <div className="flex flex-col items-center print-facility-chart-wrap">
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
            <div className="print-facility-chart-wrap">
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
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm print-facility-summary-card">
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
          <p className="text-xs text-slate-400 mt-0.5">Clear view of each meter's latest reading, latest usage delta, and approval state.</p>
        </div>
        <div className="grid gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/50 md:grid-cols-[minmax(0,1.2fr),180px,180px]">
          <input
            type="search"
            value={readingSearch}
            onChange={(event) => setReadingSearch(event.target.value)}
            placeholder="Search meter, watch, unit, floor, or page"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <select
            value={readingType}
            onChange={(event) => setReadingType(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Utility Types</option>
            <option value="electricity">Electricity</option>
            <option value="water">Water</option>
            <option value="thermal">Thermal</option>
          </select>
          <select
            value={approvalFilter}
            onChange={(event) => setApprovalFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Approval States</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="rejected">Rejected</option>
            <option value="no_data">No Data</option>
          </select>
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
              {isInitialLoading ? (
                <TableLoadingRow colSpan={8} />
              ) : filteredMeterReadings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No meter readings matched the current filters.</td>
                </tr>
              ) : filteredMeterReadings.map((row) => (
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
    </div>
  )
}
