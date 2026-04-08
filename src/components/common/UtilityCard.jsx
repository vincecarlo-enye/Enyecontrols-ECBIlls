import { TrendingDown, TrendingUp, Zap, Droplets, Flame } from 'lucide-react'
import electricityMeterBefore from '@/assets/meters/electricity_b4.png'
import electricityMeter from '@/assets/meters/electricity.png'
import waterMeterBefore from '@/assets/meters/water_b4.png'
import waterMeter from '@/assets/meters/water.png'
import thermalMeterBefore from '@/assets/meters/thermal_b4.png'
import thermalMeter from '@/assets/meters/thermal.png'

const normalizeType = (type) => {
  const value = String(type || '').toLowerCase()
  if (value === 'electricity' || value === 'electric') return 'electric'
  if (value === 'water') return 'water'
  if (value === 'thermal') return 'thermal'
  return 'electric'
}

const imageMap = {
  electric: {
    idle: electricityMeterBefore,
    hover: electricityMeter,
  },
  water: {
    idle: waterMeterBefore,
    hover: waterMeter,
  },
  thermal: {
    idle: thermalMeterBefore,
    hover: thermalMeter,
  },
}

const iconMap = {
  electric: Zap,
  water: Droplets,
  thermal: Flame,
}

const colorMap = {
  electric: {
    gradient: 'from-yellow-400 to-orange-500',
    text: 'text-amber-300',
    badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/15',
    valueUnit: 'kWh',
    label: 'Power Meter',
    description: 'Real-time electrical monitoring',
  },
  water: {
    gradient: 'from-sky-300 to-blue-500',
    text: 'text-sky-300',
    badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/15',
    valueUnit: 'm3',
    label: 'Water Meter',
    description: 'Flow rate monitoring',
  },
  thermal: {
    gradient: 'from-rose-400 to-red-500',
    text: 'text-rose-300',
    badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/15',
    valueUnit: 'BTU',
    label: 'BTU Meter',
    description: 'Heat-flow monitoring',
  },
}

function toNumber(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const BAR_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export default function UtilityCard({
  type,
  usage = 0,
  value,
  unit = '',
  estimatedCost = 0,
  cost,
  trend = 0,
  delta,
}) {
  const normalizedType = normalizeType(type)
  const meterImages = imageMap[normalizedType]
  const Icon = iconMap[normalizedType]
  const palette = colorMap[normalizedType]
  const safeUsage = toNumber(usage ?? value)
  const safeCost = toNumber(estimatedCost ?? cost)
  const safeTrend = toNumber(trend ?? delta)
  const TrendIcon = safeTrend >= 0 ? TrendingUp : TrendingDown
  const displayUnit = unit || palette.valueUnit
  const bars = normalizedType === 'electric'
    ? [54, 48, 66, 44, 50, 68, 56]
    : normalizedType === 'water'
      ? [46, 58, 66, 49, 44, 68, 52]
      : [48, 44, 67, 52, 46, 66, 49]
  const barValues = bars.map((height) => Number((safeUsage * (height / 100)).toFixed(2)))

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 dark:border-cyan-500/15 dark:bg-[#0d1118]/95 dark:shadow-[0_0_0_1px_rgba(6,182,212,0.06),0_18px_50px_rgba(0,0,0,0.35)]">
      <div className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r ${palette.gradient} opacity-80`} />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${palette.gradient} shadow-md`}>
              <Icon className="h-4 w-4 text-slate-950" strokeWidth={2.2} />
            </div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-800 dark:text-slate-100">
              {palette.label}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">{palette.description}</p>
        </div>

        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${palette.badge}`}>
          <TrendIcon className="h-3 w-3" />
          Live
        </span>
      </div>

      <div className="relative mb-4 overflow-hidden rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-5 dark:border-white/5 dark:bg-[#090c13]">
        <div className={`absolute inset-0 rounded-[20px] bg-gradient-to-br ${palette.gradient} opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.14] dark:opacity-[0.08] dark:group-hover:opacity-[0.16]`} />
        <div className="absolute inset-y-0 -left-1/3 w-1/2 skew-x-[-20deg] bg-white/25 opacity-0 blur-xl transition-all duration-500 group-hover:left-full group-hover:opacity-100 dark:bg-cyan-300/10" />
        <div className="relative flex items-center justify-center">
          <div className={`absolute h-28 w-28 rounded-full bg-gradient-to-br ${palette.gradient} opacity-25 blur-xl transition-all duration-300 group-hover:h-32 group-hover:w-32 group-hover:opacity-35`} />
          <div className="relative h-28 w-28 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 group-hover:-translate-y-1 group-hover:rotate-[2deg] group-hover:shadow-[0_18px_35px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.4)] dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:group-hover:shadow-[0_18px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <img
              src={meterImages.idle}
              alt={`${palette.label} default`}
              className="absolute inset-0 h-full w-full scale-[1.08] object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-0"
            />
            <img
              src={meterImages.hover}
              alt={`${palette.label} hover`}
              className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-0 transition-all duration-300 group-hover:scale-[1.16] group-hover:opacity-100"
            />
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3 dark:border-white/5 dark:bg-[#090c13]">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-50">
            {safeUsage.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="mb-1 text-xs font-mono text-slate-500 dark:text-slate-500">{displayUnit}</span>
        </div>
      </div>

      <div className="mb-3 flex items-end justify-between gap-3">
        <p className={`text-base font-semibold ${palette.text}`}>
          PHP {safeCost.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-600">
          {safeTrend >= 0 ? '+' : '-'}{Math.abs(safeTrend).toFixed(1)}%
        </p>
      </div>

      <div className="flex items-end gap-2">
        {bars.map((height, index) => (
          <div
            key={`${normalizedType}-${index}`}
            className="group/bar relative flex flex-1 flex-col items-center gap-1.5"
            title={`${BAR_LABELS[index]}: ${barValues[index].toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${displayUnit}`}
            aria-label={`${BAR_LABELS[index]} consumption ${barValues[index].toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${displayUnit}`}
          >
            <div
              className={`w-full rounded-md bg-gradient-to-t ${palette.gradient} opacity-90 transition-all duration-300 group-hover:opacity-100`}
              style={{ height: Math.max(34, Math.round(height * 0.82)) }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-700 shadow-lg group-hover/bar:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <span className="whitespace-nowrap">
                {BAR_LABELS[index]}: {barValues[index].toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} {displayUnit}
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-600 dark:text-slate-600">
              {BAR_LABELS[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
