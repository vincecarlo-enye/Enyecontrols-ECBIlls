import { Wifi, WifiOff } from 'lucide-react'
import { useFacilityEquipment } from '@/hooks/facilityHooks/useFacilityEquipment'
import PaginationBar from '@/components/common/PaginationBar'
import { useClientPagination } from '@/hooks/useClientPagination'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

const statusIcon = {
  online: <Wifi className="w-4 h-4 text-emerald-500" />,
  offline: <WifiOff className="w-4 h-4 text-slate-400" />,
  warning: <WifiOff className="w-4 h-4 text-amber-500" />,
}

const statusBadge = {
  online: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  offline: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const typeBadge = {
  Electric: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Water: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Thermal: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export default function EquipmentStatus() {
  const { meters, loading, error, stats } = useFacilityEquipment()
  const pagination = useClientPagination(meters, 10)

  const isInitialLoading = loading && meters.length === 0 && !error
  const isRefreshing = loading && meters.length > 0
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Equipment Status</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage meters, sensors, and equipment assignments</p>
        </div>
        <UpdatingBadge show={isRefreshing} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-3 sm:gap-4 gap-2">
        {[
          { label: 'Online', value: stats.online, color: 'text-emerald-600' },
          { label: 'Offline', value: stats.offline, color: 'text-slate-500' },
          { label: 'Warning', value: stats.warning, color: 'text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm text-center">
            <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={s.value} className={`text-3xl font-bold ${s.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Meter ID</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Name</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Assigned To</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Last Reading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isInitialLoading ? (
                <TableLoadingRow colSpan={6} />
              ) : meters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No equipment records found.</td>
                </tr>
              ) : pagination.pagedItems.map((meter) => (
                <tr key={meter.meter_id || meter.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{meter.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{meter.name}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeBadge[meter.type] || typeBadge.Other}`}>{meter.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{meter.assigned}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadge[meter.status] || statusBadge.offline}`}>
                      {statusIcon[meter.status] || statusIcon.offline}
                      {meter.status.charAt(0).toUpperCase() + meter.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{meter.lastRead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <PaginationBar
            meta={pagination.meta}
            page={pagination.page}
            perPage={pagination.perPage}
            onPageChange={pagination.setPage}
            onPerPageChange={(value) => {
              pagination.setPerPage(value)
              pagination.setPage(1)
            }}
          />
        </div>
      </div>
    </div>
  )
}
