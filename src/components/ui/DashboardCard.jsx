import React from "react"

export default function DashboardCard({
  icon: Icon,
  title,
  value,
  sub,
  badge,
  badgeUp,
  gradient = "from-blue-500 to-indigo-600",
  glow = "shadow-blue-500/20",
  className = "",
  onClick,
}) {

  const badgeCls =
    badgeUp === true
      ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
      : badgeUp === false
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"

  const renderIcon = () => {
    if (!Icon) return null

    // if already JSX
    if (React.isValidElement(Icon)) {
      return Icon
    }

    // if component
    const Comp = Icon
    return <Comp className="w-4 h-4 text-white" strokeWidth={2} />
  }

  return (
    <div
      onClick={onClick}
      className={[
        "relative overflow-hidden rounded-2xl p-4",

        /* glass */
        "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl",
        "border border-white/20 dark:border-slate-700/50",

        /* glow */
        "shadow-lg",
        glow,

        /* bottom gradient */
        "before:absolute before:inset-x-0 before:bottom-0 before:h-[3px]",
        `before:bg-gradient-to-r before:${gradient}`,
        "before:opacity-60 hover:before:opacity-100 before:transition-opacity before:duration-300",

        /* hover */
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",

        onClick ? "cursor-pointer" : "",
        className,
      ].join(" ")}
    >
      {/* icon + badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
        >
          {renderIcon()}
        </div>

        {badge && (
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg leading-none ${badgeCls}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* title */}
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-tight mb-1">
        {title}
      </p>

      {/* value */}
      <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-none">
        {value}
      </p>

      {/* sub */}
      {sub && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">
          {sub}
        </p>
      )}
    </div>
  )
}