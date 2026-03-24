/**
 * ChartCard — standardised container for all Recharts charts across the app.
 *
 * Props
 * ─────
 * title      string             — card heading
 * subtitle   string?            — muted secondary line below title
 * badge      string?            — small pill in the top-right corner
 * badgeCls   string?            — custom Tailwind classes for the badge pill
 * accent     string?            — tiny coloured dot next to the title (hex or Tailwind bg-* class)
 * accentHex  string?            — hex value for the dot (overrides accent if provided)
 * action     ReactNode?         — arbitrary node rendered in the header right slot
 * className  string?            — extra wrapper classes
 * children   ReactNode          — the chart (or any content)
 * noPad      boolean?           — removes inner body padding (useful for full-bleed charts)
 */
export default function ChartCard({
  title,
  subtitle,
  badge,
  badgeCls  = 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  accent,
  accentHex,
  action,
  className = '',
  children,
  noPad     = false,
}) {
  return (
    <div
      className={[
        /* surface */
        'bg-white dark:bg-slate-900',
        'border border-slate-200/70 dark:border-slate-700/50',
        'rounded-2xl shadow-sm',
        /* subtle hover depth */
        'transition-shadow duration-300 hover:shadow-md',
        className,
      ].join(' ')}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <h3 className="font-semibold text-[14px] text-slate-800 dark:text-white flex items-center gap-2 leading-snug">
            {/* accent dot */}
            {(accent || accentHex) && (
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${accent && !accentHex ? accent : ''}`}
                style={accentHex ? { background: accentHex } : undefined}
              />
            )}
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {action}
          {badge && (
            <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg ${badgeCls}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={noPad ? '' : 'px-5 pb-5 pt-4'}>
        {children}
      </div>
    </div>
  )
}
