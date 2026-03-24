/**
 * components/skeletons/UnitsSkeleton.jsx
 * Mimics the Admin Units page layout:
 *   - Header with Add Unit button
 *   - Summary stat cards
 *   - Units table/grid
 */
import Skeleton from '@/components/ui/Skeleton'

function UnitCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="flex-1 h-8 rounded-lg" />
        <Skeleton className="flex-1 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  )
}

export default function UnitsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-72 rounded-xl" />

      {/* Units grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <UnitCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
