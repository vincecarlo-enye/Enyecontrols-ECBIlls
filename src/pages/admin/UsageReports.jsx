import { useMemo, useRef, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, Printer } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import ChartExportButton from '@/components/common/ChartExportButton'
import FilterPills from '@/components/common/FilterPills'
import { useAdminUsageReports } from '@/hooks/adminHooks/useAdminUsageReports'
import { downloadCsv } from '@/utils/exportCsv'
import { printElement } from '@/utils/reporting'

const PAGE_NAME = 'Main (Basement)'
const RANGE_OPTIONS = [
  { key: '7D', label: '7D' },
  { key: '1M', label: '1M' },
  { key: '1Y', label: '1Y' },
]
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_BUCKET_LABELS = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter']
const YEAR_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const UTILITY_META = {
  Electricity: { key: 'electricity', color: '#f59e0b', gradient: 'usage-electricity', unit: 'kWh' },
  Water: { key: 'water', color: '#06b6d4', gradient: 'usage-water', unit: 'm3' },
  Thermal: { key: 'thermal', color: '#f43f5e', gradient: 'usage-thermal', unit: 'kBTU' },
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDayLabel(value, index) {
  const raw = String(value || '').trim()
  if (DAY_LABELS.includes(raw)) return raw

  const parsedDate = new Date(raw)
  if (!Number.isNaN(parsedDate.getTime())) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(parsedDate)
  }

  return DAY_LABELS[index] || `Day ${index + 1}`
}

function getMonthIndex(value) {
  const raw = String(value || '').trim()
  if (!raw) return -1

  const shortIndex = YEAR_LABELS.findIndex((label) => label.toLowerCase() === raw.slice(0, 3).toLowerCase())
  if (shortIndex >= 0) return shortIndex

  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [, month] = raw.split('-')
    const index = Number(month) - 1
    return index >= 0 && index < 12 ? index : -1
  }

  const parsedDate = new Date(raw)
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getMonth()
  }

  return -1
}

function buildSevenDayRows(chartData = []) {
  const rows = DAY_LABELS.map((label) => ({
    label,
    electricity: 0,
    water: 0,
    thermal: 0,
    total: 0,
  }))

  chartData.forEach((chart) => {
    const meta = UTILITY_META[chart.title]
    if (!meta) return

    chart.data.slice(-7).forEach((item, index) => {
      const dayLabel = normalizeDayLabel(item?.day, index)
      const row = rows.find((entry) => entry.label === dayLabel)
      if (!row) return
      row[meta.key] += toNumber(item?.usage)
    })
  })

  return rows.map((row) => ({
    ...row,
    total: row.electricity + row.water + row.thermal,
  }))
}

function buildMonthBucketRows(chartData = []) {
  const rows = MONTH_BUCKET_LABELS.map((label) => ({
    label,
    electricity: 0,
    water: 0,
    thermal: 0,
    total: 0,
  }))

  chartData.forEach((chart) => {
    const meta = UTILITY_META[chart.title]
    if (!meta) return

    const series = Array.isArray(chart.data) ? chart.data : []
    const length = series.length || 1

    series.forEach((item, index) => {
      const bucketIndex = Math.min(3, Math.floor((index * 4) / length))
      rows[bucketIndex][meta.key] += toNumber(item?.usage)
    })
  })

  return rows.map((row) => ({
    ...row,
    total: row.electricity + row.water + row.thermal,
  }))
}

function buildYearRows(monthlyOverview = []) {
  const rows = YEAR_LABELS.map((label) => ({
    label,
    electricity: 0,
    water: 0,
    thermal: 0,
    total: 0,
  }))

  monthlyOverview.forEach((item) => {
    const monthIndex = getMonthIndex(item?.month)
    if (monthIndex < 0) return

    rows[monthIndex].electricity += toNumber(item?.electricity)
    rows[monthIndex].water += toNumber(item?.water)
    rows[monthIndex].thermal += toNumber(item?.thermal)
  })

  return rows.map((row) => ({
    ...row,
    total: row.electricity + row.water + row.thermal,
  }))
}

function getRangeRows(range, chartData, monthlyOverview) {
  if (range === '7D') return buildSevenDayRows(chartData)
  if (range === '1M') return buildMonthBucketRows(chartData)
  return buildYearRows(monthlyOverview)
}

function getRangeSubtitle(range) {
  if (range === '7D') return 'Mon-Sun usage view'
  if (range === '1M') return '1st-4th quarter usage view'
  return 'Jan-Dec usage view'
}

function getExportFilename(range) {
  return `usage-report-main-basement-${String(range).toLowerCase()}.csv`
}

