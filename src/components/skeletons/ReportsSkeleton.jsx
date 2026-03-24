/**
 * components/skeletons/ReportsSkeleton.jsx
 * Mimics the Usage Reports & Finance Reports pages:
 *   - Header with export + filter buttons
 *   - 3 chart cards (one per utility)
 *   - Monthly overview table
 */
import Skeleton from '@/components/ui/Skeleton'

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

function MonthlyTableSkeleton({ rows = 7 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      {/* Col headers */}
      <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
        >
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export default function ReportsSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Filter/toggle row */}
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-xl" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <ChartCardSkeleton height="h-52" />

      {/* Monthly overview table */}
      <MonthlyTableSkeleton rows={7} />
    </div>
  )
}
