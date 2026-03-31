import { useEffect, useMemo, useState } from 'react'
import { Zap, Droplets, Flame, Wifi } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { usePageLoader } from '@/hooks/usePageLoader'
import { FacilityPageSkeleton } from '@/components/skeletons'
import { useTenantUsageMonitoring } from '@/hooks/tenantHooks/useTenantUsageMonitoring'
import { useUnitFilter } from '@/context/UnitFilterContext'
import UnitFilterBar from '@/components/common/UnitFilterBar'

const ttStyle = {
  contentStyle: {
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: '10px',
    fontSize: '12px',
  },
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function formatReading(value) {
  return toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function buildHourlyFallback(summary = {}) {
  const electric = toNumber(summary?.electric?.consumption)
  const water = toNumber(summary?.water?.consumption)
  const thermal = toNumber(summary?.thermal?.consumption)

  return Array.from({ length: 24 }, (_, h) => ({
    time: `${String(h).padStart(2, '0')}:00`,
    electric: Number((electric / 24).toFixed(2)),
    water: Number((water / 24).toFixed(2)),
    thermal: Number((thermal / 24).toFixed(2)),
  }))
}

export default function Usage() {
  const pageLoading = usePageLoader(700)
  const [tab, setTab] = useState('hourly')
  const { selectedUnit } = useUnitFilter()

  const {
    unit,
    units,
    summary,
    hourly,
    daily,
    monthly,
    loading,
    error,
    refreshUsage,
  } = useTenantUsageMonitoring()

  const tenantUnits = Array.isArray(units) ? units : []

  useEffect(() => {
    refreshUsage(selectedUnit)
  }, [refreshUsage, selectedUnit])

  const isLoading = pageLoading || loading

  const safeHourly = useMemo(() => {
    return Array.isArray(hourly) && hourly.length > 0
      ? hourly
      : buildHourlyFallback(summary)
  }, [hourly, summary])

  const safeDaily = useMemo(() => {
    return Array.isArray(daily) ? daily : []
  }, [daily])

  const safeMonthly = useMemo(() => {
    return Array.isArray(monthly) ? monthly : []
  }, [monthly])

  if (isLoading) return <FacilityPageSkeleton />

  const unitLabel = selectedUnit === 'all'
    ? tenantUnits.length > 1
      ? 'All Assigned Units'
      : unit?.unit_number
        ? `Unit ${unit.unit_number}`
        : 'Assigned Unit'
    : `Unit ${selectedUnit}`

  const summaryCards = [
    {
      label: 'Electric Consumption',
      value: `${formatReading(summary?.electric?.consumption)} ${summary?.electric?.unit || 'kWh'}`,
      previous: `Prev: ${formatReading(summary?.electric?.previous)}`,
      current: `Curr: ${formatReading(summary?.electric?.current)}`,
      icon: Zap,
      grad: 'from-amber-500 to-amber-600',
      glow: 'shadow-amber-500/20',
    },
    {
      label: 'Water Consumption',
      value: `${formatReading(summary?.water?.consumption)} ${summary?.water?.unit || 'm³'}`,
      previous: `Prev: ${formatReading(summary?.water?.previous)}`,
      current: `Curr: ${formatReading(summary?.water?.current)}`,
      icon: Droplets,
      grad: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/20',
    },
    {
      label: 'Thermal Consumption',
      value: `${formatReading(summary?.thermal?.consumption)} ${summary?.thermal?.unit || 'kBTU'}`,
      previous: `Prev: ${formatReading(summary?.thermal?.previous)}`,
      current: `Curr: ${formatReading(summary?.thermal?.current)}`,
      icon: Flame,
      grad: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/20',
    },
  ]

  return (
    <div className="space-y-5 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            Usage Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Utility consumption and meter readings for {unitLabel.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Live data
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <UnitFilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((s, i) => {
          const Icon = s.icon

          return (
            <div
              key={s.label}
              className={`glass rounded-2xl p-4 shadow-lg ${s.glow} card-hover stagger-${i + 1} animate-in`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {s.previous} · {s.current}
                  </p>
                </div>

                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg flex-shrink-0`}
                >
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {['hourly', 'daily', 'monthly'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              tab === t
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'hourly' && (
        <>
          <div className="glass rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-1">
              Hourly Consumption
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Hour-by-hour utility monitoring for {unitLabel.toLowerCase()}
            </p>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={safeHourly} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...ttStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="electric" stroke="#f59e0b" strokeWidth={2} dot={false} name="Electric (kWh)" />
                <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} dot={false} name="Water (m³)" />
                <Line type="monotone" dataKey="thermal" stroke="#f43f5e" strokeWidth={2} dot={false} name="Thermal (kBTU)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">
                Hourly Data Table
              </h2>
            </div>

            <div className="overflow-auto max-h-72">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/60">
                    {['Time', 'Electric (kWh)', 'Water (m³)', 'Thermal (kBTU)'].map((col) => (
                      <th
                        key={col}
                        className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {safeHourly.map((row, i) => (
                    <tr
                      key={`${row.time}-${i}`}
                      className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {row.time}
                      </td>
                      <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-mono text-xs">
                        {formatReading(row.electric)}
                      </td>
                      <td className="px-4 py-2.5 text-cyan-600 dark:text-cyan-400 font-mono text-xs">
                        {formatReading(row.water)}
                      </td>
                      <td className="px-4 py-2.5 text-rose-600 dark:text-rose-400 font-mono text-xs">
                        {formatReading(row.thermal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'daily' && (
        <div className="glass rounded-2xl p-5 shadow-lg">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-1">
            Daily Totals
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Utility consumption per day for {unitLabel.toLowerCase()}
          </p>

          {safeDaily.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={safeDaily} barSize={16} barGap={3} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...ttStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="electric" name="Electric (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="water" name="Water (m³)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="thermal" name="Thermal (kBTU)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              No daily usage data available yet.
            </div>
          )}
        </div>
      )}

      {tab === 'monthly' && (
        <div className="glass rounded-2xl p-5 shadow-lg">
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white mb-1">
            Monthly Totals
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Utility consumption trend over recent months for {unitLabel.toLowerCase()}
          </p>

          {safeMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={safeMonthly} barSize={16} barGap={3} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...ttStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="electric" name="Electric (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="water" name="Water (m³)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="thermal" name="Thermal (kBTU)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              No monthly usage data available yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
