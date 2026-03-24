/**
 * components/skeletons/BillingSkeleton.jsx
 * Mimics the Admin Billing page layout:
 *   - Page header with action buttons
 *   - 4 stat cards (total / collected / unpaid / pending)
 *   - Filter bar + bills table (6–8 rows)
 *   - Rate config card
 */
import Skeleton from '@/components/ui/Skeleton'

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

function FilterBarSkeleton() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Skeleton className="h-9 w-64 rounded-xl" />
      <Skeleton className="h-9 w-32 rounded-xl" />
      <Skeleton className="h-9 w-32 rounded-xl" />
    </div>
  )
}

function BillsTableSkeleton({ rows = 7 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      {/* Top filter/search bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
        <FilterBarSkeleton />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>

      {/* Column headers */}
      <div className="grid gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
        style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 80px' }}>
        {['', '', '', '', '', '', ''].map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
          style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 80px' }}
        >
          <Skeleton className="h-4 w-16" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-lg" />
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  )
}

function RateConfigSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

export default function BillingSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Bills table */}
      <BillsTableSkeleton rows={7} />

      {/* Rate config */}
      <RateConfigSkeleton />
    </div>
  )
}
