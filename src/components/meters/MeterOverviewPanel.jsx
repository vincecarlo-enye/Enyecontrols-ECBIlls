/**
 * MeterOverviewPanel
 * Read-only meter overview panel shown in Facility Manager and Admin views.
 * Super Admin can use this as a quick summary; Facility Manager sees meter statuses.
 */
import { Zap, Droplets, Flame, CheckCircle, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'

const TYPE_CONFIG = {
  electric: { label: 'Electric', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/40' },
  water:    { label: 'Water',    icon: Droplets, color: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-700/40'  },
  thermal:  { label: 'Thermal',  icon: Flame,    color: 'text-rose-500',  bg: 'bg-rose-50 dark:bg-rose-900/20',  border: 'border-rose-200 dark:border-rose-700/40'  },
}

export default function MeterOverviewPanel({ compact = false }) {
  const { meters } = useApp()

  const active = meters.filter(m => m.status === 'active').length
  const total = meters.length
  const byType = Object.entries(TYPE_CONFIG).map(([type, cfg]) => ({
    ...cfg,
    type,
    count: meters.filter(m => m.type === type).length,
  }))

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {byType.map(t => {
          const Icon = t.icon
          return (
            <div key={t.type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${t.border} ${t.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${t.color}`} />
              <span className={`text-xs font-semibold ${t.color}`}>{t.count}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t.label}</span>
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Utility Meters</h3>
          <p className="text-xs text-slate-400 mt-0.5">All registered meters across units</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          {active}/{total} Active
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {byType.map(t => {
          const Icon = t.icon
          return (
            <div key={t.type} className={`p-3 rounded-xl border ${t.border} ${t.bg} text-center`}>
              <Icon className={`w-5 h-5 ${t.color} mx-auto mb-1`} />
              <p className={`text-xl font-display font-700 ${t.color}`}>{t.count}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.label}</p>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {meters.slice(0, 8).map(m => {
          const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.electric
          const Icon = cfg.icon
          return (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${cfg.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.meterName}</p>
                  <p className="text-[10px] text-slate-400">{m.unit}{m.tenant ? ` · ${m.tenant}` : ' · Vacant'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                m.status === 'active'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : m.status === 'maintenance'
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-700/40 text-slate-500'
              }`}>
                {m.status}
              </span>
            </div>
          )
        })}
        {meters.length > 8 && (
          <p className="text-xs text-slate-400 text-center pt-1">+{meters.length - 8} more meters</p>
        )}
      </div>
    </div>
  )
}
