import { useEffect, useRef } from 'react'
import { Zap, Droplets, Flame, Loader2 } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useTenantConsumptionReports } from '@/hooks/tenantHooks/useTenantConsumptionReports'
import {
  TENANT_TIME_RANGE_OPTIONS,
  useUnitFilter,
} from '@/context/UnitFilterContext'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import PageActionBar from '@/components/common/PageActionBar'
import ChartExportButton from '@/components/common/ChartExportButton'
import { exportTableCsv, printElement } from '@/utils/reporting'

const ttStyle = {
  contentStyle: {
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: '10px',
    fontSize: '12px',
  },
}

function ChartCard({ title, subtitle, icon: Icon, gradient, glow, exportRows = [], updating = false, children }) {
  return (
    <div data-chart-export-panel="true" className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {updating ? <InlineSpinner label="Updating" /> : null}
          <ChartExportButton title={title} rows={exportRows} />
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function EmptyChartState({ text = 'No report data available yet.' }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
      {text}
    </div>
  )
}

function InlineSpinner({ label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </span>
  )
}

function UpdatingBadge({ show }) {
  if (!show) return null

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-300">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Updating...
    </div>
  )
}

function formatValue(value, unit) {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${unit}`
}

export default function TenantConsumptionReports() {
  const printRef = useRef(null)
  const { selectedUnit, selectedTimeRange } = useUnitFilter()
  const { unit, units, summary, monthly, loading, error, reload, backendDriven } = useTenantConsumptionReports()

  useEffect(() => {
    reload(selectedUnit, selectedTimeRange)
  }, [reload, selectedTimeRange, selectedUnit])

  const unitLabel = selectedUnit === 'all'
    ? (Array.isArray(units) && units.length > 1
      ? 'All Assigned Units'
      : unit?.unit_number
        ? `Unit ${unit.unit_number}`
        : 'Assigned Unit')
    : `Unit ${selectedUnit}`
  const hasData = Array.isArray(monthly) && monthly.length > 0
  const selectedRangeLabel =
    TENANT_TIME_RANGE_OPTIONS.find((option) => option.value === selectedTimeRange)?.label || '1M'
  const isLoading = loading && monthly.length === 0
  const isRefreshing = loading && monthly.length > 0

  const summaryCards = [
    {
      label: `${selectedRangeLabel} Electricity`,
      value: formatValue(summary?.electricity, 'kWh'),
      icon: Zap,
      grad: 'from-amber-500 to-amber-600',
      glow: 'shadow-amber-500/20',
    },
    {
      label: `${selectedRangeLabel} Water`,
      value: formatValue(summary?.water, 'm3'),
      icon: Droplets,
      grad: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/20',
    },
    {
      label: `${selectedRangeLabel} Thermal`,
      value: formatValue(summary?.thermal, 'kBTU'),
      icon: Flame,
      grad: 'from-rose-500 to-rose-600',
      glow: 'shadow-rose-500/20',
    },
  ]

  const handleExport = () => {
    exportTableCsv('tenant-consumption-report.csv', monthly.map((row) => ({
      month: row.month,
      electricity: row.electricity,
      water: row.water,
      thermal: row.thermal,
    })))
  }

  const handlePrint = () => {
    printElement({
      title: 'Consumption Reports',
      subtitle: `${unitLabel} · ${selectedRangeLabel}`,
      element: printRef.current,
    })
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
  {/* Left: Title */}
  <div>
    <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">
      Consumption Reports
    </h1>
    <p className="text-sm text-slate-400 mt-0.5">
      Monthly utility consumption trends · {unitLabel}
    </p>
  </div>

  <div className="flex items-center gap-2">
    <UpdatingBadge show={isRefreshing} />
    <PageActionBar
      onExport={handleExport}
      onPrint={handlePrint}
      exportLabel="Export"
      printLabel="Print"
      mobileIconOnly
    />
  </div>
</div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {!error && !backendDriven ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
          Consumption reports are currently using billing-derived fallback data because the backend report payload is unavailable for this selection.
        </div>
      ) : null}

      <div ref={printRef} className="space-y-5">
        <UnitFilterBar showTimeRange />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
                      {isLoading ? (
                        <InlineSpinner />
                      ) : isRefreshing ? (
                        <span className="inline-flex items-center gap-2">
                          <span>{s.value}</span>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        </span>
                      ) : (
                        s.value
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {selectedRangeLabel} · {unitLabel}
                    </p>
                  </div>

                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard
            title="Electricity Usage"
            subtitle={`Monthly consumption (kWh) · ${unitLabel}`}
            icon={Zap}
            gradient="from-amber-500 to-amber-600"
            glow="shadow-amber-500/30"
            exportRows={monthly}
            updating={isRefreshing}
          >
            {hasData ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip {...ttStyle} formatter={(v) => [`${Number(v).toLocaleString()} kWh`, 'Electricity']} />
                  <Area
                    type="monotone"
                    dataKey="electricity"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#elecGrad)"
                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : isLoading ? (
              <EmptyChartState text="Loading chart data..." />
            ) : (
              <EmptyChartState />
            )}
          </ChartCard>

          <ChartCard
            title="Water Usage"
            subtitle={`Monthly consumption (m3) · ${unitLabel}`}
            icon={Droplets}
            gradient="from-cyan-500 to-cyan-600"
            glow="shadow-cyan-500/30"
            exportRows={monthly}
            updating={isRefreshing}
          >
            {hasData ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip {...ttStyle} formatter={(v) => [`${Number(v).toLocaleString()} m3`, 'Water']} />
                  <Area
                    type="monotone"
                    dataKey="water"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fill="url(#waterGrad)"
                    dot={{ fill: '#06b6d4', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : isLoading ? (
              <EmptyChartState text="Loading chart data..." />
            ) : (
              <EmptyChartState />
            )}
          </ChartCard>

          <ChartCard
            title="Thermal Energy Usage"
            subtitle={`Monthly consumption (kBTU) · ${unitLabel}`}
            icon={Flame}
            gradient="from-rose-500 to-rose-600"
            glow="shadow-rose-500/30"
            exportRows={monthly}
            updating={isRefreshing}
          >
            {hasData ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} barSize={20} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip {...ttStyle} formatter={(v) => [`${Number(v).toLocaleString()} kBTU`, 'Thermal']} />
                  <Bar dataKey="thermal" name="Thermal Energy" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : isLoading ? (
              <EmptyChartState text="Loading chart data..." />
            ) : (
              <EmptyChartState />
            )}
          </ChartCard>

          <div data-chart-export-panel="true" className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
              <div>
              <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">
                Combined Overview
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All utilities side by side · {unitLabel}
              </p>
              </div>
              <ChartExportButton title="Combined Overview" rows={monthly} />
            </div>

            <div className="p-5">
              {hasData ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthly} barSize={14} barGap={3} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip {...ttStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="electricity" name="Electricity (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="water" name="Water (m3)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="thermal" name="Thermal (kBTU)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : isLoading ? (
                <EmptyChartState text="Loading chart data..." />
              ) : (
                <EmptyChartState text="No monthly consumption history available yet." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
