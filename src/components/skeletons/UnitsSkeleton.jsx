import Skeleton from '@/components/ui/Skeleton'

function UnitTableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-10" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      </td>
      <td className="px-4 py-3.5 space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-36" />
      </td>
      <td className="px-4 py-3.5"><Skeleton className="h-6 w-20 rounded-lg" /></td>
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </td>
    </tr>
  )
}

export default function UnitsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ maxWidth: '420px' }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-8 w-14" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="h-28 w-full rounded-2xl" />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-md">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-16" />
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <tbody>
              {Array.from({ length: 8 }).map((_, index) => (
                <UnitTableRowSkeleton key={index} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-10 rounded-lg" />
            <Skeleton className="h-9 w-10 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
