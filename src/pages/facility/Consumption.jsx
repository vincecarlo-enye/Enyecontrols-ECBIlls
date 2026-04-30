import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { CalendarRange, Droplets, Flame, TrendingUp, Zap } from 'lucide-react'
import ChartExportButton from '@/components/common/ChartExportButton'
import { useFacilityConsumption } from '@/hooks/facilityHooks/useFacilityConsumption'
import { ChartLoadingState, LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

const statusBadge = {
  normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const utilityMeta = {
  electricity: { label: 'Electricity', unit: 'kWh', icon: Zap, color: 'from-amber-400 to-orange-500' },
  water: { label: 'Water', unit: 'm3', icon: Droplets, color: 'from-cyan-400 to-blue-500' },
  thermal: { label: 'Thermal', unit: 'kBTU', icon: Flame, color: 'from-rose-400 to-pink-500' },
}

const utilityKeys = ['electricity', 'water', 'thermal']
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' })

export default function Consumption() {
  const today = useMemo(() => new Date(), [])
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const [selectedUtility, setSelectedUtility] = useState('all')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const { summary, trendData, unitConsumption, anomalies, selectedPeriod, loading, error } = useFacilityConsumption({
    year: selectedYear,
    month: selectedMonth,
  })

  const yearOptions = useMemo(
    () => Array.from({ length: 4 }, (_, index) => currentYear - index),
    [currentYear]
  )

  const monthOptions = useMemo(() => {
    const limit = selectedYear === currentYear ? currentMonth : 12
    return Array.from({ length: limit }, (_, index) => {
      const month = index + 1
      return {
        value: month,
        label: monthFormatter.format(new Date(selectedYear, index, 1)),
      }
    })
  }, [currentMonth, currentYear, selectedYear])

  const focusedUtilities = selectedUtility === 'all' ? utilityKeys : [selectedUtility]

  const filteredTrendData = useMemo(() => (
    trendData.map((row) => ({
      day: row.day,
      electricity: focusedUtilities.includes('electricity') ? row.electricity : undefined,
      water: focusedUtilities.includes('water') ? row.water : undefined,
      thermal: focusedUtilities.includes('thermal') ? row.thermal : undefined,
    }))
  ), [focusedUtilities, trendData])

  const visibleAnomalies = useMemo(() => {
    if (selectedUtility === 'all') return anomalies

    return anomalies.filter((row) => Number(row[selectedUtility] || 0) > 0)
  }, [anomalies, selectedUtility])

  const tableColumns = selectedUtility === 'all' ? utilityKeys : [selectedUtility]
  const isInitialLoading = loading && trendData.length === 0 && unitConsumption.length === 0 && !error
  const isRefreshing = loading && (trendData.length > 0 || unitConsumption.length > 0)

  const handleYearChange = (value) => {
    const nextYear = Number(value)
    const allowedMaxMonth = nextYear === currentYear ? currentMonth : 12
    setSelectedYear(nextYear)
    setSelectedMonth((previous) => Math.min(previous, allowedMaxMonth))
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Utility Consumption</h1>
          <p className="text-sm text-slate-400 mt-0.5">Monitor electricity, water, and thermal usage per unit or floor</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <UpdatingBadge show={isRefreshing} />
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
            <CalendarRange className="w-4 h-4 text-blue-500" />
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(event) => handleYearChange(event.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year} className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 p-1 shadow-sm flex-wrap">
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
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Active Period</p>
        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {selectedPeriod?.label || `${monthFormatter.format(new Date(selectedYear, selectedMonth - 1, 1))} ${selectedYear}`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {utilityKeys.map((key) => {
          const meta = utilityMeta[key]
          const Icon = meta.icon
          const isMuted = selectedUtility !== 'all' && selectedUtility !== key
          return (
            <div key={key} className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-opacity ${isMuted ? 'opacity-50' : ''}`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{meta.label}</p>
                <LoadingValue
                  loading={isInitialLoading}
                  value={`${Number(summary[key] || 0).toLocaleString()} ${meta.unit}`}
                  className="font-bold text-slate-800 dark:text-white text-lg"
                  spinnerClassName="h-4 w-4 text-slate-400"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div data-chart-export-panel="true" className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white">Daily Trend</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedUtility === 'all' ? 'Compare all utilities across the selected month' : `Focused on ${utilityMeta[selectedUtility].label} across the selected month`}
            </p>
          </div>
          <ChartExportButton title="Daily Trend" rows={filteredTrendData} />
        </div>
        {filteredTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
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
        ) : isInitialLoading ? (
          <ChartLoadingState />
        ) : (
          <ChartLoadingState text="No chart data available yet." />
        )}
      </div>

      {visibleAnomalies.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 rounded-2xl p-4">
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
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white">Consumption per Unit</h2>
          <p className="text-xs text-slate-400 mt-1">
            {selectedUtility === 'all' ? 'Period consumption with latest cumulative readings' : `Showing ${utilityMeta[selectedUtility].label} period consumption and current reading`}
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
                    {utilityMeta[utility].label}
                    <span className="block normal-case text-[10px] text-slate-400">Consumption / current reading</span>
                  </th>
                ))}
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isInitialLoading ? (
                <TableLoadingRow colSpan={3 + tableColumns.length} />
              ) : unitConsumption.length === 0 ? (
                <tr>
                  <td colSpan={3 + tableColumns.length} className="px-5 py-10 text-center text-sm text-slate-400">No consumption data available yet.</td>
                </tr>
              ) : unitConsumption.map((row) => (
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
                      <span className="block">{Number(row?.period_consumption?.[utility] ?? row[utility] ?? 0).toLocaleString()} {utilityMeta[utility].unit}</span>
                      <span className="mt-1 block text-[11px] font-normal text-slate-400">
                        {row?.current_readings?.[utility] == null ? 'No reading' : `${Number(row.current_readings[utility]).toLocaleString()} current`}
                      </span>
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
    </div>
  )
}
