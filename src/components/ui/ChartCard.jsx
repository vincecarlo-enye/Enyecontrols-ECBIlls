import ChartExportButton from '@/components/common/ChartExportButton'
import { ChartLoadingState, UpdatingBadge } from '@/components/common/InlineLoadingState'

export default function ChartCard({
  title,
  subtitle,
  badge,
  badgeCls = 'border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/12 dark:text-cyan-300',
  accent,
  accentHex,
  action,
  exportable = false,
  exportTitle,
  exportRows = [],
  exportFilename,
  className = '',
  children,
  noPad = false,
  loading = false,
  updating = false,
  loadingText = 'Loading chart data...',
}) {
  return (
    <div
      data-chart-export-panel={exportable ? 'true' : undefined}
      className={[
        'relative overflow-hidden rounded-[24px]',
        'border border-slate-200/80 bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)]',
        'dark:border-cyan-500/15 dark:bg-[#0d1118]/95 dark:text-slate-100 dark:shadow-[0_0_0_1px_rgba(6,182,212,0.06),0_18px_50px_rgba(0,0,0,0.35)]',
        'transition-all duration-300 hover:border-cyan-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)]',
        'dark:hover:border-cyan-400/25 dark:hover:shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_22px_60px_rgba(0,0,0,0.42)]',
        'before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-400/35 before:to-transparent dark:before:via-cyan-300/50',
        className,
      ].join(' ')}
    >
      <div className="border-b border-slate-100 px-5 pb-4 pt-5 dark:border-white/6">
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
        {(accent || accentHex) && (
          <span
            className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
              accent && !accentHex ? accent : ''
            }`}
            style={accentHex ? { background: accentHex } : undefined}
          />
        )}
        {title}
      </h3>

      {subtitle && (
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-500">
          {subtitle}
        </p>
      )}
    </div>

    <div className="flex flex-shrink-0 items-center gap-2">
      <UpdatingBadge show={updating} />

      {badge && (
        <span
          className={`inline-flex min-h-8 items-center rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] shadow-sm ${badgeCls}`}
        >
          {badge}
        </span>
      )}

      {exportable ? (
        <ChartExportButton
          title={exportTitle || title}
          rows={exportRows}
          filename={exportFilename}
        />
      ) : null}
    </div>
  </div>

  {action ? (
    <div className="mt-3 flex justify-end">
      {action}
    </div>
  ) : null}
</div>

      <div className={noPad ? '' : 'px-5 pb-5 pt-4'}>
        {loading ? <ChartLoadingState text={loadingText} className="h-[220px]" /> : children}
      </div>
    </div>
  )
}
