import { useState } from 'react'
import { normalizeUtilityShort } from '@/utils/utilityTypes'
import {
  Droplets,
  Flame,
  Loader2,
  Maximize2,
  Minimize2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import powerMeterModel from '@/assets/meters/power meter.glb'
import waterMeterModel from '@/assets/meters/woltman_watermeter.glb'
import thermalMeterModel from '@/assets/meters/BTU_new.glb'
import { formatPeso } from '@/utils/filterUtils'
import MeterModelPreview from './MeterModelPreview'

const modelMap = {
  electric: {
    src: powerMeterModel,
    rotation: [0.05, -0.35, 0],
  },
  water: {
    src: waterMeterModel,
    rotation: [0, -0.2, 0],
  },
  thermal: {
    src: thermalMeterModel,
    rotation: [0.02, -0.35, 0],
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

const BAR_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function toNumber(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function shortenBarLabel(raw) {
  const s = String(raw ?? '').trim()
  const weekMatch = s.match(/^[Ww]eek\s*(\d+)$/)

  if (weekMatch) return `W${weekMatch[1]}`
  if (/^Q\d$/i.test(s)) return s.toUpperCase()
  if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i.test(s)) return s.slice(0, 3).toUpperCase()
  if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(s)) return s.slice(0, 3).toUpperCase()
  if (s.length <= 4) return s.toUpperCase()

  return s.slice(0, 3).toUpperCase()
}

function buildChartBars(series = [], safeUsage = 0) {
  if (Array.isArray(series) && series.length > 0) {
    return series.slice(-7).map((entry, index) => ({
      label: shortenBarLabel(entry?.label ?? entry?.day ?? entry?.date ?? `P${index + 1}`),
      value: toNumber(entry?.value ?? entry?.usage),
    }))
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
  const [modelExpanded, setModelExpanded] = useState(false)
  const normalizedType = normalizeUtilityShort(type)
  const meterModel = modelMap[normalizedType] || modelMap.electric
  const Icon = iconMap[normalizedType] || iconMap.electric
  const palette = colorMap[normalizedType] || colorMap.electric
  const safeUsage = toNumber(usage ?? value)
  const safeCost = toNumber(estimatedCost ?? cost)
  const safeRate = toNumber(currentRate)
  const safeTrend = toNumber(trend ?? delta)
  const TrendIcon = safeTrend >= 0 ? TrendingUp : TrendingDown
  const displayUnit = unit || palette.valueUnit
  const chartBars = buildChartBars(series, safeUsage)
  const maxBarValue = Math.max(...chartBars.map((entry) => entry.value), 0)
  const ToggleModelIcon = modelExpanded ? Minimize2 : Maximize2

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 dark:border-cyan-500/15 dark:bg-[#0d1118]/95 dark:shadow-[0_0_0_1px_rgba(6,182,212,0.06),0_18px_50px_rgba(0,0,0,0.35)] ${modelExpanded ? 'min-h-[430px]' : ''}`}>
      <div className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r ${palette.gradient} opacity-80`} />

      {!modelExpanded && (
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
      )}

      <div className={`relative overflow-hidden rounded-[18px] bg-slate-50 transition-all duration-300 dark:bg-[#090c13] ${modelExpanded ? 'mb-0 min-h-[398px] flex-1' : 'mb-4 h-44'}`}>
        <div
  className={`absolute inset-0 bg-gradient-to-br ${palette.gradient} opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.12] dark:opacity-[0.10] dark:group-hover:opacity-[0.18]`}
/>
        <div
  className={`absolute inset-x-6 bottom-3 h-16 rounded-full bg-gradient-to-br ${palette.gradient} opacity-10 blur-2xl transition-all duration-300 group-hover:inset-x-3 group-hover:opacity-20 dark:opacity-20 dark:group-hover:opacity-30`}
/>
        <button
          type="button"
          onClick={() => setModelExpanded((current) => !current)}
          aria-label={modelExpanded ? `Minimize ${palette.label} model` : `Expand ${palette.label} model`}
          title={modelExpanded ? 'Minimize' : 'Full screen'}
          className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-slate-950/75 dark:text-slate-300 dark:hover:text-white"
        >
          <ToggleModelIcon className="h-4 w-4" />
        </button>
        <div className="relative h-full transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04]">
          <MeterModelPreview
            src={meterModel.src}
            label={`${palette.label} 3D model`}
            rotation={meterModel.rotation}
            fitMargin={modelExpanded ? 1.05 : 0.72}
          />
        </div>
      </div>

      {!modelExpanded && (
        <>
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
                  title={`${entry.label}: ${formattedUsage} ${displayUnit} - ${formattedCost}`}
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
        </>
      )}
    </div>
  )
}
