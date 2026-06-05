import { formatDateTime } from '@/utils/filterUtils'
import { AlertTriangle, Building2, Eye, Receipt, RefreshCw, ShieldCheck, Wallet } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'
import { useAdminOwnerPortal } from '@/hooks/adminHooks/useAdminOwnerPortal'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatMetric(card) {
  if (card.currency) return formatCurrency(card.value)
  if (card.suffix === '%') return `${Number(card.value || 0).toFixed(2)}%`
  return Number(card.value || 0).toLocaleString()
}


function SummaryCard({ card, loading = false, updating = false }) {
  const toneMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
    rose: 'text-rose-600 dark:text-rose-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <div className="glass rounded-2xl p-5 shadow-lg">
      <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{card.label}</p>
      <LoadingValue loading={loading} updating={updating} value={formatMetric(card)} className={`mt-2 font-display text-3xl font-700 ${toneMap[card.tone] || 'text-slate-700 dark:text-slate-200'}`} spinnerClassName="h-5 w-5 text-slate-400" />
      <p className="mt-1 text-xs text-slate-400">{card.helper}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'online'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
    : status === 'degraded'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
      : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {status || 'unknown'}
    </span>
  )
}

export default function OwnerPortal() {
  const loadingScreen = usePageLoader(250)
  const {
    month,
    setMonth,
    data,
    serviceStatus,
    serviceStatusLoading,
    serviceStatusError,
    loading,
    error,
    executiveCards,
    reload,
  } = useAdminOwnerPortal()
  const isInitialLoading = (loadingScreen || loading) && executiveCards.length === 0 && !error
  const isRefreshing = !isInitialLoading && loading

  const operations = data.operationsSummary || {}
  const occupancy = data.occupancySummary || {}
  const services = serviceStatus || {}

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-display text-xl font-700 text-slate-800 dark:text-white">Owner / Manager Portal</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Read-only executive snapshot for collections, occupancy, operational risks, and utility health.
          </p>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 whitespace-nowrap">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      Month
    </span>
    <input
      type="month"
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      className="bg-transparent outline-none"
    />
  </label>

  <UpdatingBadge show={isRefreshing} />

  {/* spacer pushes refresh to right on mobile */}
  <div className="flex-1 sm:hidden" />

  <button
    onClick={reload}
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60 whitespace-nowrap ml-auto sm:ml-0"
  >
    <RefreshCw className="h-4 w-4" />
    <span className="hidden sm:inline">Refresh Snapshot</span>
  </button>
</div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 xl:grid-cols-5">
        {executiveCards.map((card) => (
          <SummaryCard key={card.key} card={card} loading={isInitialLoading} updating={isRefreshing} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-500" />
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Financial Trend</h3>
              <p className="text-xs text-slate-400">Six-month billed vs collected view for quick owner reporting.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  {['Month', 'Billed', 'Collected', 'Collection Rate'].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isInitialLoading ? (
                  <TableLoadingRow colSpan={4} />
                ) : data.financialTrend.map((row, index) => (
                  <tr
                    key={`${row.month || 'month'}-${row.billed || 0}-${row.collected || 0}-${index}`}
                    className="border-b border-slate-100 dark:border-slate-800/80"
                  >
                    <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-200">{row.month}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(row.billed)}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(row.collected)}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{Number(row.collection_rate || 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-500" />
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Occupancy Snapshot</h3>
              <p className="text-xs text-slate-400">Current portfolio occupancy and vacancy balance.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Total Units', value: occupancy.total_units || 0 },
              { label: 'Occupied Units', value: occupancy.occupied_units || 0 },
              { label: 'Vacant Units', value: occupancy.vacant_units || 0 },
              { label: 'Occupancy Rate', value: `${Number(occupancy.occupancy_rate || 0).toFixed(2)}%` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={item.value} className="font-semibold text-slate-700 dark:text-slate-200" spinnerClassName="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-500" />
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Operational Watchlist</h3>
              <p className="text-xs text-slate-400">Current backlogs and owner-level exceptions that may need follow-up.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: 'Open Disputes', value: operations.open_disputes || 0 },
              { label: 'Pending Payments', value: operations.pending_payments || 0 },
              { label: 'Open Anomalies', value: operations.open_anomalies || 0 },
              { label: 'Pending Readings', value: operations.pending_readings || 0 },
              { label: 'Open Maintenance', value: operations.open_maintenance || 0 },
              { label: 'Active Announcements', value: operations.active_announcements || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 px-4 py-4 dark:border-slate-700">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{item.label}</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={item.value} className="mt-2 font-display text-2xl font-700 text-slate-800 dark:text-white" spinnerClassName="h-5 w-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Service Status</h3>
              <p className="text-xs text-slate-400">Read-only infrastructure reachability snapshot.</p>
            </div>
          </div>

          <div className="space-y-3">
            {serviceStatusError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {serviceStatusError}
              </div>
            ) : null}
            {[
              { label: 'Laravel API', data: services.api || {} },
              { label: 'Omni Service', data: services.omni || {} },
              { label: 'AI Service', data: services.ai || {} },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {serviceStatusLoading ? 'Checking service health...' : item.data.message || 'No status message.'}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Checked {serviceStatusLoading ? 'Loading...' : formatDateTime(item.data.checked_at)}
                      {item.data.latency_ms !== undefined && item.data.latency_ms !== null ? ` | ${item.data.latency_ms} ms` : ''}
                    </p>
                  </div>
                  <StatusBadge status={serviceStatusLoading ? 'unknown' : item.data.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-indigo-500" />
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Utility Snapshot</h3>
              <p className="text-xs text-slate-400">Main meter vs submeter variance for executive-level reconciliation.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  {['Utility', 'Main', 'Submeters', 'Variance', 'Status'].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.utilitySnapshot.map((row) => (
                  <tr key={row.utility} className="border-b border-slate-100 dark:border-slate-800/80">
                    <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-200">{row.utility}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.main_total.toLocaleString()} {row.unit}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.submeter_total.toLocaleString()} {row.unit}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.variance.toLocaleString()} ({Number(row.variance_percent || 0).toFixed(2)}%)</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        row.status === 'balanced'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                          : row.status === 'high'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <div>
              <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Health Alerts</h3>
              <p className="text-xs text-slate-400">Read-only alerts that may need manager follow-up.</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.healthAlerts.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300">
                No active owner-level alerts right now.
              </div>
            ) : (
              data.healthAlerts.map((alert, index) => (
                <div
                  key={`${alert.title}-${index}`}
                  className={`rounded-xl border px-4 py-3 ${
                    alert.type === 'critical'
                      ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{alert.title}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 shadow-lg">
        <div className="mb-4">
          <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Recent Activity</h3>
          <p className="text-xs text-slate-400">Latest high-level system actions for owner visibility. Read-only view only.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                {['When', 'User', 'Role', 'Action', 'Description'].map((heading) => (
                  <th key={heading} className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(item.created_at)}</td>
                  <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-200">{item.user_name || 'System'}</td>
                  <td className="px-3 py-3 text-slate-600 capitalize dark:text-slate-300">{String(item.role || 'system').replaceAll('_', ' ')}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{item.action || '-'}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{item.description || 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
