import { formatDate, formatNumber} from '@/utils/filterUtils'
import { useMemo, useRef, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar,
} from 'recharts'
import { CalendarRange, Download, Printer, RefreshCw, Search, Users, Home, ArrowRightLeft } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import ChartExportButton from '@/components/common/ChartExportButton'
import { useAdminOccupancyTimeline } from '@/hooks/adminHooks/useAdminOccupancyTimeline'
import { useApp } from '@/context/AppContext'
import { printElement } from '@/utils/reporting'
import { downloadCsv } from '@/utils/exportCsv'



function exportCsv({ period, summaryCards, monthlyActivity, occupiedUnits, vacantUnits, timeline }) {
  const summaryRows = summaryCards.map((card) => [
    card.label,
    Number(card.value || 0),
    card.sub || '',
  ])

  const activityRows = (monthlyActivity || []).map((item) => [
    item?.month || '',
    Number(item?.move_ins || 0),
    Number(item?.move_outs || 0),
    Number(item?.active_occupancies || 0),
    Number(item?.active_tenant_users || 0),
  ])

  const unitSnapshotRows = [
    ...occupiedUnits.map((item) => [
      item?.unit_label || '',
      item?.floor_label || '',
      item?.building_name || '',
      'occupied',
      item?.tenant_name || '',
      item?.move_in_date || '',
      item?.move_out_date || '',
    ]),
    ...vacantUnits.map((item) => [
      item?.unit_label || '',
      item?.floor_label || '',
      item?.building_name || '',
      'vacant',
      item?.tenant_name || '',
      item?.move_in_date || '',
      item?.move_out_date || '',
    ]),
  ]

  const timelineRows = (timeline || []).map((item) => [
    item?.tenant_name || '',
    item?.email || '',
    item?.unit_label || '',
    item?.floor_label || '',
    item?.building_name || '',
    item?.event_type || '',
    item?.event_date || '',
    item?.move_in_date || '',
    item?.move_out_date || '',
    item?.occupied_days_in_period ?? 0,
    item?.status || '',
  ])

  const rows = [
    ['Report', 'Occupancy Timeline'],
    ['Period', period?.label || period?.month || ''],
    [],
    ['Summary Cards'],
    ['Metric', 'Value', 'Description'],
    ...summaryRows,
    [],
    ['6-Month Occupancy Activity'],
    ['Month', 'Move-Ins', 'Move-Outs', 'Active Occupancies', 'Active Tenants'],
    ...activityRows,
    [],
    ['Unit Snapshot'],
    ['Unit', 'Floor', 'Building', 'Occupancy Status', 'Tenant', 'Move In', 'Move Out'],
    ...unitSnapshotRows,
    [],
    ['Occupancy Timeline Log'],
    ['Tenant', 'Email', 'Unit', 'Floor', 'Building', 'Event Type', 'Event Date', 'Move In', 'Move Out', 'Occupied Days', 'Status'],
    ...timelineRows,
  ]

  downloadCsv(`occupancy-timeline-${period?.month || 'report'}.csv`, rows)
}

