/**
 * components/skeletons/TenantDashboardSkeleton.jsx
 * Mimics the Tenant Dashboard layout:
 *   - Welcome header
 *   - Unit filter bar
 *   - 5 KPI cards (current bill, electricity, water, thermal, due date)
 *   - Utility rates section
 *   - Bills table (3 cols) + Announcements (2 cols) side by side
 */
import Skeleton from '@/components/ui/Skeleton'

function KpiCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

function UnitFilterBarSkeleton() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Skeleton className="h-8 w-16 rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-xl" />
      ))}
    </div>
  )
}

function UtilityRatesSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BillsTableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
      {/* Column headers */}
      <div
        className="grid gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
        style={{ gridTemplateColumns: '0.8fr 1fr 1.2fr 1fr 1fr 60px' }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
          style={{ gridTemplateColumns: '0.8fr 1fr 1.2fr 1fr 1fr 60px' }}
        >
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-lg" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function AnnouncementPanelSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4 h-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
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

export default function TenantDashboardSkeleton() {
  return (
    <div className="section-gap">
      {/* Welcome header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-72" />
      </div>

      {/* Unit filter bar */}
      <UnitFilterBarSkeleton />

      {/* 5 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Utility rates */}
      <UtilityRatesSkeleton />

      {/* Bills table + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <BillsTableSkeleton rows={6} />
        </div>
        <div className="lg:col-span-2">
          <AnnouncementPanelSkeleton />
        </div>
      </div>
    </div>
  )
}
