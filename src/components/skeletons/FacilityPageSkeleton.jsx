/**
 * components/skeletons/FacilityPageSkeleton.jsx
 * Generic skeleton for facility sub-pages:
 * Equipment, Maintenance, Monitoring, Consumption, Reports
 * Mimics: header + stat row + filter bar + table/grid
 */
import Skeleton from '@/components/ui/Skeleton'

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

function ChartCardSkeleton({ height = 'h-48' }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className={`w-full ${height} rounded-xl`} />
    </div>
  )
}

function GenericTableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Col headers */}
      <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
        >
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-16 rounded-lg" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FacilityPageSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* Table */}
      <GenericTableSkeleton rows={6} />
    </div>
  )
}
