import { useMemo } from 'react'
import { Zap, Droplets, Flame, CheckCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMeterOverviewData } from '@/hooks/adminHooks/useMeterOverviewData'

const TYPE_CONFIG = {
  electric: {
    label: 'Electric',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700/40',
  },
  water: {
    label: 'Water',
    icon: Droplets,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700/40',
  },
  thermal: {
    label: 'Thermal',
    icon: Flame,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-700/40',
  },
}

export default function MeterOverviewPanel({ compact = false, meters: providedMeters = null }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { meters: overviewMeters } = useMeterOverviewData()
  const meters = Array.isArray(providedMeters) ? providedMeters : overviewMeters
  const meterManagementPath = location.pathname.startsWith('/super-admin')
    ? '/super-admin/meters'
    : location.pathname.startsWith('/finance')
      ? '/finance/utility-meters'
      : '/admin/meters'

  const byType = useMemo(() => {
    return Object.entries(TYPE_CONFIG).map(([type, config]) => ({
      ...config,
      type,
      count: meters.filter((meter) => meter.type === type).length,
    }))
  }, [meters])

  const active = meters.filter((meter) => String(meter.status || '').toLowerCase() === 'active').length
  const total = meters.length

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {byType.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${item.border} ${item.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className={`text-xs font-semibold ${item.color}`}>{item.count}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
            </div>
          )
        })}
        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{active}/{total} active</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 h-full border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Utility Meters</h3>
          <p className="text-xs text-slate-400 mt-0.5">Building-wide meter overview across all assigned units</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          {active}/{total} Active
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {byType.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.type} className={`p-3 rounded-xl border ${item.border} ${item.bg} text-center`}>
              <Icon className={`w-5 h-5 ${item.color} mx-auto mb-1`} />
              <p className={`text-xl font-display font-700 ${item.color}`}>{item.count}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {meters.slice(0, 8).map((meter) => {
          const config = TYPE_CONFIG[meter.type] || TYPE_CONFIG.electric
          const Icon = config.icon

          return (
            <div key={meter.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${config.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{meter.meterName}</p>
                  <p className="text-[10px] text-slate-400">{meter.unit || 'No unit'}{meter.tenant ? ` - ${meter.tenant}` : ' - Unassigned'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                meter.status === 'active'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : meter.status === 'maintenance'
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-700/40 text-slate-500'
              }`}>
                {meter.status}
              </span>
            </div>
          )
        })}
        {meters.length > 8 && (
          <button
            type="button"
            onClick={() => navigate(meterManagementPath)}
            className="mx-auto block pt-1 text-xs font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            +{meters.length - 8} more meters
          </button>
        )}
      </div>
    </div>
  )
}
