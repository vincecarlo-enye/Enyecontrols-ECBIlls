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
        "relative overflow-hidden rounded-[22px] p-4",
        "border border-slate-200/80 bg-white/95 backdrop-blur-xl",
        "shadow-[0_10px_30px_rgba(15,23,42,0.08)]",
        "dark:border-cyan-500/15 dark:bg-[#0d1118]/95",
        "dark:shadow-[0_0_0_1px_rgba(6,182,212,0.06),0_18px_50px_rgba(0,0,0,0.35)]",
        glow,
        "before:absolute before:inset-x-0 before:top-0 before:h-px",
        `before:bg-gradient-to-r before:${gradient}`,
        "before:opacity-80",
        "after:absolute after:inset-x-5 after:bottom-0 after:h-[3px]",
        `after:bg-gradient-to-r after:${gradient}`,
        "after:opacity-75",
        "transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)]",
        "dark:hover:border-cyan-400/25 dark:hover:shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_22px_60px_rgba(0,0,0,0.42)]",

        onClick ? "cursor-pointer" : "",
        className,
      ].join(" ")}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}
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

      <p className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 leading-tight dark:text-slate-500">
        {title}
      </p>

      <p className="text-xl font-bold leading-none text-slate-800 dark:text-slate-50 sm:text-[1.35rem]">
        {value}
      </p>

      {sub && (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-500">
          {sub}
        </p>
      )}
    </div>
  )
}
