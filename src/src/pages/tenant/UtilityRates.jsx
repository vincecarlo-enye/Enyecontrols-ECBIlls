import { formatDate } from '@/utils/filterUtils'
/**
 * pages/tenant/UtilityRates.jsx
 * Tenant view of utility rates from backend, always read-only.
 */
import { Zap, Flame, Droplets, Lock } from 'lucide-react'
import { LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'
import useTenantRates from '@/hooks/tenantHooks/useTenantRates'
import { useRateHistory } from '@/hooks/common/useRateHistory'
import RateHistoryPanel from '@/components/common/RateHistoryPanel'

const config = {
  electricity: {
    label: 'Electricity Rate',
    icon: Zap,
    gradient: 'from-amber-400 to-orange-500',
    formula: 'Usage × Rate = Charge',
  },
  water: {
    label: 'Water Rate',
    icon: Droplets,
    gradient: 'from-cyan-400 to-blue-500',
    formula: 'Usage × Rate = Charge',
  },
  thermal: {
    label: 'Thermal Rate',
    icon: Flame,
    gradient: 'from-rose-400 to-pink-500',
    formula: 'Usage × Rate = Charge',
  },
}


function RateViewCard({ type, rate, unit, effectiveFrom, description, loading = false, updating = false }) {
  const cfg = config[type]
  const Icon = cfg.icon

  return (
    <div className="glass rounded-2xl p-5 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md`}>
          <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/40">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-mono text-slate-400 uppercase">View only</span>
        </div>
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">{cfg.label}</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-display font-700 text-slate-800 dark:text-white">₱{Number(rate || 0).toFixed(2)}</span>
        <span className="text-xs font-mono text-slate-400">{unit}</span>
      </div>
      <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{cfg.formula}</p>
      {effectiveFrom && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
          Effective: {formatDate(effectiveFrom)}
        </p>
      )}
      {description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      )}
    </div>
  )
}

export default function TenantUtilityRates() {
  const { rates, loading, error } = useTenantRates()
  const { history, loading: historyLoading } = useRateHistory()

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display font-700 text-[16px] text-slate-800 dark:text-white">Current Utility Rates</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">These are the rates used to compute your monthly billing</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RateViewCard
          type="electricity"
          rate={rates.electricity.rate}
          unit={rates.electricity.unit}
          effectiveFrom={rates.electricity.effectiveFrom}
          description={rates.electricity.description}
        />
        <RateViewCard
          type="water"
          rate={rates.water.rate}
          unit={rates.water.unit}
          effectiveFrom={rates.water.effectiveFrom}
          description={rates.water.description}
        />
        <RateViewCard
          type="thermal"
          rate={rates.thermal.rate}
          unit={rates.thermal.unit}
          effectiveFrom={rates.thermal.effectiveFrom}
          description={rates.thermal.description}
        />
      </div>

      <div className="mt-4">
        <RateHistoryPanel history={history} loading={historyLoading} compact />
      </div>

      {loading && (
        <p className="text-xs text-slate-400 mt-3">Loading utility rates...</p>
      )}
    </div>
  )
}
