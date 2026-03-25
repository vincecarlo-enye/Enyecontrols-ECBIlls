/**
 * pages/superadmin/BillingRates.jsx
 * Super Admin — full billing rates management with history log.
 */
import { useState } from 'react'
import { Zap, Droplets, Flame, Save, Shield, History, Check, X, Plus, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'

const TYPE_CONFIG = {
  electricity: { label: 'Electricity', icon: Zap,      color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/50', gradient: 'from-amber-400 to-orange-500', bar: 'bg-amber-400', defaultUnit: 'per kWh' },
  water:       { label: 'Water',        icon: Droplets, color: 'text-cyan-500',  bg: 'bg-cyan-50 dark:bg-cyan-900/20',   border: 'border-cyan-200 dark:border-cyan-700/50',   gradient: 'from-cyan-400 to-blue-500',    bar: 'bg-cyan-400',  defaultUnit: 'per m³'  },
  thermal:     { label: 'Thermal',      icon: Flame,    color: 'text-rose-500',  bg: 'bg-rose-50 dark:bg-rose-900/20',   border: 'border-rose-200 dark:border-rose-700/50',   gradient: 'from-rose-400 to-pink-500',    bar: 'bg-rose-400',  defaultUnit: 'per kBTU/h' },
}

const handleVatSave = (newRate) => {
  const old = vatRate
  updateVatRate(newRate)

  setLog(prev => [{
    id: Date.now(),
    type: 'vat',
    oldRate: old * 100,
    newRate: newRate * 100,
    changedBy: user?.name || 'Super Admin',
    changedAt: new Date().toLocaleString('en-PH'),
  }, ...prev.slice(0, 9)])
}

function VatEditCard({ vatRate, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState((vatRate * 100).toFixed(2))

  const handleSave = () => {
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed >= 0) {
      onSave(parsed / 100) // convert % to decimal
      setEditing(false)
    }
  }

  const handleCancel = () => {
    setVal((vatRate * 100).toFixed(2))
    setEditing(false)
  }

  return (
    <div className="glass rounded-2xl p-5 shadow-lg border border-violet-200 dark:border-violet-700/50 bg-violet-50 dark:bg-violet-900/20 animate-in">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-sm">VAT</span>
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-all"
          >
            Edit VAT
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={handleCancel} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">
        VAT Rate
      </p>

      {editing ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            step="0.01"
            min="0"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="text-xl font-bold bg-transparent border-b-2 border-blue-500 text-slate-800 dark:text-white outline-none w-24"
          />
          <span className="text-slate-500 font-semibold">%</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-bold text-slate-800 dark:text-white">
            {parseFloat(val).toFixed(2)}
          </span>
          <span className="text-xs font-mono text-slate-400">%</span>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Applied to vatable charges in all billing calculations.
      </p>
    </div>
  )
}

function RateEditCard({ type, rate, unit, completeness, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(rate.toFixed(2))
  const [unitVal, setUnitVal] = useState(unit)
  const cfg = TYPE_CONFIG[type]
  const Icon = cfg.icon

  const handleSave = () => {
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed > 0) { onSave(type, { rate: parsed, unit: unitVal }); setEditing(false) }
  }
  const handleCancel = () => { setVal(rate.toFixed(2)); setUnitVal(unit); setEditing(false) }

  return (
    <div className={`glass rounded-2xl p-5 shadow-lg border ${cfg.border} ${cfg.bg} animate-in`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2}/>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-all">
            Edit Rate
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"><Check className="w-4 h-4"/></button>
            <button onClick={handleCancel} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"><X className="w-4 h-4"/></button>
          </div>
        )}
      </div>

      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">{cfg.label} Rate</p>

      {editing ? (
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Rate (₱)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">₱</span>
              <input
  type="number"
  step="0.01"
  min="0"
  value={val}
  onChange={e => setVal(e.target.value)}
  autoFocus
  className="
    flex-1
    w-full
    max-w-xs
    sm:max-w-sm
    md:max-w-md
    text-xl
    font-display
    font-bold
    bg-transparent
    border-b-2
    border-blue-500
    text-slate-800
    dark:text-white
    outline-none
    pb-0.5
  "
/>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Unit label</label>
            <input type="text" value={unitVal} onChange={e => setUnitVal(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400"/>
          </div>
        </div>
      ) : (
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-display font-700 text-slate-800 dark:text-white">₱{parseFloat(val).toFixed(2)}</span>
          <span className="text-xs font-mono text-slate-400">{unitVal}</span>
        </div>
      )}

      <p className="text-xs font-mono text-slate-400 mb-3">Usage × Rate = Charge</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Setup progress</span>
          <span className={`font-semibold ${cfg.color}`}>{completeness}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${cfg.bar} rounded-full transition-all duration-700`} style={{ width: `${completeness}%` }}/>
        </div>
      </div>
    </div>
  )
}

export default function BillingRates() {
  const loading = usePageLoader(600)
  const { billingRates, updateBillingRate, vatRate, updateVatRate, addToast } = useApp()
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const [log, setLog] = useState([])

  if (loading) return <DashboardSkeleton />
  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Zap className="w-12 h-12 text-slate-300 mb-4"/>
      <p className="text-lg font-semibold text-slate-500">Access Denied</p>
      <p className="text-sm text-slate-400 mt-1">Billing rate management is only available to Super Admins.</p>
    </div>
  )

  const handleSave = (type, data) => {
    const old = billingRates[type]
    updateBillingRate(type, data)
    setLog(prev => [{
      id: Date.now(), type, oldRate: old.rate, newRate: data.rate,
      changedBy: user?.name || 'Super Admin',
      changedAt: new Date().toLocaleString('en-PH'),
    }, ...prev.slice(0, 9)])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-700 text-2xl text-slate-800 dark:text-white">Billing Rates Management</h2>
            <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <Shield className="w-2.5 h-2.5 mr-1"/>Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Set electricity, water, and thermal energy rates — changes propagate immediately to all dashboards</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50">
        <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">Changes made here propagate immediately to Admin, Finance, Facility Manager, Tenant dashboards, and all billing calculations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['electricity','water','thermal'].map(type => (
          <RateEditCard key={type} type={type}
            rate={billingRates[type]?.rate || 0}
            unit={billingRates[type]?.unit || ''}
            completeness={billingRates[type]?.completeness || 0}
            onSave={handleSave}
          />
        ))}
      </div>
      {/* VAT Configuration */}
<div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
  <VatEditCard vatRate={vatRate || 0.12} onSave={handleVatSave} />
</div>

      {/* Change log */}
      {log.length > 0 && (
        <div className="glass rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-slate-400"/>
            <h3 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">Recent Rate Changes</h3>
          </div>
          <div className="space-y-2">
            {log.map(entry => {
              const cfg = TYPE_CONFIG[entry.type] || { color: 'text-violet-500' }
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold capitalize ${cfg.color}`}>
  {entry.type === 'vat' ? 'VAT' : entry.type}
</span>
                    <span className="text-slate-400">₱{entry.oldRate.toFixed(2)} → <span className="text-emerald-600 font-semibold">₱{entry.newRate.toFixed(2)}</span></span>
                  </div>
                  <div className="text-xs text-slate-400">{entry.changedBy} · {entry.changedAt}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
