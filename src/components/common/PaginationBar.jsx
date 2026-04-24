import { ChevronLeft, ChevronRight } from 'lucide-react'

function buildPageItems(currentPage, lastPage) {
  if (!lastPage || lastPage <= 1) return [1]

  const pages = new Set([1, lastPage, currentPage - 1, currentPage, currentPage + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((a, b) => a - b)

  const items = []

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]
    if (previous && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`)
    }
    items.push(page)
  })

  return items
}

export default function PaginationBar({
  meta,
  page = 1,
  perPage = 10,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50, 100],
  className = '',
}) {
  const currentPage = Number(meta?.current_page || page || 1)
  const lastPage = Number(meta?.last_page || 1)
  const total = Number(meta?.total || 0)
  const currentPerPage = Number(meta?.per_page || perPage || 10)
  const from = Number(meta?.from || 0)
  const to = Number(meta?.to || 0)

  if (lastPage <= 1 && total <= currentPerPage) {
    return null
  }

  const items = buildPageItems(currentPage, lastPage)

  return (
    <div data-print-hide="true" className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <p className="text-xs text-slate-400">
          Showing {from || 0} to {to || 0} of {total} records
        </p>

        {onPerPageChange ? (
          <label className="inline-flex items-center gap-2 text-xs text-slate-400">
            <span>Rows</span>
            <select
              value={currentPerPage}
              onChange={(event) => onPerPageChange?.(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        {items.map((item) => {
          if (typeof item === 'string') {
            return (
              <span key={item} className="px-1 text-xs text-slate-400">
                ...
              </span>
            )
          }

          const isActive = item === currentPage

          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange?.(item)}
              className={`min-w-[34px] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {item}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
