const VARIANT_STYLES = {
  light: [
    'border-slate-200/80',
    'bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]',
    'shadow-[0_16px_48px_rgba(15,23,42,0.08)]',
    'dark:border-cyan-500/10',
    'dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_28%),linear-gradient(180deg,_#111722_0%,_#090d14_100%)]',
    'dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]',
  ].join(' '),
  dark: [
    'border-cyan-500/10',
    'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_28%),linear-gradient(180deg,_#111722_0%,_#090d14_100%)]',
    'shadow-[0_24px_80px_rgba(0,0,0,0.35)]',
  ].join(' '),
  plain: '',
}

export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
      <div className="min-w-0">
        <h1 className="page-title flex items-center gap-2 break-words">
          {Icon ? <Icon className="h-5 w-5 text-blue-500" /> : null}
          {title}
        </h1>
        {subtitle ? <p className="muted-text mt-0.5">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
    </div>
  )
}

export default function PageSection({
  children,
  className = '',
  innerClassName = '',
  padded = true,
  variant = 'light',
}) {
  return (
    <section
      className={[
        'animate-in rounded-[24px] sm:rounded-[30px] border min-w-0 overflow-hidden',
        VARIANT_STYLES[variant] || VARIANT_STYLES.light,
        padded ? 'p-4 sm:p-6' : '',
        className,
      ].join(' ')}
    >
      <div className={['section-gap min-w-0', innerClassName].filter(Boolean).join(' ')}>{children}</div>
    </section>
  )
}





