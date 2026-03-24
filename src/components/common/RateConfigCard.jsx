/**
 * components/common/RateConfigCard.jsx
 * Billing rate cards.
 * Super Admin: full edit. All others: view-only.
 */
import { useState } from 'react'
import { Edit3, Check, X, Zap, Flame, Droplets, Lock } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useApp } from '@/context/AppContext'

const config = {
  electricity: { label: 'Electricity Rate', icon: Zap,      color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', gradient: 'from-amber-400 to-orange-500', formula: 'Usage × Rate = Charge', barColor: 'bg-amber-400' },
  water:       { label: 'Water Rate',        icon: Droplets, color: 'text-cyan-500',  bg: 'bg-cyan-50 dark:bg-cyan-900/20',   gradient: 'from-cyan-400 to-blue-500',    formula: 'Usage × Rate = Charge', barColor: 'bg-cyan-400'  },
  thermal:     { label: 'Thermal Rate',      icon: Flame,    color: 'text-rose-500',  bg: 'bg-rose-50 dark:bg-rose-900/20',   gradient: 'from-rose-400 to-pink-500',    formula: 'kBTU/h × Rate = Charge', barColor: 'bg-rose-400' },
}

function RateCard({ type, rate, unit, completeness, canEdit, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(rate.toFixed(2))
  const cfg = config[type]
  const Icon = cfg.icon

  const handleSave = () => {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed > 0) { onSave(type, parsed); setEditing(false) }
  }
  const handleCancel = () => { setValue(rate.toFixed(2)); setEditing(false) }

  return (
    <div className="glass rounded-2xl p-5 card-hover shadow-lg animate-in">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md`}>
          <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2} />
        </div>
        {canEdit ? (
          <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all" title="Edit rate">
            <Edit3 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/40" title="View only — Super Admin manages rates">
            <Lock className="w-3 h-3 text-slate-400" />
            {/* <span className="text-[10px] font-mono text-slate-400 uppercase">View only</span> */}
          </div>
        )}
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{cfg.label}</p>
      {editing && canEdit ? (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">₱</span>
          <input type="number" step="0.01" min="0" value={value} onChange={e => setValue(e.target.value)}
            className="flex-1 min-w-0 text-xl font-display font-700 bg-transparent border-b-2 border-blue-500 text-slate-800 dark:text-white outline-none pb-0.5" autoFocus />
          <button onClick={handleSave} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={handleCancel} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-display font-700 text-slate-800 dark:text-white">₱{parseFloat(value).toFixed(2)}</span>
          <span className="text-xs font-mono text-slate-400">{unit}</span>
        </div>
      )}
      <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-3">{cfg.formula}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Setup progress</span>
          <span className={`font-semibold ${cfg.color}`}>{completeness}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${cfg.barColor} rounded-full transition-all duration-700`} style={{ width: `${completeness}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function RateConfigCard({ rates: propRates }) {
  const { can } = usePermissions()
  const { billingRates, updateBillingRate, updateAllRates } = useApp()
  const canEdit = can('rates:edit')
  // Use live billingRates from context, fallback to props
  const rates = billingRates || propRates

  const handleSave = (type, newRate) => { updateBillingRate(type, { rate: newRate }) }
  const handleSaveAll = () => { updateAllRates(rates) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-700 text-[16px] text-slate-800 dark:text-white">Current Rate </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {canEdit ? 'Configure billing rates per utility type' : 'Current billing rates (read-only — managed by Super Admin)'}
          </p>
        </div>
        {canEdit && (
          <button onClick={handleSaveAll} className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
            Save All
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RateCard type="electricity" rate={rates.electricity.rate} unit={rates.electricity.unit} completeness={rates.electricity.completeness} canEdit={canEdit} onSave={handleSave} />
        <RateCard type="water"       rate={rates.water.rate}       unit={rates.water.unit}       completeness={rates.water.completeness}       canEdit={canEdit} onSave={handleSave} />
        <RateCard type="thermal"     rate={rates.thermal.rate}     unit={rates.thermal.unit}     completeness={rates.thermal.completeness}     canEdit={canEdit} onSave={handleSave} />
      </div>
    </div>
  )
}
