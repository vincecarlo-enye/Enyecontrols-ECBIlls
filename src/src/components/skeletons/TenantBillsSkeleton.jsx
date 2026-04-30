/**
 * components/skeletons/TenantBillsSkeleton.jsx
 * Mimics the Tenant Bills page layout:
 *   - Header
 *   - Unit filter bar
 *   - Status filter tabs
 *   - Bills table (8 rows)
 */
import Skeleton from '@/components/ui/Skeleton'

export default function TenantBillsSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3 w-52" />
      </div>

      {/* Unit filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Skeleton className="h-8 w-16 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-xl" />
        ))}
      </div>

      {/* Bills table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-9 w-56 rounded-xl" />
        </div>

        {/* Col headers */}
        <div
          className="grid gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
          style={{ gridTemplateColumns: '0.7fr 1fr 1.2fr 1fr 1fr 1fr 1fr 80px' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
            style={{ gridTemplateColumns: '0.7fr 1fr 1.2fr 1fr 1fr 1fr 1fr 80px' }}
          >
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-14 rounded-lg" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  )
}
