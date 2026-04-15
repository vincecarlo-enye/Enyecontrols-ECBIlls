import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { CalendarRange, Download, Droplets, Flame, RefreshCw, Search, TrendingUp, Zap } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import { useFacilityConsumption } from '@/hooks/facilityHooks/useFacilityConsumption'
import PageSection, { PageHeader } from '@/components/layout/PageSection'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'

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

const utilityKeys = ['electricity', 'water', 'thermal']

function csvEscape(value) {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function exportRowsToCsv(rows, selectedUtility) {
  const columns = selectedUtility === 'all' ? utilityKeys : [selectedUtility]
  const headers = [
    'Unit',
    'Floor',
    ...columns.map((utility) => `${utilityMeta[utility].label} (${utilityMeta[utility].unit})`),
    'Status',
  ]

  const lines = rows.map((row) => [
    row.unit,
    row.floor,
    ...columns.map((utility) => Number(row[utility] || 0).toLocaleString()),
    row.status,
  ].map(csvEscape).join(','))

  const blob = new Blob(
    [`\uFEFFsep=,\r\n${headers.map(csvEscape).join(',')}\r\n${lines.join('\r\n')}`],
    { type: 'text/csv;charset=utf-8;' }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `facility-consumption-${selectedUtility}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function Consumption() {
  const pageLoading = usePageLoader(700)
  const { summary, trendData, unitConsumption, anomalies, loading, error, reload } = useFacilityConsumption()
  const [selectedUtility, setSelectedUtility] = useState('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadingState = pageLoading || loading
  const now = useMemo(() => new Date(), [])
  const currentPeriodLabel = useMemo(
    () => now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [now]
  )

  const focusedUtilities = selectedUtility === 'all' ? utilityKeys : [selectedUtility]

  const filteredTrendData = useMemo(() => (
    trendData.map((row) => ({
      day: row.day,
      electricity: focusedUtilities.includes('electricity') ? row.electricity : undefined,
      water: focusedUtilities.includes('water') ? row.water : undefined,
      thermal: focusedUtilities.includes('thermal') ? row.thermal : undefined,
    }))
  ), [focusedUtilities, trendData])

  const filteredUnitConsumption = useMemo(() => {
    const needle = search.trim().toLowerCase()

    return unitConsumption.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      if (!matchesStatus) return false

      if (!needle) return true

      const haystack = [
        row.unit,
        row.floor,
        row.status,
      ].join(' ').toLowerCase()

      return haystack.includes(needle)
    })
  }, [search, statusFilter, unitConsumption])

  const visibleAnomalies = useMemo(() => {
    if (selectedUtility === 'all') return anomalies
    return anomalies.filter((row) => Number(row[selectedUtility] || 0) > 0)
  }, [anomalies, selectedUtility])

  const tableColumns = selectedUtility === 'all' ? utilityKeys : [selectedUtility]

  if (loadingState) return <FacilityPageSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <PageSection>
        <PageHeader
          title="Utility Consumption"
          subtitle="Monitor electricity, water, and thermal usage across units with quick filtering and export tools."
          icon={TrendingUp}
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-300">
                <CalendarRange className="w-4 h-4 text-blue-500" />
                {currentPeriodLabel}
              </div>
              <button
                onClick={reload}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
              <button
                onClick={() => exportRowsToCsv(filteredUnitConsumption, selectedUtility)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          )}
        />
      </PageSection>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <SummaryCardStrip
        stretch
        cards={utilityKeys.map((key) => {
          const meta = utilityMeta[key]
          const Icon = meta.icon
          const isMuted = selectedUtility !== 'all' && selectedUtility !== key
          return {
            title: meta.label,
            value: `${Number(summary[key] || 0).toLocaleString()} ${meta.unit}`,
            sub: isMuted ? 'Hidden from active trend focus' : `Current total for ${currentPeriodLabel}`,
            icon: Icon,
            gradient: meta.color,
            className: `${isMuted ? 'opacity-60' : ''}`,
          }
        })}
      />

      <PageSection>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by unit, floor, or status..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="alert">Alert</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['all', ...utilityKeys].map((utility) => (
            <button
              key={utility}
              onClick={() => setSelectedUtility(utility)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
                selectedUtility === utility
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {utility === 'all' ? 'All Utilities' : utilityMeta[utility].label}
            </button>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-white">Daily Trend</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedUtility === 'all'
              ? 'Compare all utilities across the available trend window.'
              : `Focused on ${utilityMeta[selectedUtility].label} trend only.`}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={filteredTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            {selectedUtility === 'all' && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {focusedUtilities.includes('electricity') && <Line type="monotone" dataKey="electricity" stroke="#f59e0b" strokeWidth={2} dot={false} name="Electricity" />}
            {focusedUtilities.includes('water') && <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} dot={false} name="Water" />}
            {focusedUtilities.includes('thermal') && <Line type="monotone" dataKey="thermal" stroke="#f43f5e" strokeWidth={2} dot={false} name="Thermal" />}
          </LineChart>
        </ResponsiveContainer>
      </PageSection>

      {visibleAnomalies.length > 0 && (
        <PageSection className="border-rose-200/70 dark:border-rose-700/30" variant="plain">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-700/40 dark:bg-rose-900/20">
            <p className="font-semibold text-rose-700 dark:text-rose-300 text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Abnormal Spikes Detected
            </p>
            {visibleAnomalies.map((row) => (
              <p key={row.unit} className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                - {row.unit} ({row.floor}): {selectedUtility === 'all'
                  ? `Water ${Number(row.water || 0).toLocaleString()} m3 above the recent average`
                  : `${utilityMeta[selectedUtility].label} ${Number(row[selectedUtility] || 0).toLocaleString()} ${utilityMeta[selectedUtility].unit} above the recent average`}
              </p>
            ))}
          </div>
        </PageSection>
      )}

      <PageSection padded={false}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50">
            <h2 className="font-semibold text-slate-800 dark:text-white">Consumption per Unit</h2>
            <p className="text-xs text-slate-400 mt-1">
              {selectedUtility === 'all'
                ? 'All utility totals for the currently loaded data set.'
                : `Showing ${utilityMeta[selectedUtility].label} totals for the current utility focus.`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Unit</th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Floor</th>
                  {tableColumns.map((utility) => (
                    <th key={utility} className="text-right px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">
                      {utilityMeta[utility].label} ({utilityMeta[utility].unit})
                    </th>
                  ))}
                  <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUnitConsumption.length === 0 ? (
                  <tr>
                    <td colSpan={3 + tableColumns.length} className="px-5 py-10 text-center text-sm text-slate-400">No consumption data matched your current filters.</td>
                  </tr>
                ) : filteredUnitConsumption.map((row) => (
                  <tr key={row.unit} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{row.unit}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{row.floor}</td>
                    {tableColumns.map((utility) => (
                      <td
                        key={utility}
                        className={`px-5 py-3.5 text-right font-mono ${
                          row.status === 'alert' && utility === selectedUtility
                            ? 'font-bold text-rose-500'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {Number(row[utility] || 0).toLocaleString()}
                      </td>
                    ))}
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
      </PageSection>
    </div>
  )
}
