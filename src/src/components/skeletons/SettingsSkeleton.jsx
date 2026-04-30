/**
 * components/skeletons/SettingsSkeleton.jsx
 * Mimics the Admin Settings page layout:
 *   - Page header
 *   - Sidebar nav (5 items) + main content panel side by side
 */
import Skeleton from '@/components/ui/Skeleton'

export default function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-3 shadow-sm h-fit space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-3 rounded-xl">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="w-4 h-4 rounded" />
            </div>
          ))}
        </div>

        {/* Main settings content panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>

          {/* Toggle rows */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
