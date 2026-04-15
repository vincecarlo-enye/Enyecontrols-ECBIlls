import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 shadow-xl border border-slate-200/60 dark:border-slate-700/50 text-sm">
        <p className="text-xs font-mono text-slate-400 mb-1">{label}</p>
        <p className="font-semibold" style={{ color }}>
          {payload[0].value.toLocaleString()} {unit}
        </p>
      </div>
    )
  }
  return null
}

export default function DailyUsageChart({ title, data, dataKey, unit, color, gradientId, trend }) {
  const safeData = Array.isArray(data) ? data : []
  const values = safeData
    .map((entry) => Number(entry?.[dataKey] ?? 0))
    .filter((value) => Number.isFinite(value))
  const avg = values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length) : 0
  const max = values.length ? Math.max(...values) : 0
  const latest = values.length ? values[values.length - 1] : 0
  const isPositive = trend > 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="glass rounded-2xl p-5 card-hover shadow-lg animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-display font-700 text-slate-800 dark:text-white">
            {latest.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 1,
            })} <span className="text-sm font-mono font-normal text-slate-400">{unit}</span>
          </p>
          <p className="text-xs text-slate-400">latest day</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: color + '15' }}>
          <TrendIcon className="w-3 h-3" style={{ color }} />
          <span className="text-xs font-medium" style={{ color }}>{Math.abs(trend)}% vs last week</span>
        </div>
        <div className="text-xs text-slate-400">
          7d avg: <span className="font-semibold text-slate-600 dark:text-slate-300">{avg.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })} {unit}</span>
        </div>
        <div className="text-xs text-slate-400">
          Peak: <span className="font-semibold text-slate-600 dark:text-slate-300">{max.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })} {unit}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={safeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono' }}
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
            dot={{ fill: color, strokeWidth: 2, r: 4, stroke: '#fff' }}
            activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
