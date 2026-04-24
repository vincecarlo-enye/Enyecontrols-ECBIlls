import { normalizeUtilityShort } from '@/utils/utilityTypes'
import { TrendingDown, TrendingUp, Zap, Droplets, Flame } from 'lucide-react'
import electricityMeterBefore from '@/assets/meters/electricity_b4.png'
import electricityMeter from '@/assets/meters/electricity.png'
import waterMeterBefore from '@/assets/meters/water_b4.png'
import waterMeter from '@/assets/meters/water.png'
import thermalMeterBefore from '@/assets/meters/thermal_b4.png'
import thermalMeter from '@/assets/meters/thermal.png'
import { formatPeso } from '@/utils/filterUtils'
import { Loader2 } from 'lucide-react'


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
    label: 'Electric Meter',
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
    valueUnit: 'kBTU',
    label: 'Thermal Energy',
    description: 'Thermal energy monitoring',
  },
}

function toNumber(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const BAR_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/**
 * Shorten a bar label to fit the narrow sparkline width without producing
 * nonsense like "WEE" from "Week 1".
 *
 * Rules (applied in order):
 *  1. "Week N"  → "W{N}"   (e.g. "Week 1" → "W1")
 *  2. "Q{N}"    → kept as-is (already short)
 *  3. 3-letter month abbrevs (Jan…Dec) → kept as-is
 *  4. Weekday names (Monday…Sunday, Mon…Sun) → first 3 chars
 *  5. Anything else ≤ 4 chars → kept as-is uppercased
 *  6. Fallback → first 3 chars uppercased
 */
function shortenBarLabel(raw) {
  const s = String(raw ?? '').trim()

  // "Week 1", "Week 2", …
  const weekMatch = s.match(/^[Ww]eek\s*(\d+)$/)
  if (weekMatch) return `W${weekMatch[1]}`

  // "Q1" … "Q4" — already short
  if (/^Q\d$/i.test(s)) return s.toUpperCase()

  // 3-letter month abbreviations
  if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i.test(s)) {
    return s.slice(0, 3).toUpperCase()
  }

  // Weekday names (full or abbreviated)
  if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(s)) {
    return s.slice(0, 3).toUpperCase()
  }

  // Short labels (≤ 4 chars) — keep as-is
  if (s.length <= 4) return s.toUpperCase()

  // Generic fallback — first 3 chars
  return s.slice(0, 3).toUpperCase()
}

function buildChartBars(series = [], safeUsage = 0) {
  if (Array.isArray(series) && series.length > 0) {
    return series.slice(-7).map((entry, index) => {
      const rawValue = toNumber(entry?.value ?? entry?.usage)
      const rawLabel = entry?.label ?? entry?.day ?? entry?.date ?? `P${index + 1}`
      const label = shortenBarLabel(rawLabel)

      return {
        label,
        value: rawValue,
      }
    })
  }

  const fallbackHeights = safeUsage > 0
    ? [54, 48, 66, 44, 50, 68, 56]
    : [0, 0, 0, 0, 0, 0, 0]

  return fallbackHeights.map((height, index) => ({
    label: BAR_LABELS[index],
    value: Number((safeUsage * (height / 100)).toFixed(2)),
  }))
}

export default function UtilityCard({
  type,
  usage = 0,
  value,
  unit = '',
  estimatedCost = 0,
  cost,
  currentRate = 0,
  trend = 0,
  delta,
  series = [],
  loading = false,
  updating = false,
}) {
  const normalizedType = normalizeUtilityShort(type)
  const meterImages = imageMap[normalizedType]
  const Icon = iconMap[normalizedType]
  const palette = colorMap[normalizedType]
  const safeUsage = toNumber(usage ?? value)
  const safeCost = toNumber(estimatedCost ?? cost)
  const safeRate = toNumber(currentRate)
  const safeTrend = toNumber(trend ?? delta)
  const TrendIcon = safeTrend >= 0 ? TrendingUp : TrendingDown
  const displayUnit = unit || palette.valueUnit
  const chartBars = buildChartBars(series, safeUsage)
  const maxBarValue = Math.max(...chartBars.map((entry) => entry.value), 0)

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
          {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendIcon className="h-3 w-3" />}
          {updating ? 'Updating...' : 'Live'}
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
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-50">
              {safeUsage.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
          <span className="mb-1 text-xs font-mono text-slate-500 dark:text-slate-500">{displayUnit}</span>
        </div>
      </div>

      <div className="mb-3 flex items-end justify-between gap-3">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <p className={`text-base font-semibold ${palette.text}`}>
            PHP {safeCost.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-600">
          {safeTrend >= 0 ? '+' : '-'}{Math.abs(safeTrend).toFixed(1)}%
        </p>
      </div>

      <div className="flex items-end gap-2">
        {chartBars.map((entry, index) => {
          const height = maxBarValue > 0
            ? Math.max(34, Math.round((entry.value / maxBarValue) * 56))
            : 34
          const isFirstBar = index === 0
          const isLastBar = index === chartBars.length - 1
          const estimatedBarCost = safeRate > 0
            ? entry.value * safeRate
            : safeUsage > 0 && safeCost > 0
              ? (entry.value / safeUsage) * safeCost
              : 0
          const formattedUsage = entry.value.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          const formattedCost = formatPeso(estimatedBarCost)

          return (
          <div
            key={`${normalizedType}-${entry.label}-${index}`}
            className="group/bar relative flex flex-1 flex-col items-center gap-1.5"
            title={`${entry.label}: ${formattedUsage} ${displayUnit} • ${formattedCost}`}
            aria-label={`${entry.label} consumption ${formattedUsage} ${displayUnit}, estimated price ${formattedCost}`}
          >
            <div
              className={`w-full rounded-md bg-gradient-to-t ${palette.gradient} opacity-90 transition-all duration-300 group-hover:opacity-100`}
              style={{ height }}
            />
            <div
              className={[
                'pointer-events-none absolute bottom-full z-10 mb-2 hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-700 shadow-lg group-hover/bar:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                isFirstBar
                  ? 'left-0'
                  : isLastBar
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2',
              ].join(' ')}
            >
              <div className="space-y-0.5">
                <p className="whitespace-nowrap">
                  {entry.label}: {formattedUsage} {displayUnit}
                </p>
                <p className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                  Est. price: {formattedCost}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono text-slate-600 dark:text-slate-600">
              {entry.label}
            </span>
          </div>
          )
        })}
      </div>
    </div>
  )
}
