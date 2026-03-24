import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { NewBillSkeleton } from '@/components/skeletons'
import { Zap, Droplets, Flame, ArrowLeft, Info } from 'lucide-react'

const EMPTY = {
  tenant: '', unit: '', month: 'March 2026',
  billingPeriod: 'Feb 1 – Feb 28', dueDate: 'March 15, 2026',
  status: 'draft', breakdown: { electricity: '', water: '', thermal: '' },
  notes: '',
}

const field = (err) =>
  `w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'} text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`

const CHARGE_CONFIG = [
  { key: 'electricity', label: 'Electricity Charge', grad: 'from-amber-400 to-orange-500', icon: Zap,      hint: 'kWh' },
  { key: 'water',       label: 'Water Charge',        grad: 'from-cyan-400 to-blue-500',   icon: Droplets, hint: 'm³'  },
  { key: 'thermal',     label: 'Thermal Energy',      grad: 'from-rose-400 to-pink-500',   icon: Flame,    hint: 'kBTU/h' },
]

export default function NewBillPage() {
  const loading = usePageLoader(600)
  const navigate = useNavigate()
  const { addBill, addToast, tenants, billingRates } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [errs, setErrs] = useState({})

  if (loading) return <NewBillSkeleton />

  const selectedTenant = tenants.find(t => t.name === form.tenant)
  const tenantUnitOptions = selectedTenant
    ? (Array.isArray(selectedTenant.units) ? selectedTenant.units : [selectedTenant.unit]).filter(Boolean)
    : []

  const validate = () => {
    const e = {}
    if (!form.tenant.trim()) e.tenant = 'Tenant name required'
    if (!form.unit.trim()) e.unit = 'Unit required'
    const n = (k) => Number(form.breakdown[k])
    if (!n('electricity') && !n('water') && !n('thermal')) e.breakdown = 'At least one charge required'
    setErrs(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    const e = Number(form.breakdown.electricity) || 0
    const w = Number(form.breakdown.water) || 0
    const t = Number(form.breakdown.thermal) || 0
    addBill({ ...form, amount: e + w + t, breakdown: { electricity: e, water: w, thermal: t } })
    addToast('Bill created successfully')
    navigate('/admin/billing')
  }

  const total = CHARGE_CONFIG.reduce((s, c) => s + Number(form.breakdown[c.key] || 0), 0)

  // Auto-calculate suggested amount from live rates
  const suggestAmount = (key, usage) => {
    if (!billingRates || !usage) return ''
    const rateMap = { electricity: billingRates.electricity?.rate, water: billingRates.water?.rate, thermal: billingRates.thermal?.rate }
    const rate = rateMap[key]
    if (!rate) return ''
    return (parseFloat(usage) * rate).toFixed(2)
  }

  return (
    <div className="space-y-6 animate-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/billing')}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Create New Bill</h1>
          <p className="text-sm text-slate-400 mt-0.5">Fill in the billing details below</p>
        </div>
      </div>

      {/* Live rates hint */}
      {billingRates && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Current rates: <strong>₱{billingRates.electricity?.rate}/kWh</strong> electricity · <strong>₱{billingRates.water?.rate}/m³</strong> water · <strong>₱{billingRates.thermal?.rate}/kBTU/h</strong> thermal
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Tenant + Unit */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tenant *</label>
            <select value={form.tenant} onChange={e => setForm(f => ({ ...f, tenant: e.target.value, unit: '' }))} className={field(errs.tenant)}>
              <option value="">— Select tenant —</option>
              {tenants.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            {errs.tenant && <p className="text-xs text-red-500 mt-1">{errs.tenant}</p>}
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Unit *</label>
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={field(errs.unit)} disabled={!form.tenant}>
              <option value="">{form.tenant ? '— Select unit —' : 'Select a tenant first'}</option>
              {tenantUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errs.unit && <p className="text-xs text-red-500 mt-1">{errs.unit}</p>}
          </div>
        </div>

        {/* Period / Due Date */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Month</label>
            <input value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className={field(false)}/>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Billing Period</label>
            <input value={form.billingPeriod} onChange={e => setForm(f => ({ ...f, billingPeriod: e.target.value }))} className={field(false)}/>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Due Date</label>
            <input value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className={field(false)}/>
          </div>
        </div>

        {/* Utility Charges */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Utility Charges (₱) *</label>
          {errs.breakdown && <p className="text-xs text-red-500 mb-2">{errs.breakdown}</p>}
          <div className="space-y-3">
            {CHARGE_CONFIG.map(({ key, label, grad, icon: Icon, hint }) => (
              <div key={key} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Icon size={16} className="text-white"/>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 w-36 flex-shrink-0">{label}</span>
                <input
                  type="number" min="0"
                  value={form.breakdown[key]}
                  onChange={e => setForm(f => ({ ...f, breakdown: { ...f.breakdown, [key]: e.target.value } }))}
                  placeholder="0.00"
                  className="flex-1 min-w-0 px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
                />
                {billingRates?.[key]?.rate && (
                  <span className="text-xs text-slate-400 whitespace-nowrap">@₱{billingRates[key].rate}/{hint}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Amount</span>
            <span className="font-bold text-lg text-blue-700 dark:text-blue-300">₱{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={field(false)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
            placeholder="Optional notes or remarks..."
            className={`${field(false)} resize-none`}/>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => navigate('/admin/billing')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
            Save Bill
          </button>
        </div>
      </div>
    </div>
  )
}
