import { Download } from 'lucide-react'
import { useState } from 'react'
import { exportTableCsv } from '@/utils/reporting'

function buildFilename(title = 'chart-export') {
  const safe = String(title || 'chart-export')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safe || 'chart-export'}.csv`
}

export default function ChartExportButton({
  title = 'Chart Export',
  rows = [],
  getRows,
  filename,
  className = '',
}) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (event) => {
    void event
    if (exporting) return

    const exportRows = typeof getRows === 'function' ? getRows() : rows
    if (!Array.isArray(exportRows) || exportRows.length === 0) return

    try {
      setExporting(true)
      exportTableCsv(filename || buildFilename(title), exportRows)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting || (typeof getRows !== 'function' && (!Array.isArray(rows) || rows.length === 0))}
      data-print-hide="true"
      aria-label={`Export ${title} as CSV`}
      title={`Export ${title} as CSV`}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all',
        'hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      ].join(' ')}
    >
      <Download className="h-4 w-4" />
    </button>
  )
}
