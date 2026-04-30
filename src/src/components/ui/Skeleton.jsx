/**
 * components/ui/Skeleton.jsx
 * Base skeleton block — animate-pulse placeholder for loading states.
 * Accepts a className prop so shapes can be customised anywhere.
 *
 * Usage:
 *   <Skeleton className="h-6 w-40" />
 *   <Skeleton className="h-32 w-full rounded-2xl" />
 */
export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700/60 ${className}`}
    />
  )
}