function SummaryCard({ label, value, sub, tone }) {
  const toneMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    violet: 'text-violet-600 dark:text-violet-400',
  }

  return (
    <div className="glass rounded-2xl p-5 shadow-lg">
      <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-2 font-display text-3xl font-700 ${toneMap[tone] || toneMap.blue}`}>{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  )
}

export default function OccupancyTimeline() {
  const loadingScreen = usePageLoader(500)
  const { addToast } = useApp()
  const printRef = useRef(null)
  const {
    selectedMonth,
    setSelectedMonth,
    data,
    loading,
    error,
    summaryCards,
    reload,
  } = useAdminOccupancyTimeline()
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('all')

  const trendData = useMemo(() => (
    (data.monthlyActivity || []).map((item) => ({
      month: item.month,
      'Move-Ins': Number(item.move_ins || 0),
      'Move-Outs': Number(item.move_outs || 0),
      'Active Occupancies': Number(item.active_occupancies || 0),
      'Active Tenants': Number(item.active_tenant_users || 0),
    }))
  ), [data.monthlyActivity])

  const filteredTimeline = useMemo(() => {
    const query = search.trim().toLowerCase()

    return (data.timeline || []).filter((item) => {
      if (eventFilter !== 'all' && item.event_type !== eventFilter) return false
      if (!query) return true

      return [
        item.tenant_name,
        item.email,
        item.unit_label,
        item.floor_label,
        item.building_name,
        item.status,
        item.event_type,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [data.timeline, eventFilter, search])

  const occupiedUnits = useMemo(
    () => (data.unitSnapshot || []).filter((item) => item.occupancy_status === 'occupied'),
    [data.unitSnapshot]
  )

  const vacantUnits = useMemo(
    () => (data.unitSnapshot || []).filter((item) => item.occupancy_status !== 'occupied'),
    [data.unitSnapshot]
  )

  if (loadingScreen || loading) return <ReportsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Occupancy Timeline</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Audit move-ins, move-outs, and active occupancy snapshots by billing month.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <CalendarRange className="h-4 w-4" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="bg-transparent outline-none"
            />
          </label>

          <button
            onClick={() => reload(selectedMonth)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/60"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={() => {
              exportCsv({
                period: data.period,
                summaryCards,
                monthlyActivity: data.monthlyActivity,
                occupiedUnits,
                vacantUnits,
                timeline: filteredTimeline,
              })
              addToast('Occupancy timeline exported to CSV')
            }}
            aria-label="Export occupancy timeline as CSV"
            title="Export occupancy timeline as CSV"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              printElement({
                title: 'Occupancy Timeline',
                subtitle: data.period?.label || selectedMonth,
                element: printRef.current,
                mode: 'visual',
              })
            }}
            aria-label="Print occupancy timeline"
            title="Print occupancy timeline"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/60"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div ref={printRef} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5 print-occupancy-summary">
          {summaryCards.map(({ key, ...card }) => (
            <SummaryCard key={key} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div data-chart-export-panel="true" className="glass rounded-2xl p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">6-Month Occupancy Activity</h3>
                <p className="text-xs text-slate-400">Track move-ins, move-outs, and active occupancy growth over time.</p>
              </div>
              <ChartExportButton title="6-Month Occupancy Activity" rows={trendData} />
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="occupancyActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Area type="monotone" dataKey="Active Occupancies" stroke="#2563eb" fill="url(#occupancyActive)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Active Tenants" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div data-chart-export-panel="true" className="glass rounded-2xl p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Move Event Mix</h3>
                <p className="text-xs text-slate-400">Monthly inflow and outflow counts for the selected six-month window.</p>
              </div>
              <ChartExportButton title="Move Event Mix" rows={trendData} />
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="Move-Ins" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Move-Outs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1.4fr]">
          <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Unit Snapshot</h3>
              <p className="text-xs text-slate-400">Occupancy state as of {data.period?.label || selectedMonth} month end.</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>{occupiedUnits.length} occupied</p>
              <p>{vacantUnits.length} vacant</p>
            </div>
          </div>

          <div className="space-y-3">
            {occupiedUnits.slice(0, 8).map((item) => (
              <div key={item.unit_id} className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{item.unit_label}</p>
                    <p className="text-xs text-slate-400">{item.floor_label || 'No floor'} | {item.building_name || 'No building'}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                    Occupied
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  <p>{item.tenant_name || 'Unknown tenant'}</p>
                  <p className="text-xs text-slate-400">Move in: {formatDate(item.move_in_date)}</p>
                </div>
              </div>
            ))}

            {occupiedUnits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
                No occupied units found for the selected month.
              </div>
            ) : null}

            {vacantUnits.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-700/70 dark:bg-slate-800/30">
                <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Vacant Units</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {vacantUnits.slice(0, 6).map((item) => item.unit_label).join(', ')}
                  {vacantUnits.length > 6 ? ` +${vacantUnits.length - 6} more` : ''}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Occupancy Timeline Log</h3>
              <p className="text-xs text-slate-400">Search move events and active occupancy windows for the selected month.</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tenant, unit, or building..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                />
              </label>

              <select
                value={eventFilter}
                onChange={(event) => setEventFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
              >
                <option value="all">All Events</option>
                <option value="move_in">Move-Ins</option>
                <option value="move_out">Move-Outs</option>
                <option value="active">Active During Month</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Tenant</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Unit</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Event</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Event Date</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Move Window</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Days</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimeline.map((item) => (
                  <tr key={`${item.tenant_id}-${item.unit_id}-${item.event_type}-${item.event_date || item.move_in_date || 'row'}`} className="border-b border-slate-100 dark:border-slate-800/80">
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{item.tenant_name || 'Unknown tenant'}</p>
                          <p className="text-xs text-slate-400">{item.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2">
                        <Home className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-200">{item.unit_label || 'No unit'}</p>
                          <p className="text-xs text-slate-400">{item.floor_label || 'No floor'} | {item.building_name || 'No building'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        item.event_type === 'move_in'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                          : item.event_type === 'move_out'
                            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
                            : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        <ArrowRightLeft className="h-3 w-3" />
                        {String(item.event_type || 'active').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDate(item.event_date)}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(item.move_in_date)} - {formatDate(item.move_out_date)}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">{formatNumber(item.occupied_days_in_period)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
              No occupancy records matched the selected month and filters.
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
