import { formatPeso } from '@/utils/filterUtils'
import { useEffect, useState } from 'react'
import { Zap, Droplets, Flame, Shield, Check, X, AlertTriangle } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageLoader } from '@/hooks/usePageLoader'
import { LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'
import { useAdminRates } from '@/hooks/adminHooks/useAdminRates'
import { useRateHistory } from '@/hooks/common/useRateHistory'
import { useBillingPenaltyRule } from '@/hooks/useBillingPenaltyRule'
import RateHistoryPanel from '@/components/common/RateHistoryPanel'
import BillingPeriodLockPanel from '@/components/common/BillingPeriodLockPanel'

const TYPE_CONFIG = {
  electricity: { label: 'Electricity', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/50', gradient: 'from-amber-400 to-orange-500', bar: 'bg-amber-400', defaultUnit: 'per kWh' },
  water: { label: 'Water', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-700/50', gradient: 'from-cyan-400 to-blue-500', bar: 'bg-cyan-400', defaultUnit: 'per m3' },
  thermal: { label: 'Thermal', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700/50', gradient: 'from-rose-400 to-pink-500', bar: 'bg-rose-400', defaultUnit: 'per kBTU' },
}


function RateEditCard({ type, rate, unit, completeness, saving, onSave, loading = false, updating = false }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(Number(rate || 0).toFixed(2))
  const [unitVal, setUnitVal] = useState(unit || TYPE_CONFIG[type].defaultUnit)
  const cfg = TYPE_CONFIG[type]
  const Icon = cfg.icon

  useEffect(() => {
    if (editing) return
    setVal(Number(rate || 0).toFixed(2))
    setUnitVal(unit || TYPE_CONFIG[type].defaultUnit)
  }, [editing, rate, type, unit])

  const handleSave = async () => {
    const parsed = parseFloat(val)
    if (Number.isNaN(parsed) || parsed <= 0) return

    const result = await onSave(type, { rate: parsed, unit: unitVal })
    if (result?.success) {
      setEditing(false)
    }
  }

  const handleCancel = () => {
    setVal(Number(rate || 0).toFixed(2))
    setUnitVal(unit || cfg.defaultUnit)
    setEditing(false)
  }

  return (
    <div className={`glass rounded-2xl p-5 shadow-lg border ${cfg.border} ${cfg.bg} animate-in`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-all"
          >
            Edit Rate
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">{cfg.label} Rate</p>

      {editing ? (
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Rate (PHP)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">PHP</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                autoFocus
                className="flex-1 w-full max-w-xs sm:max-w-sm md:max-w-md text-xl font-display font-bold bg-transparent border-b-2 border-blue-500 text-slate-800 dark:text-white outline-none pb-0.5"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Unit label</label>
            <input
              type="text"
              value={unitVal}
              onChange={(e) => setUnitVal(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-baseline gap-1 mb-3">
          <LoadingValue loading={loading} updating={updating} value={formatPeso(val).replace('PHP ', '')} className="text-2xl font-display font-700 text-slate-800 dark:text-white" spinnerClassName="h-5 w-5 text-slate-400" />
          <span className="text-xs font-mono text-slate-400">{unitVal}</span>
        </div>
      )}

      <p className="text-xs font-mono text-slate-400 mb-3">Usage x Rate = Charge</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Setup progress</span>
          <span className={`font-semibold ${cfg.color}`}>{completeness}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${cfg.bar} rounded-full transition-all duration-700`} style={{ width: `${completeness}%` }} />
        </div>
      </div>
    </div>
  )
}

function PenaltyRuleCard({ rule, loading, saving, onSave }) {
  const [form, setForm] = useState({
    isEnabled: false,
    penaltyType: 'percentage',
    penaltyValue: 0,
    graceDays: 0,
    notes: '',
  })

  useEffect(() => {
    setForm({
      isEnabled: Boolean(rule?.isEnabled),
      penaltyType: rule?.penaltyType || 'percentage',
      penaltyValue: Number(rule?.penaltyValue ?? 0),
      graceDays: Number(rule?.graceDays ?? 0),
      notes: rule?.notes || '',
    })
  }, [rule])

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="glass animate-in rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-lg dark:border-amber-700/50 dark:bg-amber-900/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
            <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <p className="mb-1 text-xs font-mono uppercase tracking-widest text-slate-400">Late Fee Rule</p>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Penalty / Surcharge Settings</h3>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(event) => handleChange('isEnabled', event.target.checked)}
            disabled={loading || saving}
            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
          />
          Enabled
        </label>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Penalty type</label>
          <select
            value={form.penaltyType}
            onChange={(event) => handleChange('penaltyType', event.target.value)}
            disabled={loading || saving}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="percentage">Percentage of outstanding</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            {form.penaltyType === 'fixed' ? 'Fixed amount (PHP)' : 'Penalty rate (%)'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.penaltyValue}
            onChange={(event) => handleChange('penaltyValue', event.target.value)}
            disabled={loading || saving}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Grace days after due date</label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.graceDays}
            onChange={(event) => handleChange('graceDays', event.target.value)}
            disabled={loading || saving}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Internal note</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            disabled={loading || saving}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            placeholder="Example: Apply one-time late fee to unpaid balances after 5 grace days."
          />
        </div>

        <div className="rounded-xl border border-amber-200/70 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-amber-700/40 dark:bg-slate-900/40 dark:text-slate-300">
          {form.isEnabled ? (
            <>
              Bills that remain unpaid after <span className="font-semibold">{form.graceDays}</span> grace day(s)
              {' '}will get a{' '}
              <span className="font-semibold">
                {form.penaltyType === 'fixed'
                  ? `PHP ${Number(form.penaltyValue || 0).toFixed(2)}`
                  : `${Number(form.penaltyValue || 0).toFixed(2)}%`}
              </span>
              {' '}one-time surcharge.
            </>
          ) : (
            <>Penalty rules are currently disabled. Finance preview and apply actions will stay inactive until this is enabled.</>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onSave(form)}
            disabled={loading || saving}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Penalty Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BillingRates() {
  const pageLoading = usePageLoader(600)
  const { isSuperAdmin } = usePermissions()
  const { rates, rawRates, loading, saving, error, saveRate } = useAdminRates()
  const { history, loading: historyLoading, reload: reloadHistory } = useRateHistory()
  const {
    rule,
    loading: penaltyLoading,
    saving: penaltySaving,
    error: penaltyError,
    saveRule,
  } = useBillingPenaltyRule()
  const isInitialLoading = (pageLoading || loading) && Object.keys(rates || {}).length === 0 && !error
  const isRefreshing = !isInitialLoading && (loading || historyLoading || penaltyLoading)

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Zap className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-lg font-semibold text-slate-500">Access Denied</p>
        <p className="text-sm text-slate-400 mt-1">Billing rate management is only available to Super Admins.</p>
      </div>
    )
  }

  const handleSave = async (type, data) => {
    const result = await saveRate(type, data)

    if (result?.success) {
      reloadHistory()
    }

    return result
  }

  const handleSavePenaltyRule = async (payload) => {
    const result = await saveRule(payload)
    if (result?.success) {
      reloadHistory()
    }
    return result
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-700 text-2xl text-slate-800 dark:text-white">Billing Rates Management</h2>
            <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <Shield className="w-2.5 h-2.5 mr-1" />Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Set electricity, water, and thermal energy rates - changes propagate immediately to all dashboards</p>
        </div>
        <UpdatingBadge show={isRefreshing} />
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {penaltyError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-sm text-red-600 dark:text-red-300">
          {penaltyError}
        </div>
      )}

      <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50">
        <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">Changes made here propagate immediately to Admin, Finance, Facility Manager, Tenant dashboards, and all billing calculations.</p>
      </div>

      <BillingPeriodLockPanel
        scope="admin"
        title="Billing Period Lock Control"
        description="Finalized months auto-lock after cutoff. Manual control protects historical computations when exceptions are approved."
      />

      <PenaltyRuleCard
        rule={rule}
        loading={penaltyLoading}
        saving={penaltySaving}
        onSave={handleSavePenaltyRule}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['electricity', 'water', 'thermal'].map((type) => (
          <RateEditCard
            key={type}
            type={type}
            rate={rates[type]?.rate || 0}
            unit={rates[type]?.unit || TYPE_CONFIG[type].defaultUnit}
            completeness={rates[type]?.completeness || 0}
            saving={saving}
            onSave={handleSave}
            loading={isInitialLoading}
            updating={isRefreshing}
          />
        ))}
      </div>

      <RateHistoryPanel history={history} loading={historyLoading} />
    </div>
  )
}
