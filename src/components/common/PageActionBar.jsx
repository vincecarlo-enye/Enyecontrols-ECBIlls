import { Download, Printer } from 'lucide-react'

export default function PageActionBar({
  onExport,
  onPrint,
  exportLabel = 'Export CSV',
  printLabel = 'Print',
  iconOnly = false,
  mobileIconOnly = true,
  className = '',
}) {
  const exportButtonClass = iconOnly
    ? 'h-10 w-10'
    : mobileIconOnly
      ? 'h-10 w-10 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm sm:font-semibold'
      : 'gap-2 px-4 py-2.5 text-sm font-semibold'

  const printButtonClass = iconOnly
    ? 'h-10 w-10'
    : mobileIconOnly
      ? 'h-10 w-10 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm sm:font-semibold'
      : 'gap-2 px-4 py-2.5 text-sm font-semibold'

  return (
    <div data-print-hide="true" className={`flex items-center gap-2 flex-wrap ${className}`.trim()}>
      {onExport ? (
        <button
          type="button"
          onClick={onExport}
          aria-label={exportLabel}
          title={exportLabel}
          className={`inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-900/60 ${exportButtonClass}`}
        >
          <Download className="h-4 w-4" />
          {iconOnly ? <span className="sr-only">{exportLabel}</span> : mobileIconOnly ? <><span className="sr-only sm:not-sr-only">{exportLabel}</span></> : exportLabel}
        </button>
      ) : null}
      {onPrint ? (
        <button
          type="button"
          onClick={onPrint}
          aria-label={printLabel}
          title={printLabel}
          className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${printButtonClass}`}
        >
          <Printer className="h-4 w-4" />
          {iconOnly ? <span className="sr-only">{printLabel}</span> : mobileIconOnly ? <><span className="sr-only sm:not-sr-only">{printLabel}</span></> : printLabel}
        </button>
      ) : null}
    </div>
  )
}
