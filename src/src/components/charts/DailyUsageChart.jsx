import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import ChartExportButton from '@/components/common/ChartExportButton'

function CustomTooltip({ active, payload, label, unit, color }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-xl dark:border-cyan-500/15 dark:bg-[#0b1018]/95">
      <p className="mb-1 text-xs font-mono text-slate-500 dark:text-slate-500">{label}</p>
      <p className="font-semibold" style={{ color }}>
        {Number(payload[0].value || 0).toLocaleString()} {unit}
      </p>
    </div>
  )
}

export default function DailyUsageChart({ title, data = [], dataKey, unit, color, gradientId, trend = 0 }) {
  const safeData = Array.isArray(data) ? data : []
  const average = safeData.length
    ? (safeData.reduce((sum, item) => sum + Number(item?.[dataKey] || 0), 0) / safeData.length).toFixed(1)
    : '0.0'
  const peak = safeData.length ? Math.max(...safeData.map((item) => Number(item?.[dataKey] || 0))) : 0
  const TrendIcon = Number(trend) >= 0 ? TrendingUp : TrendingDown

  return (
    <div data-chart-export-panel="true" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">Last 7 days</p>
        </div>

        <div className="flex items-start gap-2">
          <div className="text-right">
            <p className="text-xl font-bold text-slate-800 dark:text-slate-50">
              {average} <span className="text-sm font-mono font-normal text-slate-500 dark:text-slate-500">{unit}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">avg/day</p>
          </div>
          <ChartExportButton title={title} rows={safeData} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-white/6 dark:bg-white/5">
          <TrendIcon className="h-3 w-3" style={{ color }} />
          <span className="text-[11px] font-medium" style={{ color }}>
            {Math.abs(Number(trend)).toFixed(1)}% vs last week
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-500">
          Peak: <span className="font-semibold text-slate-700 dark:text-slate-300">{peak} {unit}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={safeData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Consolas, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Consolas, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ fill: color, strokeWidth: 2, r: 3.5, stroke: '#0b1018' }}
            activeDot={{ r: 5, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
