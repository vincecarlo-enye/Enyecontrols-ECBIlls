/**
 * components/skeletons/TenantListSkeleton.jsx
 * Mimics the Admin Tenants page layout:
 *   - Page header with Add Tenant button
 *   - Search bar
 *   - Grid of tenant cards (6 cards, 3-column on lg)
 */
import Skeleton from '@/components/ui/Skeleton'

function TenantCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-1">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded flex-shrink-0" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded flex-shrink-0" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-8 rounded-lg" />
        <Skeleton className="flex-1 h-8 rounded-lg" />
        <Skeleton className="w-9 h-8 rounded-lg flex-shrink-0" />
      </div>
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

export default function TenantListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-72 rounded-xl" />

      {/* Tenant grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TenantCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
