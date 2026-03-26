import { TrendingUp, TrendingDown, Zap, Flame, Droplets } from 'lucide-react'

const normalizeType = (type) => {
  const t = String(type || '').toLowerCase()
  if (t === 'electricity') return 'electric'
  if (t === 'electric') return 'electric'
  if (t === 'water') return 'water'
  if (t === 'thermal') return 'thermal'
  return 'electric'
}

const iconMap = {
  electric: Zap,
  thermal: Flame,
  water: Droplets,
}

const colorMap = {
  electric: {
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    glow: 'shadow-amber-500/20',
    ring: 'ring-amber-400/20',
  },
  thermal: {
    gradient: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    glow: 'shadow-rose-500/20',
    ring: 'ring-rose-400/20',
  },
  water: {
    gradient: 'from-cyan-400 to-blue-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
    glow: 'shadow-cyan-500/20',
    ring: 'ring-cyan-400/20',
  },
}

const labelMap = {
  electric: 'Electric Usage',
  thermal: 'Thermal Energy',
  water: 'Water Usage',
}

const descMap = {
  electric: 'Consumed by building — allocated to tenants based on metered usage.',
  thermal: 'Used for centralized chillers, cooling towers & HVAC systems.',
  water: 'Calculated to allocate water costs proportionally to all tenants.',
}

const defaultUnitMap = {
  electric: 'kWh',
  thermal: 'kBTU/h',
  water: 'm³',
}

function toSafeNumber(value) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

export default function UtilityCard({
  type,
  usage = 0,
  value,
  unit = '',
  estimatedCost = 0,
  cost,
  trend = 0,
  delta,
  lastUpdated = 'Updated just now',
  period,
}) {
  const normalizedType = normalizeType(type)
  const Icon = iconMap[normalizedType] || Zap
  const colors = colorMap[normalizedType] || colorMap.electric
  const safeUsage = toSafeNumber(usage ?? value)
  const safeEstimatedCost = toSafeNumber(estimatedCost ?? cost)
  const safeTrend = toSafeNumber(trend ?? delta)
  const safeUnit = unit || defaultUnitMap[normalizedType] || ''
  const safeLastUpdated = lastUpdated || period || 'Updated just now'
  const isPositive = safeTrend >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className={`glass rounded-2xl p-5 card-hover shadow-lg ${colors.glow} ring-1 ${colors.ring} animate-in`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>

        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${colors.badge}`}>
          <TrendIcon className="w-3 h-3" />
          {safeTrend > 0 ? '+' : ''}{Math.abs(safeTrend).toFixed(1)}%
        </span>
      </div>

      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
        {labelMap[normalizedType]}
      </p>

      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="text-2xl font-display font-bold text-slate-800 dark:text-white">
          {safeUsage.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-sm text-slate-400 font-mono">{safeUnit}</span>
      </div>

      <p className={`text-base font-semibold ${colors.text} mb-3`}>
        ₱{safeEstimatedCost.toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        <span className="text-xs font-normal text-slate-400 ml-1">est. cost</span>
      </p>

      <div className="border-t border-slate-200/60 dark:border-slate-700/50 pt-3">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{safeLastUpdated}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {descMap[normalizedType]}
        </p>
      </div>
    </div>
  )
}
