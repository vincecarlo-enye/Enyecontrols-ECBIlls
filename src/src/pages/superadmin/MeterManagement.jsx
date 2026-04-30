import { useEffect, useMemo, useState } from 'react'
import {
  Zap, Droplets, Flame, Plus, Pencil, Trash2, Search, X, CheckCircle,
  AlertCircle, Shield, Lock,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PaginationBar from '@/components/common/PaginationBar'
import { LoadingValue, UpdatingBadge } from '@/components/common/InlineLoadingState'
import { usePermissions } from '@/hooks/usePermissions'
import { useAdminMeters } from '@/hooks/adminHooks/useAdminMeters'

const METER_TYPES = [
  { value: 'electric', label: 'Electric', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/50' },
  { value: 'water', label: 'Water', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700/50' },
  { value: 'thermal', label: 'Thermal Energy', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700/50' },
  { value: 'other', label: 'Others', icon: Shield, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-700/50' },
]

const METER_PAGE_OPTIONS = [
  'Main (Basement)',
  'Tihik',
  'Enye',
  'Enyecontrols',
]

function getMeterType(value) {
  return METER_TYPES.find((item) => item.value === value) || METER_TYPES[0]
}

function MeterFormModal({ open, onClose, onSave, units, getAvailableWatches, initial, saving }) {
  const empty = {
    type: 'electric',
    meterName: '',
    pageName: '',
    watchName: '',
    unitIds: [],
    status: 'active',
  }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [watchOptions, setWatchOptions] = useState([])
  const [watchLoading, setWatchLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const nextForm = initial
      ? {
          type: initial.type || 'electric',
          meterName: initial.meterName || '',
          pageName: initial.pageName || initial.meterName || '',
          watchName: initial.watchName || '',
          unitIds: Array.isArray(initial.unitIds)
            ? initial.unitIds.map((id) => String(id))
            : initial.unitId
              ? [String(initial.unitId)]
              : [],
          status: initial.status || 'active',
        }
      : empty

    setForm(nextForm)
    setErrors({})
  }, [open, initial])

  useEffect(() => {
    if (!open || !form.pageName) {
      setWatchOptions([])
      return
    }

    let active = true

    const loadWatches = async () => {
      try {
        setWatchLoading(true)
        const available = await getAvailableWatches(form.pageName)
        if (!active) return

        const filtered = available.filter((item) => {
          const suggested = item?.suggested_type || ''
          return suggested === form.type
        })

        setWatchOptions(filtered)
      } catch {
        if (active) setWatchOptions([])
      } finally {
        if (active) setWatchLoading(false)
      }
    }

    loadWatches()

    return () => {
      active = false
    }
  }, [open, form.pageName, form.type, getAvailableWatches])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    const nextErrors = {}
    if (!form.meterName.trim()) nextErrors.meterName = 'Meter name is required'
    if (!form.pageName) nextErrors.pageName = 'Page is required'
    if (!form.watchName) nextErrors.watchName = 'Watch is required'
    if (!Array.isArray(form.unitIds) || form.unitIds.length === 0) nextErrors.unitIds = 'At least one unit is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    const result = await onSave({
      ...form,
      unitIds: form.unitIds.map((id) => Number(id)).filter(Boolean),
    })

    if (result?.success) {
      onClose()
    }
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
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Meter Type</label>
            <div className="grid grid-cols-4 gap-2">
              {METER_TYPES.map((item) => {
                const Icon = item.icon
                const selected = form.type === item.value
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      set('type', item.value)
                      set('watchName', '')
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      selected
                        ? `${item.bg} ${item.border} ${item.color}`
                        : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Meter Name</label>
            <input
              type="text"
              value={form.meterName}
              onChange={(e) => set('meterName', e.target.value)}
              placeholder="Enter display name"
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                errors.meterName ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'
              }`}
            />
            {errors.meterName && <p className="text-xs text-red-500 mt-1">{errors.meterName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Omni Page</label>
            <select
              value={form.pageName}
              onChange={(e) => {
                set('pageName', e.target.value)
                set('watchName', '')
              }}
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                errors.pageName ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'
              }`}
            >
              <option value="">Select page...</option>
              {METER_PAGE_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {errors.pageName && <p className="text-xs text-red-500 mt-1">{errors.pageName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Watch Name</label>
            <select
              value={form.watchName}
              onChange={(e) => set('watchName', e.target.value)}
              disabled={!form.pageName || watchLoading}
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none transition-all ${
                errors.watchName ? 'border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400'
              }`}
            >
              <option value="">
                {watchLoading ? 'Loading watches...' : 'Select watch...'}
              </option>
              {watchOptions.map((item) => (
                <option key={item.watch_name} value={item.watch_name}>
                  {item.watch_name}
                </option>
              ))}
            </select>
            {errors.watchName && <p className="text-xs text-red-500 mt-1">{errors.watchName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Assigned Units</label>
            <div className={`max-h-44 overflow-y-auto rounded-xl border bg-white dark:bg-slate-800 p-2 space-y-1.5 ${
              errors.unitIds ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
            }`}>
              {units.map((unit) => {
                const checked = form.unitIds.includes(String(unit.id))
                return (
                  <label
                    key={unit.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'bg-violet-50 dark:bg-violet-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        set('unitIds', e.target.checked
                          ? [...form.unitIds, String(unit.id)]
                          : form.unitIds.filter((id) => id !== String(unit.id)))
                      }}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {unit.unit} {unit.tenant ? `- ${unit.tenant}` : unit.status === 'occupied' ? '- Occupied' : '(Vacant)'}
                    </span>
                  </label>
                )
              })}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              The first selected unit will be used as the primary unit for compatibility with existing billing pages.
            </p>
            {errors.unitIds && <p className="text-xs text-red-500 mt-1">{errors.unitIds}</p>}
          </div>

          {initial && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
            disabled={saving}
            className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 transition-all"
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
  }
  const sc = statusConfig[meter.status] || statusConfig.active
  const StatusIcon = sc.icon

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

      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${type.color}`}>{type.label} Meter</p>
      <p className="font-display font-700 text-[15px] text-slate-800 dark:text-white mb-1">{meter.meterName}</p>
      <p className="text-xs text-slate-400 mb-3 truncate">{meter.watchName}</p>

      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Units</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-[150px]">
            {meter.occupancyLabel || meter.unitsLabel || meter.unit || '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Occupied</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px] text-right">
            {typeof meter.occupiedUnitCount === 'number'
              ? `${meter.occupiedUnitCount}`
              : meter.assignedUnitDetails?.some((unit) => unit.status === 'occupied')
                ? '1'
                : '0'}
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
  const pageLoading = usePageLoader(900)
  const { isSuperAdmin } = usePermissions()
  const {
    meters,
    units,
    loading,
    saving,
    error,
    meta,
    page,
    perPage,
    setPage,
    setPerPage,
    counts,
    getAvailableWatches,
    addMeter,
    updateMeter,
    deleteMeter,
  } = useAdminMeters()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => meters.filter((meter) => {
    const matchType = typeFilter === 'all' || meter.type === typeFilter
    const q = search.toLowerCase().trim()
    const matchSearch =
      !q ||
      (meter.meterName || '').toLowerCase().includes(q) ||
      (meter.watchName || '').toLowerCase().includes(q) ||
      (meter.unitsLabel || meter.unit || '').toLowerCase().includes(q) ||
      (meter.tenant || '').toLowerCase().includes(q)

    return matchType && matchSearch
  }), [meters, search, typeFilter])
  const isInitialLoading = (pageLoading || loading) && meters.length === 0 && !error
  const isRefreshing = !isInitialLoading && loading

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Lock className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-lg font-semibold text-slate-500">Access Denied</p>
        <p className="text-sm text-slate-400 mt-1">Meter Management is only available to Super Admins.</p>
      </div>
    )
  }

  const handleSave = async (data) => {
    if (editing) {
      const result = await updateMeter(editing.id, data)
      if (result?.success) setEditing(null)
      return result
    }

    return addMeter(data)
  }

  const confirmDeleteMeter = async () => {
    if (!confirmDelete) return
    const result = await deleteMeter(confirmDelete.id)
    if (result?.success) setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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
        <div className="flex items-center gap-3">
          <UpdatingBadge show={isRefreshing} />
          <button
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Meter
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METER_TYPES.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.value} className={`p-4 rounded-2xl border ${item.border} ${item.bg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/50">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <LoadingValue
                    loading={isInitialLoading}
                    updating={isRefreshing}
                    value={counts[item.value] || 0}
                    className="text-2xl font-display font-700 text-slate-800 dark:text-white"
                    spinnerClassName="h-5 w-5 text-slate-400"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.label} Meters</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by meter, watch, unit, or tenant..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All' }, ...METER_TYPES.map((item) => ({ value: item.value, label: item.label }))].map((filter) => (
            <button
              key={filter.value}
              onClick={() => { setTypeFilter(filter.value); setPage(1) }}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                typeFilter === filter.value
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center mb-4">
            <Zap className="w-7 h-7 text-slate-400 animate-pulse" />
          </div>
          <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Loading meters...</p>
          <p className="text-sm text-slate-400">Meter data is on the way.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center mb-4">
            <Zap className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">No meters found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or add a new meter</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((meter) => (
              <MeterCard
                key={meter.id}
                meter={meter}
                onEdit={(item) => {
                  setEditing(item)
                  setShowForm(true)
                }}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
            <PaginationBar
              meta={meta}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value)
                setPage(1)
              }}
            />
          </div>
        </>
      )}

      <MeterFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditing(null)
        }}
        onSave={handleSave}
        units={units}
        getAvailableWatches={getAvailableWatches}
        initial={editing}
        saving={saving}
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
