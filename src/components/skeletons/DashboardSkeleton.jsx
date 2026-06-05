/**
 * components/skeletons/DashboardSkeleton.jsx
 * Mimics the Admin Dashboard layout:
 *   - 4 KPI stat cards
 *   - 3 utility consumption cards
 *   - 2 chart cards + 1 wide chart
 *   - Bills table rows
 *   - Announcement panel
 */
import Skeleton from '@/components/ui/Skeleton'

// ─── Sub-parts ────────────────────────────────────────────────────────────────

function KpiCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

function UtilityCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

function ChartCardSkeleton({ height = 'h-48', wide = false }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm ${wide ? 'col-span-full' : ''} space-y-4`}>
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

function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="overflow-x-auto">
      {/* Column headers */}
      <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800" style={{minWidth: '480px'}}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0"
          style={{minWidth: '480px'}}
        >
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
      </div>
    </div>
  )
}

function AnnouncementSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-20 mt-1" />
        </div>
      ))}
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

export default function DashboardSkeleton() {
  return (
    <div className="section-gap">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Utility consumption */}
      <div>
        <Skeleton className="h-5 w-48 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <UtilityCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Daily charts */}
      <div>
        <Skeleton className="h-5 w-44 mb-3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>
      <ChartCardSkeleton wide height="h-52" />

      {/* Bills table */}
      <TableSkeleton rows={5} />

      {/* Announcements */}
      <AnnouncementSkeleton />
    </div>
  )
}
