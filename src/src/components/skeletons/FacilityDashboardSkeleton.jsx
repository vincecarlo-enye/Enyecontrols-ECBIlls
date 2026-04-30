/**
 * components/skeletons/FacilityDashboardSkeleton.jsx
 * Mimics the Facility Dashboard layout:
 *   - Header with Live badge + filter buttons
 *   - 4 KPI summary cards (top row)
 *   - 3 today-metric cards
 *   - 2×2 chart grid + wide comparison chart
 *   - Unit monitoring table
 *   - Alerts + Maintenance side-by-side panels
 */
import Skeleton from '@/components/ui/Skeleton'

function KpiCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

function ChartCardSkeleton({ height = 'h-52', className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className={`w-full ${height} rounded-xl`} />
    </div>
  )
}

function UnitMonitoringTableSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Col headers */}
      <div
        className="grid gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
        style={{ gridTemplateColumns: '1.2fr 0.8fr 1fr 1fr 1.2fr 1fr 1fr' }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="grid gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
          style={{ gridTemplateColumns: '1.2fr 0.8fr 1fr 1fr 1.2fr 1fr 1fr' }}
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-20 rounded-lg" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function AlertPanelSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-32" />
            <div className="flex items-center gap-1.5 pt-1">
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaintenancePanelSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>

      {/* Col headers */}
      <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 col-span-1 w-full" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}

      {/* Footer */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

export default function FacilityDashboardSkeleton() {
  return (
    <div className="section-gap pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-xl" />
          <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
      </div>

      {/* Top KPI cards (4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Today metric cards (3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts 2×2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      {/* Thermal + comparison charts */}
      <div className="grid lg:grid-cols-5 gap-4">
        <ChartCardSkeleton className="lg:col-span-2" />
        <ChartCardSkeleton className="lg:col-span-3" height="h-60" />
      </div>

      {/* Unit monitoring table */}
      <UnitMonitoringTableSkeleton />

      {/* Alerts + Maintenance side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AlertPanelSkeleton />
        <MaintenancePanelSkeleton />
      </div>
    </div>
  )
}
