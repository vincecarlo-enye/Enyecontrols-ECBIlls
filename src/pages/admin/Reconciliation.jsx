import { formatNumber } from '@/utils/filterUtils'
import { useMemo, useRef } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import { AlertTriangle, CalendarRange, Download, Printer, RefreshCw } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ChartLoadingState, LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'
import ChartExportButton from '@/components/common/ChartExportButton'
import { useAdminReconciliation } from '@/hooks/adminHooks/useAdminReconciliation'
import { useApp } from '@/context/AppContext'
import { printElement } from '@/utils/reporting'
import { downloadCsv } from '@/utils/exportCsv'



function formatPercent(value) {
  if (value === null || value === undefined) return '0.00%'
  return `${formatNumber(value, 2)}%`
}

function getStatusTone(status) {
  if (status === 'balanced') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
  }

  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
}

function exportCsv(data) {
  const summaryRows = Object.entries(data.summary || {}).map(([key, item]) => ([
    key,
    item?.unit || '',
    item?.status || '',
    item?.main_total ?? 0,
    item?.submeter_total ?? 0,
    item?.variance ?? 0,
    item?.variance_percent ?? 0,
  ]))

  const trendRows = (data.monthlySeries || []).map((item) => ([
    item?.month || '',
    item?.main_total ?? 0,
    item?.submeter_total ?? 0,
    item?.variance ?? 0,
  ]))

  const pageBreakdownRows = (data.pageBreakdown || []).map((item) => ([
    item?.page_name || '',
    item?.scope || '',
    item?.unit_labels || '',
    item?.meter_count ?? 0,
    item?.electricity ?? 0,
    item?.water ?? 0,
    item?.thermal ?? 0,
  ]))

  const rows = [
    ['Report', 'Main Meter vs Submeter Reconciliation'],
    ['Period', data.period?.label || data.period?.month || ''],
    ['Main Page', data.meta?.main_page || ''],
    ['Submeter Pages', (data.meta?.submeter_pages || []).join(', ')],
    [],
    ['Utility Summary'],
    ['Utility', 'Unit', 'Status', 'Main Meter', 'Submeters', 'Variance', 'Variance %'],
    ...summaryRows,
    [],
    ['6-Month Reconciliation Trend'],
    ['Month', 'Main Meter', 'Submeters', 'Variance'],
    ...trendRows,
    [],
    ['Omni Page Breakdown'],
    ['Page', 'Scope', 'Units', 'Meters', 'Electricity', 'Water', 'Thermal'],
    ...pageBreakdownRows,
  ]

  downloadCsv(`reconciliation-${data.period?.month || 'report'}.csv`, rows)
}

export default function Reconciliation() {
  const loadingScreen = usePageLoader(500)
  const { addToast } = useApp()
  const printRef = useRef(null)
  const {
    selectedMonth,
    setSelectedMonth,
    data,
    loading,
    error,
    utilityCards,
    reload,
  } = useAdminReconciliation()
  const isInitialLoading = (loadingScreen || loading) && utilityCards.length === 0 && !error
  const isRefreshing = !isInitialLoading && loading

  const chartData = useMemo(() => (
    (data.monthlySeries || []).map((item) => ({
      month: item.month,
      Main: Number(item.main_total || 0),
      Submeters: Number(item.submeter_total || 0),
      Variance: Number(item.variance || 0),
    }))
  ), [data.monthlySeries])

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            Main Meter vs Submeter Reconciliation
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Validate building totals against tenant submeters before billing disputes happen.
          </p>
          <UpdatingBadge show={isRefreshing} />

        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 px-2 py-2 text-sm text-slate-600 dark:text-slate-300">
            <CalendarRange className="w-4 h-4" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent outline-none w-[135px]"
            />
          </label>

          <button
            onClick={() => reload(selectedMonth)}
            aria-label="Refresh reconciliation report"
            title="Refresh reconciliation report"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              exportCsv(data)
              addToast('Reconciliation report exported to CSV')
            }}
            aria-label="Export reconciliation report as CSV"
            title="Export reconciliation report as CSV"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              printElement({
                title: 'Main Meter vs Submeter Reconciliation',
                subtitle: data.period?.label || selectedMonth,
                element: printRef.current,
                mode: 'visual',
              })
            }}
            aria-label="Print reconciliation report"
            title="Print reconciliation report"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div ref={printRef} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {utilityCards.map((card) => (
          <div key={card.key} className="glass rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-slate-400">{card.label}</p>
                <div className="mt-2">
                  <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={formatNumber(card.variance)} className="font-display font-700 text-2xl text-slate-800 dark:text-white" spinnerClassName="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-400">{card.unit}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Variance for {data.period?.label || selectedMonth}</p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getStatusTone(card.status)}`}>
                {card.status || 'review'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Main Meter</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={`${formatNumber(card.main_total)} ${card.unit}`} className="mt-1 font-semibold text-slate-700 dark:text-slate-200" spinnerClassName="h-4 w-4 text-slate-400" />
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Submeters</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={`${formatNumber(card.submeter_total)} ${card.unit}`} className="mt-1 font-semibold text-slate-700 dark:text-slate-200" spinnerClassName="h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Variance %</span>
              <span className="font-mono">{formatPercent(card.variance_percent)}</span>
            </div>
          </div>
        ))}
      </div>

      <div data-chart-export-panel="true" className="glass rounded-2xl p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">6-Month Reconciliation Trend</h3>
            <p className="text-xs text-slate-400">
              Main page: <span className="font-medium text-slate-600 dark:text-slate-300">{data.meta?.main_page || 'Not detected'}</span>
              {' '}| Submeter pages: <span className="font-medium text-slate-600 dark:text-slate-300">{(data.meta?.submeter_pages || []).join(', ') || 'None'}</span>
            </p>
          </div>
          <ChartExportButton title="6-Month Reconciliation Trend" rows={chartData} />
        </div>

        {isInitialLoading ? (
          <ChartLoadingState className="h-[280px]" />
        ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px' }}
              formatter={(value) => [formatNumber(value), '']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
            <Bar dataKey="Main" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Submeters" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Variance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>

      <div className="glass rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">Omni Page Breakdown</h3>
          <p className="text-xs text-slate-400">Use this to spot missing submeter mappings and suspicious page totals.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">Page</th>
                <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">Scope</th>
                <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">Units</th>
                <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">Meters</th>
                <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">Electricity</th>
                <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">Water</th>
                <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-400">Thermal</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading ? (
                <TableLoadingRow colSpan={7} />
              ) : (data.pageBreakdown || []).map((item) => (
                <tr key={`${item.page_name}-${item.scope}`} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{item.page_name}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.scope === 'main' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
                      {item.scope}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{item.unit_labels || 'Unmapped'}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{item.meter_count}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatNumber(item.electricity)} kWh</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatNumber(item.water)} m3</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatNumber(item.thermal)} kBTU</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isInitialLoading && (data.pageBreakdown || []).length === 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            No Omni page breakdown data found for the selected month yet.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
