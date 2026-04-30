import { Loader2 } from 'lucide-react'

export function LoadingValue({
  loading,
  updating = false,
  value,
  className = '',
  spinnerClassName = 'h-4 w-4 text-slate-400',
  updatingSpinnerClassName = 'h-3.5 w-3.5 text-slate-400',
}) {
  return (
    <div className={className}>
      {loading ? (
        <Loader2 className={`${spinnerClassName} animate-spin`} />
      ) : updating ? (
        <span className="inline-flex items-center gap-2">
          <span>{value}</span>
          <Loader2 className={`${updatingSpinnerClassName} animate-spin`} />
        </span>
      ) : (
        value
      )}
    </div>
  )
}

export function UpdatingBadge({ show }) {
  if (!show) return null

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-300">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Updating...
    </div>
  )
}

export function TableLoadingRow({ colSpan, text = 'Loading...' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-slate-400">
        {text}
      </td>
    </tr>
  )
}

export function ChartLoadingState({ text = 'Loading chart data...', className = 'h-[220px]' }) {
  return (
    <div className={`${className} flex items-center justify-center text-sm text-slate-400`}>
      {text}
    </div>
  )
}
