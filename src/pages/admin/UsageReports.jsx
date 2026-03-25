import { useState } from 'react'
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
} from 'recharts'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import { Download, Filter, CheckCircle2, RefreshCcw } from 'lucide-react'
import { useAdminUsageReports } from '@/hooks/adminHooks/useAdminUsageReports'

export default function UsageReports() {
  const pageLoading = usePageLoader(700)
  const {
    pages,
    selectedPage,
    setSelectedPage,
    pageData,
    loading,
    pageLoading: detailLoading,
    syncing,
    error,
    summaryCards,
    chartData,
    syncPage,
  } = useAdminUsageReports()

  const [activeCharts, setActiveCharts] = useState(['Electricity', 'Water', 'Thermal'])
  const [showFilter, setShowFilter] = useState(false)

  const toggleChart = (title) => {
    setActiveCharts((prev) =>
      prev.includes(title) ? prev.filter((c) => c !== title) : [...prev, title]
    )
  }

  const handleExportCurrent = () => {
    const rows = [
      ['Omni Usage Report'],
      ['Page', selectedPage || '—'],
      ['Generated', new Date().toLocaleString('en-PH')],
      [],
      ['Watch Name', 'Unit', 'Value'],
      ...pageData.map((item) => [
        item?.WatchName || '',
        item?.Unit || '',
        item?.Value ?? '',
      ]),
    ]

    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-report-${String(selectedPage || 'page').replace(/\s+/g, '-').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSync = async () => {
    if (!selectedPage) return
    try {
      await syncPage(selectedPage)
    } catch (err) {
      console.error(err)
    }
  }

  if (pageLoading || loading) return <ReportsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            Usage Reports
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Omni watch usage overview by selected page
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">— Select page —</option>
            {pages.map((page, index) => {
              const name =
                page?.PageName || page?.page_name || page?.name || `Page ${index + 1}`
              return (
                <option key={name} value={name}>
                  {name}
                </option>
              )
            })}
          </select>

          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                showFilter
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/50 p-3 z-10">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 px-1">
                  Show Charts
                </p>
                {['Electricity', 'Water', 'Thermal'].map((label) => (
                  <button
                    key={label}
                    onClick={() => toggleChart(label)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      activeCharts.includes(label)
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 opacity-50'
                    } hover:bg-slate-100 dark:hover:bg-slate-700/60`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 transition-colors ${
                        activeCharts.includes(label) ? 'text-blue-500' : 'text-slate-300'
                      }`}
                    />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSync}
            disabled={!selectedPage || syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
          >
            <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Page'}</span>
          </button>

          <button
            onClick={handleExportCurrent}
            disabled={!selectedPage}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.key} className="glass rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">
              {card.total.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {card.count} watch{card.count !== 1 ? 'es' : ''} · {card.unit}
            </p>
          </div>
        ))}
      </div>

      {activeCharts.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-4 ${
            activeCharts.length === 3
              ? 'lg:grid-cols-3'
              : activeCharts.length === 2
                ? 'lg:grid-cols-2'
                : 'lg:grid-cols-1 max-w-lg'
          }`}
        >
          {chartData
            .filter((c) => activeCharts.includes(c.title))
            .map((chart) => (
              <div key={chart.title} className="glass rounded-2xl p-5 shadow-lg">
                <h3 className="font-display font-700 text-[14px] text-slate-800 dark:text-white mb-1">
                  {chart.title} Usage
                </h3>
                <p className="text-xs text-slate-400 mb-4">Current selected page</p>

                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chart.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${chart.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chart.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis
                      dataKey="name"
                      hide
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '10px',
                        border: '1px solid rgba(226,232,240,0.8)',
                        fontSize: '11px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={chart.color}
                      strokeWidth={2}
                      fill={`url(#grad-${chart.title})`}
                      dot={{ fill: chart.color, r: 3, stroke: '#fff', strokeWidth: 1.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ))}
        </div>
      )}

      <div className="glass rounded-2xl p-5 shadow-lg">
        <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white mb-1">
          Current Page Watches
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {selectedPage || 'No page selected'}
        </p>

        {detailLoading ? (
          <p className="text-sm text-slate-400">Loading usage data...</p>
        ) : pageData.length === 0 ? (
          <p className="text-sm text-slate-400">No watch data found for this page.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm" style={{ minWidth: '560px' }}>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  {['Watch Name', 'Unit', 'Value', 'Type'].map((col) => (
                    <th
                      key={col}
                      className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((item, index) => {
                  const unit = String(item?.Unit || '')
                  const watchName = item?.WatchName || `Watch ${index + 1}`
                  const value = Number(item?.Value || 0)

                  let type = 'Other'
                  if (unit.toLowerCase().includes('kwh')) type = 'Electricity'
                  else if (unit.toLowerCase().includes('m³') || unit.toLowerCase().includes('m3')) type = 'Water'
                  else if (unit.toLowerCase().includes('btu')) type = 'Thermal'

                  return (
                    <tr
                      key={`${watchName}-${index}`}
                      className="border-b border-slate-100 dark:border-slate-700/30 last:border-0"
                    >
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{watchName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{unit || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{value.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{type}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