export default function UsageReports() {
  const loading = usePageLoader()
  const { addToast } = useApp()
  const printRef = useRef(null)
  const {
    monthlyOverview,
    loading: usageLoading,
    error,
    chartData,
  } = useAdminUsageReports({ preferredPage: PAGE_NAME, skipPagesLoad: true })

  const [range, setRange] = useState('7D')

  const rangeRows = useMemo(
    () => getRangeRows(range, chartData, monthlyOverview),
    [chartData, monthlyOverview, range]
  )

  const chartCards = useMemo(
    () => Object.entries(UTILITY_META).map(([title, meta]) => ({
      title,
      ...meta,
      data: rangeRows.map((row) => ({
        label: row.label,
        value: toNumber(row[meta.key]),
      })),
    })),
    [rangeRows]
  )

  const utilityTotals = useMemo(
    () => chartCards.map((chart) => ({
      utility: chart.title,
      unit: chart.unit,
      total: chart.data.reduce((sum, item) => sum + toNumber(item.value), 0),
    })),
    [chartCards]
  )

  const handleExport = () => {
    const rows = [
      ['Report', 'Usage Reports'],
      ['Omni Page', PAGE_NAME],
      ['Range', range],
      ['Range View', getRangeSubtitle(range)],
      [],
      ['Utility Usage Charts'],
      ['Period', 'Electricity (kWh)', 'Water (m3)', 'Thermal (kBTU)'],
      ...rangeRows.map((row) => [
        row.label,
        row.electricity,
        row.water,
        row.thermal,
      ]),
      [],
      ['Utility Totals'],
      ['Utility', 'Unit', 'Total'],
      ...utilityTotals.map((item) => [item.utility, item.unit, item.total]),
      [],
      ['Usage Breakdown Chart'],
      ['Period', 'Electricity', 'Water', 'Thermal', 'Total'],
      ...rangeRows.map((row) => [
        row.label,
        row.electricity,
        row.water,
        row.thermal,
        row.total,
      ]),
      [],
      ['Total Usage Trend Chart'],
      ['Period', 'Total Usage'],
      ...rangeRows.map((row) => [
        row.label,
        row.total,
      ]),
    ]

    downloadCsv(getExportFilename(range), rows)
    addToast(`Usage report exported for ${range}`)
  }

  const handlePrint = () => {
    printElement({
      title: 'Usage Reports',
      subtitle: `${PAGE_NAME} • ${getRangeSubtitle(range)}`,
      element: printRef.current,
      mode: 'full',
    })
  }

  if (loading || usageLoading) return <ReportsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Usage Reports</h2>
          <p className="mt-0.5 text-sm text-slate-400">Detailed utility consumption analytics for Omni page: {PAGE_NAME}</p>
        </div>

        <div className="flex items-center gap-2">
          <FilterPills options={RANGE_OPTIONS} value={range} onChange={setRange} />
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/20 dark:text-cyan-300">
          This report is page-scoped and currently reflects Omni page <span className="font-semibold">{PAGE_NAME}</span>, not the whole building aggregate.
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {chartCards.map((chart) => (
            <div key={chart.title} data-chart-export-panel="true" className="glass rounded-2xl p-5 shadow-lg">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="mb-1 font-display text-[14px] font-700 text-slate-800 dark:text-white">{chart.title} Usage</h3>
                  <p className="text-xs text-slate-400">{getRangeSubtitle(range)}</p>
                </div>
                <ChartExportButton title={`${chart.title} Usage`} rows={chart.data} />
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={chart.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id={chart.gradient} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '10px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '11px' }}
                    formatter={(value) => [`${Number(value).toLocaleString()} ${chart.unit}`, chart.title]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chart.color}
                    strokeWidth={2}
                    fill={`url(#${chart.gradient})`}
                    dot={{ fill: chart.color, r: 3, stroke: '#fff', strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        <div data-chart-export-panel="true" className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Usage Breakdown</h3>
              <p className="text-xs text-slate-400">Utility usage totals across the selected range</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">{getRangeSubtitle(range)}</span>
              <ChartExportButton title="Usage Breakdown" rows={rangeRows} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rangeRows} barSize={14} barGap={3} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px' }}
                formatter={(value) => [`${Number(value).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="electricity" name="Electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="water" name="Water" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="thermal" name="Thermal" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div data-chart-export-panel="true" className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="mb-1 font-display text-[15px] font-700 text-slate-800 dark:text-white">Total Usage Trend</h3>
              <p className="text-xs text-slate-400">Combined utility usage for the selected range</p>
            </div>
            <ChartExportButton title="Total Usage Trend" rows={rangeRows} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rangeRows} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px' }}
                formatter={(value) => [`${Number(value).toLocaleString()}`, 'Total']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 5, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
