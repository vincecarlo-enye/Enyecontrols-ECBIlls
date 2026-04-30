import { memo } from 'react'

export const CHART_AXIS_TICK = {
  fontSize: 10,
  fill: '#64748b',
  fontFamily: 'Consolas, monospace',
}

export const CHART_AXIS_TICK_SM = {
  fontSize: 11,
  fill: '#94a3b8',
}

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'rgba(148,163,184,0.16)',
}

export const CHART_GRID_PROPS_LIGHT = {
  strokeDasharray: '3 3',
  stroke: '#e2e8f0',
  strokeOpacity: 0.5,
}

export const CHART_MARGIN_COMPACT = { top: 8, right: 8, left: -10, bottom: 0 }
export const CHART_MARGIN_STANDARD = { top: 5, right: 10, left: 10, bottom: 0 }

export function formatChartNumber(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatChartCurrency(value) {
  return `PHP ${formatChartNumber(value)}`
}

export function formatCompactChartCurrency(value) {
  const amount = Number(value || 0)
  const abs = Math.abs(amount)
  return abs >= 1000
    ? `PHP ${(amount / 1000).toFixed(0)}K`
    : `PHP ${amount.toLocaleString('en-PH')}`
}

export const ThemedChartTooltip = memo(function ThemedChartTooltip({
  active,
  payload,
  label,
  formatter,
  isDark = false,
  constrainToViewBox = false,
  coordinate,
  viewBox,
  estimatedWidth = 170,
}) {
  if (!active || !payload?.length) return null

  let tooltipTransform = undefined

  if (constrainToViewBox && coordinate && viewBox) {
    const pointerX = Number(coordinate?.x ?? 0)
    const chartLeft = Number(viewBox?.x ?? 0)
    const chartRight = chartLeft + Number(viewBox?.width ?? 0)
    const halfWidth = estimatedWidth / 2
    const edgePadding = 12

    if (pointerX - halfWidth <= chartLeft + edgePadding) {
      tooltipTransform = 'translateX(0)'
    } else if (pointerX + halfWidth >= chartRight - edgePadding) {
      tooltipTransform = 'translateX(calc(-100% + 12px))'
    } else {
      tooltipTransform = 'translateX(-50%)'
    }
  }

  return (
    <div
      className={[
        'min-w-[150px] rounded-xl border px-3 py-2 shadow-xl',
        isDark
          ? 'border-cyan-400/20 bg-slate-950 text-slate-100'
          : 'border-slate-200 bg-white text-slate-900',
      ].join(' ')}
      style={tooltipTransform ? { transform: tooltipTransform } : undefined}
    >
      {label ? (
        <div className={`mb-1 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {label}
        </div>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const result = formatter ? formatter(entry?.value, entry?.name) : entry?.value
          const value = Array.isArray(result) ? result[0] : result
          const name = Array.isArray(result) ? result[1] : entry?.name

          return (
            <div key={`${entry?.name}-${entry?.dataKey}`} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry?.color || entry?.payload?.fill }} />
                <span className={isDark ? 'text-slate-200' : 'text-slate-600'}>{name}</span>
              </div>
              <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
