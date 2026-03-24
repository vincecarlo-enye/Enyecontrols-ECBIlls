import { useState, useEffect } from 'react'
import { Zap, Droplets, Flame, Plus, Pencil, Trash2, Search, X, CheckCircle, AlertCircle, Shield, HelpCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { DashboardSkeleton } from '@/components/skeletons'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { usePermissions } from '@/hooks/usePermissions'
import { Lock } from 'lucide-react'

const METER_TYPES = [
  { value: 'electric', label: 'Electric', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/50' },
  { value: 'water', label: 'Water', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700/50' },
  { value: 'thermal', label: 'Thermal Energy', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700/50' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-200 dark:border-slate-600/50' },
]

const METER_NAME_OPTIONS = [
  'Main (Basement)',
  'Tihik',
  'Enye',
  'Enyecontrols',
]

function getMeterType(value) {
  return METER_TYPES.find(t => t.value === value) || METER_TYPES[0]
}

function MeterFormModal({ open, onClose, onSave, units, initial }) {
  const empty = { type: 'electric', meterName: '', customMeterType: '', unit: '', status: 'active' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(initial
        ? {
            type: initial.type || 'electric',
            meterName: initial.meterName || '',
            customMeterType: initial.customMeterType || '',
            unit: initial.unit || '',
            status: initial.status || 'active',
          }
        : empty)
      setErrors({})
    }
  }, [open, initial])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const e = {}
    if (!form.meterName) e.meterName = 'Meter Name is required'
    if (!form.type) e.type = 'Meter Type is required'
    if (form.type === 'other' && !form.customMeterType.trim()) e.customMeterType = 'Please specify the meter type'
    if (!form.unit) e.unit = 'Unit is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const unitObj = units.find(u => u.unit === form.unit)
    const saveData = {
      ...form,
      tenant: unitObj?.tenant || null,
      unitId: unitObj?.id || null,
      customMeterType: form.type === 'other' ? form.customMeterType : '',
    }
    onSave(saveData)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50">
          <h2 className="font-display font-700 text-[15px] text-slate-800 dark:text-white">
            {initial ? 'Edit Meter' : 'Add New Meter'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Meter Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Meter Type</label>
            <div className="grid grid-cols-4 gap-2">
              {METER_TYPES.map(t => {
                const Icon = t.icon
                const selected = form.type === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => set('type', t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      selected
                        ? `${t.bg} ${t.border} ${t.color}`
                        : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
          </div>

          {/* Specify Meter Type - only shown when "Other" selected */}
          {form.type === 'other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Specify Meter Type</label>
              <input
                type="text"
                value={form.customMeterType}
                onChange={e => set('customMeterType', e.target.value)}
                placeholder="e.g. Gas, Solar, Steam..."
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                  errors.customMeterType ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'
                }`}
              />
              {errors.customMeterType && <p className="text-xs text-red-500 mt-1">{errors.customMeterType}</p>}
            </div>
          )}

          {/* Meter Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Meter Name</label>
            <select
              value={form.meterName}
              onChange={e => set('meterName', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                errors.meterName ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'
              }`}
            >
              <option value="">Select meter name...</option>
              {METER_NAME_OPTIONS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {errors.meterName && <p className="text-xs text-red-500 mt-1">{errors.meterName}</p>}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Location / Unit</label>
            <select
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                errors.unit ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'
              }`}
            >
              <option value="">Select unit...</option>
              {units.map(u => (
                <option key={u.id} value={u.unit}>
                  {u.unit} {u.tenant ? `— ${u.tenant}` : '(Vacant)'}
                </option>
              ))}
            </select>
            {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
            {form.unit && (() => {
              const u = units.find(x => x.unit === form.unit)
              return u?.tenant ? (
                <p className="text-xs text-slate-400 mt-1">Linked tenant: <span className="text-blue-500 font-medium">{u.tenant}</span></p>
              ) : (
                <p className="text-xs text-amber-500 mt-1">This unit is currently vacant</p>
              )
            })()}
          </div>

          {/* Status (only in edit mode) */}
          {initial && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {initial ? 'Save Changes' : 'Add Meter'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MeterCard({ meter, onEdit, onDelete }) {
  const type = getMeterType(meter.type)
  const Icon = type.icon

  const statusConfig = {
    active: { label: 'Active', icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    inactive: { label: 'Inactive', icon: AlertCircle, cls: 'text-slate-500 bg-slate-100 dark:bg-slate-700/40' },
    maintenance: { label: 'Maintenance', icon: AlertCircle, cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  }
  const sc = statusConfig[meter.status] || statusConfig.active
  const StatusIcon = sc.icon

  const displayTypeLabel = meter.type === 'other' && meter.customMeterType
    ? meter.customMeterType
    : type.label

  return (
    <div className={`relative p-4 rounded-2xl border ${type.border} ${type.bg} group transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${type.bg} border ${type.border}`}>
          <Icon className={`w-5 h-5 ${type.color}`} />
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>
          <StatusIcon className="w-3 h-3" />
          {sc.label}
        </div>
      </div>

      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${type.color}`}>{displayTypeLabel} Meter</p>
      <p className="font-display font-700 text-[15px] text-slate-800 dark:text-white mb-3">{meter.meterName}</p>

      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Unit</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{meter.unit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Tenant</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px] text-right">
            {meter.tenant || <span className="text-slate-400 italic">Vacant</span>}
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
        <button
          onClick={() => onEdit(meter)}
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-500 transition-colors shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(meter)}
          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-red-500 transition-colors shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function MeterManagement() {
  const loading = usePageLoader(900)
  const { meters, units, tenants, addMeter, updateMeter, deleteMeter } = useApp()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { isSuperAdmin } = usePermissions()

  if (loading) return <DashboardSkeleton />

  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center py-24">
      <Lock className="w-12 h-12 text-slate-300 mb-4"/>
      <p className="text-lg font-semibold text-slate-500">Access Denied</p>
      <p className="text-sm text-slate-400 mt-1">Meter Management is only available to Super Admins.</p>
    </div>
  )

  const filtered = meters.filter(m => {
    const matchType = typeFilter === 'all' || m.type === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || (m.meterName || '').toLowerCase().includes(q) || m.unit.toLowerCase().includes(q) || (m.tenant || '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const counts = {
    electric: meters.filter(m => m.type === 'electric').length,
    water: meters.filter(m => m.type === 'water').length,
    thermal: meters.filter(m => m.type === 'thermal').length,
    other: meters.filter(m => m.type === 'other').length,
  }

  const handleSave = (data) => {
    if (editing) {
      updateMeter(editing.id, data)
      setEditing(null)
    } else {
      addMeter(data)
    }
    setShowForm(false)
  }

  const handleEdit = (meter) => {
    setEditing(meter)
    setShowForm(true)
  }

  const handleDelete = (meter) => setConfirmDelete(meter)

  const confirmDeleteMeter = () => {
    if (confirmDelete) {
      deleteMeter(confirmDelete.id)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-700 text-2xl text-slate-800 dark:text-white">Meter Management</h2>
            <span className="flex justify-center items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white tracking-wider uppercase shadow">
              <Shield className="w-2.5 h-2.5 mr-1" />
              Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all electric, water, and thermal energy meters across units</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Meter
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {METER_TYPES.map(t => {
          const Icon = t.icon
          return (
            <div key={t.value} className={`p-4 rounded-2xl border ${t.border} ${t.bg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/50">
                  <Icon className={`w-5 h-5 ${t.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-display font-700 text-slate-800 dark:text-white">{counts[t.value]}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.label} Meters</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, unit, or tenant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All' }, ...METER_TYPES.map(t => ({ value: t.value, label: t.label }))].map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                typeFilter === f.value
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meters Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center mb-4">
            <Zap className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">No meters found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or add a new meter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(m => (
            <MeterCard key={m.id} meter={m} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <MeterFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSave={handleSave}
        units={units}
        initial={editing}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Remove Meter"
        message={`Are you sure you want to remove meter "${confirmDelete?.meterName}"? This action cannot be undone.`}
        confirmLabel="Remove"
        confirmClass="bg-red-500 hover:bg-red-600 text-white"
        onConfirm={confirmDeleteMeter}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
