/**
 * components/skeletons/MakeReportSkeleton.jsx
 * Mimics the Tenant Make Report form layout:
 *   - Page header with icon
 *   - Contact info row
 *   - Subject + Category fields
 *   - Message textarea
 *   - Submit button
 */
import Skeleton from '@/components/ui/Skeleton'

export default function MakeReportSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-5">

        {/* Tenant info (read-only row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Contact number */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Category select */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Message textarea */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-3 w-32" />
        </div>

        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      {/* Tips card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-32 bg-blue-200/60 dark:bg-blue-700/40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5 bg-blue-300 dark:bg-blue-600 flex-shrink-0" />
            <Skeleton className="h-3 w-full bg-blue-200/60 dark:bg-blue-700/40" />
          </div>
        ))}
      </div>
    </div>
  )
}
