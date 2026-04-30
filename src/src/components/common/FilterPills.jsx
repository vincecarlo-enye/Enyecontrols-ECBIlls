export default function FilterPills({
  options = [],
  value,
  onChange,
  className = '',
  size = 'sm',
}) {
  const compact = size === 'sm'

  return (
    <div
      className={[
        'inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5',
        className,
      ].filter(Boolean).join(' ')}
    >
      {options.map((option) => {
        const key = typeof option === 'string' ? option : option.key
        const label = typeof option === 'string' ? option : option.label
        const active = key === value

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className={[
              'rounded-lg font-semibold transition-colors',
              compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-sm',
              active
                ? 'bg-slate-900 text-white dark:bg-cyan-400 dark:text-slate-950'
                : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
