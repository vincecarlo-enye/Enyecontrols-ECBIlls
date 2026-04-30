/**
 * components/skeletons/TenantProfileSkeleton.jsx
 * Mimics the Tenant Profile page layout:
 *   - Profile card (avatar, name, role)
 *   - Info grid (contact / lease details)
 *   - Change password section
 */
import Skeleton from '@/components/ui/Skeleton'

export default function TenantProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-center gap-5">
        <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Info grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-5">
        <Skeleton className="h-4 w-32 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Password section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-5">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
