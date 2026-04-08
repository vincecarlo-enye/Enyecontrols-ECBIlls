import { AlertTriangle, CheckCircle2, RefreshCw, ServerCrash, ShieldCheck, WifiOff } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { ReportsSkeleton } from '@/components/skeletons'
import { useAdminSystemHealth } from '@/hooks/adminHooks/useAdminSystemHealth'

function formatDateTime(value) {
  if (!value) return 'No data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMinutes(value) {
  if (value === null || value === undefined) return 'No sync yet'
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${hours}h ${minutes}m`
}

function ServiceBadge({ status }) {
  const cls = status === 'online'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
    : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {status || 'unknown'}
    </span>
  )
}

function SummaryCard({ label, value, sub, tone }) {
  const toneMap = {
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
    violet: 'text-violet-600 dark:text-violet-400',
    rose: 'text-rose-600 dark:text-rose-400',
    slate: 'text-slate-700 dark:text-slate-200',
  }

  return (
    <div className="glass rounded-2xl p-5 shadow-lg">
      <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-2 font-display text-3xl font-700 ${toneMap[tone] || toneMap.slate}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  )
}

export default function SystemHealth() {
  const loadingScreen = usePageLoader(250)
  const {
    data,
    loading,
    error,
    summaryCards,
    reload,
  } = useAdminSystemHealth()

  if (loadingScreen || loading) return <ReportsSkeleton />

  const services = data.services || {}
  const pageHealth = Array.isArray(data.freshness?.page_health) ? data.freshness.page_health : []
  const alerts = Array.isArray(data.alerts) ? data.alerts : []

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">System Health Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Monitor service reachability, Omni freshness, and operational backlog in one place.
          </p>
          <p className="mt-1 text-xs text-slate-400">Last generated: {formatDateTime(data.generatedAt)}</p>
        </div>

        <button
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Health
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <SummaryCard key={card.key} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {[
          {
            key: 'api',
            label: 'Laravel API',
            icon: ShieldCheck,
            data: services.api || {},
          },
          {
            key: 'omni',
            label: 'Omni Service',
            icon: services.omni?.status === 'online' ? CheckCircle2 : WifiOff,
            data: services.omni || {},
          },
          {
            key: 'ai',
            label: 'AI Service',
            icon: services.ai?.status === 'online' ? CheckCircle2 : ServerCrash,
            data: services.ai || {},
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.key} className="glass rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.data.message || 'No status message yet.'}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <ServiceBadge status={item.data.status} />
                <span className="text-xs text-slate-400">Checked {formatDateTime(item.data.checked_at)}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {'watch_count' in item.data ? (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Watches</p>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{item.data.watch_count ?? 0}</p>
                  </div>
                ) : null}
                {'page_count' in item.data ? (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Pages</p>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{item.data.page_count ?? 0}</p>
                  </div>
                ) : null}
                {'http_status' in item.data ? (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">HTTP Status</p>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{item.data.http_status ?? 'N/A'}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1.5fr]">
        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Health Alerts</h3>
            <p className="text-xs text-slate-400">Items that may need operational attention now.</p>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300">
                No active health alerts right now.
              </div>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={`${alert.title}-${index}`}
                  className={`rounded-2xl border px-4 py-3 ${
                    alert.type === 'critical'
                      ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${alert.type === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{alert.title}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h3 className="font-display text-[15px] font-700 text-slate-800 dark:text-white">Omni Page Freshness</h3>
            <p className="text-xs text-slate-400">Per-page sync freshness, pending approvals, and latest reading visibility.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Page</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Latest Reading</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Stale</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Pending</th>
                  <th className="px-3 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Meters</th>
                </tr>
              </thead>
              <tbody>
                {pageHealth.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">
                      No page health data found yet.
                    </td>
                  </tr>
                ) : (
                  pageHealth.map((page) => (
                    <tr key={page.page_name} className="border-b border-slate-100 dark:border-slate-800/80">
                      <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-200">{page.page_name}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          page.status === 'healthy'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : page.status === 'stale'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(page.latest_recorded_at)}</td>
                      <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">{formatMinutes(page.minutes_stale)}</td>
                      <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">{page.pending_approval_count ?? 0}</td>
                      <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">{page.meter_count ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
