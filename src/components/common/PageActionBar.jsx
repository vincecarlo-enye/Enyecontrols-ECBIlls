import { Download, Printer } from 'lucide-react'

export default function PageActionBar({
  onExport,
  onPrint,
  exportLabel = 'Export CSV',
  printLabel = 'Print',
  iconOnly = false,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`.trim()}>
      {onExport ? (
        <button
          type="button"
          onClick={onExport}
          aria-label={exportLabel}
          title={exportLabel}
          className={`inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-900/60 ${
            iconOnly ? 'h-10 w-10' : 'gap-2 px-4 py-2.5 text-sm font-semibold'
          }`}
        >
          <Download className="h-4 w-4" />
          {iconOnly ? <span className="sr-only">{exportLabel}</span> : exportLabel}
        </button>
      ) : null}
      {onPrint ? (
        <button
          type="button"
          onClick={onPrint}
          aria-label={printLabel}
          title={printLabel}
          className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${
            iconOnly ? 'h-10 w-10' : 'gap-2 px-4 py-2.5 text-sm font-semibold'
          }`}
        >
          <Printer className="h-4 w-4" />
          {iconOnly ? <span className="sr-only">{printLabel}</span> : printLabel}
        </button>
      ) : null}
    </div>
  )
}
