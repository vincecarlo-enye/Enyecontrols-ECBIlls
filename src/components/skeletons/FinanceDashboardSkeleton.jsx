/**
 * components/skeletons/FinanceDashboardSkeleton.jsx
 * Mimics the Finance Dashboard layout:
 *   - Header with FY badge
 *   - 5 summary KPI cards (xl:grid-cols-5)
 *   - Full-width monthly revenue chart
 *   - Utility revenue bar (3 cols) + pie chart (2 cols)
 *   - Revenue vs Expenses line chart
 *   - Recent transactions table
 *   - Announcements
 */
import Skeleton from '@/components/ui/Skeleton'

function KpiCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

function ChartCardSkeleton({ height = 'h-56', className = '', children }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      {children}
      <Skeleton className={`w-full ${height} rounded-xl`} />
    </div>
  )
}

function UtilityTotalsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 text-center space-y-1.5">
          <Skeleton className="h-4 w-4 mx-auto rounded" />
          <Skeleton className="h-3 w-16 mx-auto" />
          <Skeleton className="h-5 w-20 mx-auto" />
        </div>
      ))}
    </div>
  )
}

function PieChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-44" />
      </div>
      {/* Donut placeholder */}
      <div className="flex justify-center">
        <Skeleton className="w-40 h-40 rounded-full" />
      </div>
      {/* Legend */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-1.5 w-20 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TransactionsTableSkeleton({ rows = 8 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Col headers */}
      <div
        className="grid gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
        style={{ gridTemplateColumns: '1fr 1.5fr 0.8fr 1fr 1fr 0.8fr 1fr' }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
          style={{ gridTemplateColumns: '1fr 1.5fr 0.8fr 1fr 1fr 0.8fr 1fr' }}
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-12" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-14 rounded-lg mx-auto" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}

      {/* Footer */}
      <div className="flex items-center gap-6 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
        <Skeleton className="h-3 w-48 ml-auto" />
      </div>
    </div>
  )
}

function AnnouncementPanelSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

export default function FinanceDashboardSkeleton() {
  return (
    <div className="section-gap pb-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>

      {/* 5 KPI summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Full-width revenue area chart */}
      <ChartCardSkeleton height="h-60" />

      {/* Utility bar (3 cols) + Pie (2 cols) */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-36" />
          </div>
          <UtilityTotalsRowSkeleton />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <PieChartSkeleton />
      </div>

      {/* Revenue vs Expenses line chart */}
      <ChartCardSkeleton height="h-56">
        {/* Summary stats row inside the card */}
        <div className="flex items-center gap-6 flex-wrap -mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </ChartCardSkeleton>

      {/* Transactions table */}
      <TransactionsTableSkeleton rows={8} />

      {/* Announcements */}
      <AnnouncementPanelSkeleton />
    </div>
  )
}
