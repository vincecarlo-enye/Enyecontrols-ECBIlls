import { useMemo, useState } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { UnitsSkeleton } from '@/components/skeletons'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PaginationBar from '@/components/common/PaginationBar'
import {
  Building2,
  Zap,
  Droplets,
  Plus,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  Gauge,
  Eye,
  Search,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'
import { useAdminUnits } from '@/hooks/adminHooks/useAdminUnits'
import { useAdminMeters } from '@/hooks/adminHooks/useAdminMeters'

const emptyForm = {
  unit_number: '',
  floor: '',
  building_name: '',
  status: 'vacant',
}

function StatCard({ label, value, sub, tone = 'slate' }) {
  const toneClass = {
    slate: 'text-slate-800 dark:text-white',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-display font-700 ${toneClass[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  )
}

function formatOtherMeterLabel(count) {
  if (!count) return 'No other meters'
  if (count === 1) return '1 other meter'
  return `${count} other meters`
}

export default function Units() {
  const pageLoading = usePageLoader(700)
  const { user } = useAuth()

  const {
    units,
    loading: unitsLoading,
    submitting,
    error,
    addUnit,
    editUnit,
    removeUnit,
  } = useAdminUnits()

  const { meters } = useAdminMeters()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('add')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [viewUnit, setViewUnit] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const isSuperAdmin = user?.role === 'super_admin'

  const occupied = units.filter((unit) => unit.status === 'occupied').length
  const vacant = units.filter((unit) => unit.status === 'vacant').length

  const metersByUnit = useMemo(() => {
    return meters.reduce((acc, meter) => {
      const assignedUnitIds = Array.isArray(meter.unitIds) && meter.unitIds.length > 0
        ? meter.unitIds
        : meter.unitId
          ? [meter.unitId]
          : []

      assignedUnitIds.forEach((unitId) => {
        const key = String(unitId || '')
        if (!key) return
        if (!acc[key]) acc[key] = []
        acc[key].push(meter)
      })

      return acc
    }, {})
  }, [meters])

  const getMeterByType = (unitId, type) => {
    const unitMeters = metersByUnit[String(unitId)] || []
    const matched = unitMeters.find((meter) => String(meter.type).toLowerCase() === type)
    if (matched) return matched

    const unit = units.find((item) => String(item.id) === String(unitId))
    const tenantIds = Array.isArray(unit?.tenants) ? unit.tenants.map((tenant) => String(tenant.id)) : []
    if (tenantIds.length === 0) return null

    return meters.find((meter) => tenantIds.includes(String(meter.tenantId)) && String(meter.type).toLowerCase() === type) || null
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return units

    return units.filter((unit) => {
      const tenantNames = Array.isArray(unit.tenants)
        ? unit.tenants.map((tenant) => tenant?.name).filter(Boolean).join(' ')
        : ''

      return [
        unit.unit_number,
        unit.floor,
        unit.building_name,
        unit.status,
        tenantNames,
      ].some((value) => String(value || '').toLowerCase().includes(q))
    })
  }, [units, search])

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  const paginationMeta = useMemo(() => {
    const total = filtered.length
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const from = total === 0 ? 0 : (page - 1) * perPage + 1
    const to = Math.min(page * perPage, total)
    return {
      current_page: page,
      per_page: perPage,
      total,
      last_page: lastPage,
      from,
      to,
    }
  }, [filtered.length, page, perPage])

  const validate = () => {
    const nextErrors = {}
    if (!form.unit_number.trim()) nextErrors.unit_number = 'Unit number required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const openAdd = () => {
    setForm(emptyForm)
    setErrors({})
    setEditingId(null)
    setDrawerMode('add')
    setDrawerOpen(true)
  }

  const openEdit = (unit) => {
    setForm({
      unit_number: unit.unit_number || '',
      floor: String(unit.floor || ''),
      building_name: unit.building_name || '',
      status: unit.status || 'vacant',
    })
    setErrors({})
    setEditingId(unit.id)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const data = {
      unit_number: form.unit_number.trim(),
      floor: form.floor?.trim() || null,
      building_name: form.building_name?.trim() || null,
      status: form.status || 'vacant',
    }

    try {
      if (drawerMode === 'add') {
        await addUnit(data)
      } else {
        await editUnit(editingId, data)
      }

      setDrawerOpen(false)
      setForm(emptyForm)
      setEditingId(null)
      setErrors({})
    } catch (err) {
      const backendErrors = err?.response?.data?.errors || {}
      const firstFieldErrors = Object.fromEntries(
        Object.entries(backendErrors).map(([key, value]) => [key, value?.[0] || 'Invalid'])
      )
      setErrors(firstFieldErrors)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await removeUnit(deletingId)
      setDeletingId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const fieldCls = (err) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
      err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
    } text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`

  const handlePerPageChange = (nextPerPage) => {
    setPerPage(nextPerPage)
    setPage(1)
  }

  if (pageLoading || unitsLoading) return <UnitsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Units</h2>
          <p className="mt-1 text-sm text-slate-400">Review unit occupancy, tenant assignments, and meter readiness.</p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Unit
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ maxWidth: '460px' }}>
        <StatCard label="Total Units" value={units.length} sub="All registered units" />
        <StatCard label="Occupied" value={occupied} sub="Units with active occupants" tone="emerald" />
        <StatCard label="Vacant" value={vacant} sub="Units available or unassigned" tone="amber" />
      </div>

      {isSuperAdmin ? <MeterOverviewPanel compact /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search units, tenants, status..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </div>

        <p className="text-xs text-slate-400">Switching to table view keeps large unit datasets easier to manage.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md dark:border-slate-700/60 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
              <tr>
                {['Unit', 'Location', 'Tenants', 'Meters', 'Status', 'Actions'].map((label) => (
                  <th key={label} className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                    <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p>No units found.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((unit) => {
                  const electricMeter = getMeterByType(unit.id, 'electric')
                  const waterMeter = getMeterByType(unit.id, 'water')
                  const thermalMeter = getMeterByType(unit.id, 'thermal')
                  const otherMeters = (metersByUnit[String(unit.id)] || []).filter(
                    (meter) => !['electric', 'water', 'thermal'].includes(String(meter.type).toLowerCase())
                  )
                  const tenantNames = Array.isArray(unit.tenants) ? unit.tenants.map((tenant) => tenant.name).filter(Boolean) : []

                  return (
                    <tr key={unit.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 min-w-[140px]">
                        <p className="font-semibold text-slate-800 dark:text-white">{unit.unit_number}</p>
                        <p className="mt-1 text-xs text-slate-400">Unit ID: {unit.id}</p>
                      </td>

                      <td className="px-4 py-3.5 min-w-[180px]">
                        <p className="text-sm text-slate-700 dark:text-slate-200">{unit.building_name || '-'}</p>
                        <p className="mt-1 text-xs text-slate-400">Floor {unit.floor || '-'}</p>
                      </td>

                      <td className="px-4 py-3.5 min-w-[200px]">
                        {tenantNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {tenantNames.slice(0, 2).map((name) => (
                              <span key={name} className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {name}
                              </span>
                            ))}
                            {tenantNames.length > 2 ? (
                              <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                +{tenantNames.length - 2} more
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No tenant assigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 min-w-[260px]">
                        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <p className="inline-flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-amber-500" /> {electricMeter?.meterName || electricMeter?.watchName || 'No electric meter'}</p>
                          <p className="inline-flex items-center gap-2"><Droplets className="h-3.5 w-3.5 text-cyan-500" /> {waterMeter?.meterName || waterMeter?.watchName || 'No water meter'}</p>
                          <p className="inline-flex items-center gap-2"><Gauge className="h-3.5 w-3.5 text-rose-500" /> {thermalMeter?.meterName || thermalMeter?.watchName || 'No thermal meter'}</p>
                          <p className="inline-flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-violet-500" /> {formatOtherMeterLabel(otherMeters.length)}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${unit.status === 'occupied' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'}`}>
                          {unit.status === 'occupied' ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {unit.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewUnit(unit)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20" title="View details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(unit)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" title="Edit unit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeletingId(unit.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" title="Remove unit">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <PaginationBar
            meta={paginationMeta}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={handlePerPageChange}
            perPageOptions={[10, 20, 50]}
          />
        </div>
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === 'add' ? 'Add New Unit' : `Edit Unit ${form.unit_number}`}
        subtitle="Fill in the unit details below"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Unit Number *</label>
            <input value={form.unit_number} onChange={(event) => setForm((current) => ({ ...current, unit_number: event.target.value }))} placeholder="e.g. A-101" className={fieldCls(errors.unit_number)} />
            {errors.unit_number ? <p className="mt-1 text-xs text-red-500">{errors.unit_number}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Floor</label>
              <input value={form.floor} onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))} placeholder="e.g. 1" className={fieldCls(errors.floor)} />
              {errors.floor ? <p className="mt-1 text-xs text-red-500">{errors.floor}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Building Name</label>
              <input value={form.building_name} onChange={(event) => setForm((current) => ({ ...current, building_name: event.target.value }))} placeholder="e.g. Tower A" className={fieldCls(errors.building_name)} />
              {errors.building_name ? <p className="mt-1 text-xs text-red-500">{errors.building_name}</p> : null}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Status</label>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={fieldCls(errors.status)}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
            {errors.status ? <p className="mt-1 text-xs text-red-500">{errors.status}</p> : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="mb-1 text-xs font-medium text-slate-700 dark:text-slate-200">Meter assignment</p>
            <p className="text-xs leading-relaxed text-slate-400">
              Electric, water, and thermal meters are managed in the meter module and linked through the meter's unit assignment.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setDrawerOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Saving...' : drawerMode === 'add' ? 'Add Unit' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={!!viewUnit}
        onClose={() => setViewUnit(null)}
        title={viewUnit?.unit_number}
        subtitle={viewUnit ? `${viewUnit.building_name || '-'} - Floor ${viewUnit.floor || '-'}` : ''}
      >
        {viewUnit ? (() => {
          const otherMeters = (metersByUnit[String(viewUnit.id)] || []).filter(
            (meter) => !['electric', 'water', 'thermal'].includes(String(meter.type).toLowerCase())
          )

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Unit Details</p>
                  <div className="space-y-3">
                    {[
                      ['Status', viewUnit.status || '-'],
                      ['Floor', viewUnit.floor || '-'],
                      ['Building', viewUnit.building_name || '-'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Assigned Tenants</p>
                  {Array.isArray(viewUnit.tenants) && viewUnit.tenants.length > 0 ? (
                    <div className="space-y-2">
                      {viewUnit.tenants.map((tenant) => (
                        <div key={tenant.id} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{tenant.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{tenant.email || '-'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No tenant assigned.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Meter Readiness</p>
                <div className="grid gap-2">
                  {[
                    { label: 'Electric', icon: Zap, meter: getMeterByType(viewUnit.id, 'electric'), cls: 'text-amber-500' },
                    { label: 'Water', icon: Droplets, meter: getMeterByType(viewUnit.id, 'water'), cls: 'text-cyan-500' },
                    { label: 'Thermal', icon: Gauge, meter: getMeterByType(viewUnit.id, 'thermal'), cls: 'text-rose-500' },
                  ].map(({ label, icon: Icon, meter, cls }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                      <Icon className={`h-4 w-4 ${cls}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                        <p className="text-xs text-slate-400">{meter?.meterName || meter?.watchName || `No ${label.toLowerCase()} meter`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Other Meters</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {formatOtherMeterLabel(otherMeters.length)}
                </p>
                {otherMeters.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {otherMeters.map((meter) => (
                      <span
                        key={meter.id}
                        className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                      >
                        {meter.meterName || meter.watchName || `Meter #${meter.id}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No extra meters assigned.</p>
                )}
              </div>
            </div>
          )
        })() : null}
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        title="Remove Unit?"
        message="This unit record will be permanently removed. This cannot be undone."
        confirmLabel="Remove Unit"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
