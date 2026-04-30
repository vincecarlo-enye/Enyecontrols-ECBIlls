/**
 * components/skeletons/NewBillSkeleton.jsx
 * Mimics the New Bill form page layout:
 *   - Back button + page header
 *   - Two-column form grid
 *   - Utility breakdown section
 *   - Submit / cancel buttons
 */
import Skeleton from '@/components/ui/Skeleton'

export default function NewBillSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-6">

        {/* Tenant + Unit row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Month + Billing period + Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Utility breakdown header */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>

        {/* 3 utility inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Computed total preview */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Skeleton className="flex-1 h-11 rounded-xl" />
          <Skeleton className="flex-1 h-11 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
