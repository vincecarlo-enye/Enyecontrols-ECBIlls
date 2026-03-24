/**
 * components/skeletons/AnnouncementSkeleton.jsx
 * Mimics a full announcement management page layout:
 *   - Page header + Create button
 *   - Filter tabs
 *   - List of announcement cards
 */
import Skeleton from '@/components/ui/Skeleton'

function AnnouncementCardSkeleton({ featured = false }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-3 ${featured ? 'border-l-4 border-l-blue-400' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

export default function AnnouncementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-xl" />
        ))}
      </div>

      {/* Announcement list */}
      <div className="space-y-4">
        <AnnouncementCardSkeleton featured />
        <AnnouncementCardSkeleton />
        <AnnouncementCardSkeleton />
        <AnnouncementCardSkeleton />
      </div>
    </div>
  )
}
