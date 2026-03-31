import { useMemo, useState } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantListSkeleton } from '@/components/skeletons'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PaginationBar from '@/components/common/PaginationBar'
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  User,
  Home,
  CalendarDays,
  Building2,
  X,
} from 'lucide-react'
import { useAdminTenants } from '@/hooks/adminHooks/useAdminTenants'
import { useAdminUnits } from '@/hooks/adminHooks/useAdminUnits'

const emptyForm = {
  user_id: '',
  unit_id: '',
  extra_unit_ids: [''],
  name: '',
  email: '',
  phone: '',
  contact_person: '',
  contact_person_phone: '',
  status: 'active',
  move_in_date: '',
  move_out_date: '',
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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

export default function Tenants() {
  const pageLoading = usePageLoader(700)

  const {
    tenants,
    tenantUsers,
    loading,
    submitting,
    error,
    addTenant,
    editTenant,
    removeTenant,
    loadTenants,
  } = useAdminTenants()

  const { units } = useAdminUnits()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('add')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [viewTenant, setViewTenant] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const tenantUnitMap = useMemo(() => {
    return tenants.reduce((acc, tenant) => {
      const key = String(tenant.user_id || tenant.id || '')
      if (!key) return acc
      if (!acc[key]) acc[key] = []

      const relatedUnits = []
      if (tenant.unit?.id || tenant.unit?.unit_number) relatedUnits.push(tenant.unit)
      if (Array.isArray(tenant.units)) relatedUnits.push(...tenant.units)

      relatedUnits.forEach((unit) => {
        const unitKey = String(unit?.id || unit?.unit_number || '')
        if (!unitKey) return
        if (!acc[key].some((existing) => String(existing?.id || existing?.unit_number || '') === unitKey)) {
          acc[key].push(unit)
        }
      })

      return acc
    }, {})
  }, [tenants])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return tenants

    return tenants.filter((tenant) => {
      const relatedUnits = tenantUnitMap[String(tenant.user_id || tenant.id || '')] || []
      const relatedUnitText = relatedUnits.map((unit) => unit?.unit_number).filter(Boolean).join(' ')

      return [
        tenant.name,
        tenant.email,
        tenant.phone,
        tenant.unit?.unit_number,
        relatedUnitText,
        tenant.status,
      ].some((value) => String(value || '').toLowerCase().includes(q))
    })
  }, [tenants, search, tenantUnitMap])

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

  const activeCount = tenants.filter((tenant) => tenant.status === 'active').length
  const multiUnitCount = Object.values(tenantUnitMap).filter((unitList) => unitList.length > 1).length
  const currentEditUnits = drawerMode === 'edit' ? (tenantUnitMap[String(form.user_id || '')] || []).filter(Boolean) : []
  const occupiedByOtherUsers = useMemo(() => {
    const currentUserId = String(form.user_id || '')
    return new Set(
      tenants
        .filter((tenant) => String(tenant.user_id || '') !== currentUserId)
        .flatMap((tenant) => {
          const result = []
          if (tenant.unit?.id) result.push(String(tenant.unit.id))
          if (tenant.unit_id) result.push(String(tenant.unit_id))
          if (Array.isArray(tenant.units)) {
            tenant.units.forEach((unit) => {
              if (unit?.id) result.push(String(unit.id))
            })
          }
          return result
        })
    )
  }, [tenants, form.user_id])
  const extraAssignedIds = (form.extra_unit_ids || []).filter(Boolean).map(String)
  const linkedUnitIds = currentEditUnits.map((unit) => String(unit?.id || '')).filter(Boolean)
  const availableExtraUnits = units.filter((unit) => {
    const unitId = String(unit.id)
    if (linkedUnitIds.includes(unitId)) return false
    if (occupiedByOtherUsers.has(unitId)) return false
    return true
  })

  const openAdd = () => {
    setForm(emptyForm)
    setErrors({})
    setEditingId(null)
    setDrawerMode('add')
    setDrawerOpen(true)
  }

  const openEdit = (tenant) => {
    setForm({
      user_id: tenant.user_id || '',
      unit_id: tenant.unit_id || tenant.unit?.id || '',
      extra_unit_ids: [''],
      name: tenant.name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      contact_person: tenant.contact_person || '',
      contact_person_phone: tenant.contact_person_phone || '',
      status: tenant.status || 'active',
      move_in_date: tenant.move_in_date ? String(tenant.move_in_date).slice(0, 10) : '',
      move_out_date: tenant.move_out_date ? String(tenant.move_out_date).slice(0, 10) : '',
    })
    setErrors({})
    setEditingId(tenant.id)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.user_id) nextErrors.user_id = 'Tenant user is required'
    if (!form.name.trim()) nextErrors.name = 'Name is required'
    if (drawerMode === 'edit') {
      const chosenExtra = [...new Set((form.extra_unit_ids || []).filter(Boolean).map(String))]
      if (chosenExtra.length !== extraAssignedIds.length) nextErrors.extra_unit_ids = 'Duplicate extra units are not allowed'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      unit_id: form.unit_id ? Number(form.unit_id) : null,
      name: form.name.trim(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      contact_person: form.contact_person?.trim() || null,
      contact_person_phone: form.contact_person_phone?.trim() || null,
      status: form.status || 'active',
      move_in_date: form.move_in_date || null,
      move_out_date: form.move_out_date || null,
    }

    try {
      if (drawerMode === 'add') {
        await addTenant(payload)
      } else {
        await editTenant(editingId, payload)
        const newExtraUnitIds = [...new Set((form.extra_unit_ids || []).filter(Boolean).map((id) => Number(id)))]
        for (const extraUnitId of newExtraUnitIds) {
          await addTenant({
            ...payload,
            unit_id: extraUnitId,
          })
        }
        await loadTenants()
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
      await removeTenant(deletingId)
      setDeletingId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const addExtraUnitRow = () => {
    setForm((current) => ({
      ...current,
      extra_unit_ids: [...(current.extra_unit_ids || ['']), ''],
    }))
  }

  const removeExtraUnitRow = (index) => {
    setForm((current) => {
      const next = (current.extra_unit_ids || ['']).filter((_, rowIndex) => rowIndex !== index)
      return {
        ...current,
        extra_unit_ids: next.length > 0 ? next : [''],
      }
    })
  }

  const setExtraUnitAtIndex = (index, value) => {
    setForm((current) => {
      const next = [...(current.extra_unit_ids || [''])]
      next[index] = value
      return {
        ...current,
        extra_unit_ids: next,
      }
    })
  }

  const fieldCls = (err) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
      err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
    } text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`

  const handlePerPageChange = (nextPerPage) => {
    setPerPage(nextPerPage)
    setPage(1)
  }

  if (pageLoading || loading) return <TenantListSkeleton />

  return (
    <div className="space-y-6 animate-in min-h-[calc(100vh-80px)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Tenants</h2>
          <p className="mt-1 text-sm text-slate-400">Manage tenant records, linked users, and assigned units.</p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Tenant Records" value={tenants.length} sub="All registered tenant entries" />
        <StatCard label="Active" value={activeCount} sub="Currently active tenants" tone="emerald" />
        <StatCard label="Multi-Unit" value={multiUnitCount} sub="Tenant users linked to multiple units" tone="amber" />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search tenants, contact, or units..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </div>

        <p className="text-xs text-slate-400">Showing operational tenant records in a paged table view.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md dark:border-slate-700/60 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
              <tr>
                {['Tenant', 'Contact', 'Units', 'Status', 'Move In', 'Actions'].map((label) => (
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
                    <User className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p>No tenants found.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((tenant) => {
                  const relatedUnits = tenantUnitMap[String(tenant.user_id || tenant.id || '')] || []
                  return (
                    <tr key={tenant.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
                            {tenant.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{tenant.name}</p>
                            <p className="text-xs text-slate-400">Linked User ID: {tenant.user_id || '-'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 min-w-[220px]">
                        <p className="text-sm text-slate-700 dark:text-slate-200">{tenant.email || '-'}</p>
                        <p className="mt-1 text-xs text-slate-400">{tenant.phone || 'No phone number'}</p>
                      </td>

                      <td className="px-4 py-3.5 min-w-[210px]">
                        <div className="flex flex-wrap gap-1.5">
                          {relatedUnits.length > 0 ? relatedUnits.slice(0, 2).map((unit) => (
                            <span key={unit?.id || unit?.unit_number} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <Home className="h-3 w-3" />
                              {unit?.unit_number || 'No unit'}
                            </span>
                          )) : (
                            <span className="text-xs text-slate-400">No units assigned</span>
                          )}
                          {relatedUnits.length > 2 ? (
                            <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                              +{relatedUnits.length - 2} more
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'}`}>
                          {tenant.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {tenant.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(tenant.move_in_date)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewTenant(tenant)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20" title="View details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(tenant)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" title="Edit tenant">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeletingId(tenant.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" title="Remove tenant">
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
        title={drawerMode === 'add' ? 'Add New Tenant' : 'Edit Tenant'}
        subtitle={drawerMode === 'add' ? 'Fill in the tenant details below' : `Editing ${form.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Tenant User *</label>
            <select value={form.user_id} onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))} className={fieldCls(errors.user_id)}>
              <option value="">- Select tenant user -</option>
              {tenantUsers
                .filter((user) => drawerMode === 'add' || String(user.id) !== String(form.user_id))
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              {drawerMode === 'edit' && form.user_id && !tenantUsers.some((user) => String(user.id) === String(form.user_id)) ? (
                <option value={form.user_id}>Current linked user</option>
              ) : null}
            </select>
            {errors.user_id ? <p className="mt-1 text-xs text-red-500">{errors.user_id}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Tenant Name *</label>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Tenant User" className={fieldCls(errors.name)} />
            {errors.name ? <p className="mt-1 text-xs text-red-500">{errors.name}</p> : null}
          </div>

          {drawerMode === 'edit' ? (
            <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Assigned Units</label>
                <span className="text-[10px] text-slate-400">{currentEditUnits.length} linked</span>
              </div>

              <div className="space-y-2">
                {currentEditUnits.length > 0 ? currentEditUnits.map((unit) => (
                  <div key={unit?.id || unit?.unit_number} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{unit?.unit_number || 'No unit'}</p>
                      <p className="text-xs text-slate-400">Floor {unit?.floor || '-'} - {unit?.building_name || '-'}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 italic">No linked units found for this tenant user.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Primary Unit For This Record</label>
                <select value={form.unit_id} onChange={(event) => setForm((current) => ({ ...current, unit_id: event.target.value }))} className={fieldCls(errors.unit_id)}>
                  <option value="">- No unit assigned -</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_number} ({unit.building_name || '-'})
                    </option>
                  ))}
                </select>
                {errors.unit_id ? <p className="mt-1 text-xs text-red-500">{errors.unit_id}</p> : null}
              </div>


              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Add More Units</label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>

                <div className="space-y-2">
                  {(form.extra_unit_ids || ['']).map((unitId, index) => {
                    const chosenByOtherRows = extraAssignedIds.filter((value, valueIndex) => valueIndex !== index)
                    const options = availableExtraUnits.filter((unit) => !chosenByOtherRows.includes(String(unit.id)) || String(unit.id) === String(unitId))
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={unitId}
                          onChange={(event) => setExtraUnitAtIndex(index, event.target.value)}
                          className={`${fieldCls(false)} flex-1`}
                        >
                          <option value="">- Select additional unit -</option>
                          {options.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.unit_number} ({unit.building_name || '-'}, Floor {unit.floor || '-'})
                            </option>
                          ))}
                        </select>

                        {(form.extra_unit_ids || []).length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeExtraUnitRow(index)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                            title="Remove extra unit row"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {errors.extra_unit_ids ? <p className="mt-1 text-xs text-red-500">{errors.extra_unit_ids}</p> : null}

                <button
                  type="button"
                  onClick={addExtraUnitRow}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Unit Row
                </button>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-900/40 dark:bg-blue-900/20">
                <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                  Saving this form will keep the current tenant record updated and create additional linked tenant records for any extra units you add here.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Assigned Unit</label>
              <select value={form.unit_id} onChange={(event) => setForm((current) => ({ ...current, unit_id: event.target.value }))} className={fieldCls(errors.unit_id)}>
                <option value="">- No unit assigned -</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit_number} ({unit.building_name || '-'})
                  </option>
                ))}
              </select>
              {errors.unit_id ? <p className="mt-1 text-xs text-red-500">{errors.unit_id}</p> : null}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Email Address</label>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="e.g. tenant@example.com" className={fieldCls(errors.email)} />
            {errors.email ? <p className="mt-1 text-xs text-red-500">{errors.email}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Phone Number</label>
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="e.g. 09123456789" className={fieldCls(errors.phone)} />
              {errors.phone ? <p className="mt-1 text-xs text-red-500">{errors.phone}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Contact Person</label>
              <input value={form.contact_person} onChange={(event) => setForm((current) => ({ ...current, contact_person: event.target.value }))} placeholder="e.g. Maria Dela Cruz" className={fieldCls(errors.contact_person)} />
              {errors.contact_person ? <p className="mt-1 text-xs text-red-500">{errors.contact_person}</p> : null}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Contact Person Phone</label>
            <input value={form.contact_person_phone} onChange={(event) => setForm((current) => ({ ...current, contact_person_phone: event.target.value }))} placeholder="e.g. 09987654321" className={fieldCls(errors.contact_person_phone)} />
            {errors.contact_person_phone ? <p className="mt-1 text-xs text-red-500">{errors.contact_person_phone}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Move In Date</label>
              <input type="date" value={form.move_in_date} onChange={(event) => setForm((current) => ({ ...current, move_in_date: event.target.value }))} className={fieldCls(errors.move_in_date)} />
              {errors.move_in_date ? <p className="mt-1 text-xs text-red-500">{errors.move_in_date}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Move Out Date</label>
              <input type="date" value={form.move_out_date} onChange={(event) => setForm((current) => ({ ...current, move_out_date: event.target.value }))} className={fieldCls(errors.move_out_date)} />
              {errors.move_out_date ? <p className="mt-1 text-xs text-red-500">{errors.move_out_date}</p> : null}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-slate-400">Status</label>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={fieldCls(errors.status)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="moved_out">Moved Out</option>
            </select>
            {errors.status ? <p className="mt-1 text-xs text-red-500">{errors.status}</p> : null}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setDrawerOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Saving...' : drawerMode === 'add' ? 'Add Tenant' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={!!viewTenant}
        onClose={() => setViewTenant(null)}
        title={viewTenant?.name}
        subtitle={viewTenant ? `${(tenantUnitMap[String(viewTenant.user_id || viewTenant.id || '')] || []).length} assigned unit(s)` : ''}
      >
        {viewTenant ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Contact Info</p>
                <div className="space-y-3">
                  {[
                    ['Email', viewTenant.email || '-'],
                    ['Phone', viewTenant.phone || '-'],
                    ['Contact Person', viewTenant.contact_person || '-'],
                    ['Contact Person Phone', viewTenant.contact_person_phone || '-'],
                    ['Status', viewTenant.status || '-'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Lease Details</p>
                <div className="space-y-3">
                  {[
                    ['Move In', formatDate(viewTenant.move_in_date)],
                    ['Move Out', formatDate(viewTenant.move_out_date)],
                    ['Linked User ID', viewTenant.user_id || '-'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">Assigned Units</p>
              <div className="grid gap-2">
                {(tenantUnitMap[String(viewTenant.user_id || viewTenant.id || '')] || []).length > 0 ? (
                  (tenantUnitMap[String(viewTenant.user_id || viewTenant.id || '')] || []).map((unit) => (
                    <div key={unit?.id || unit?.unit_number} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{unit?.unit_number || 'No unit number'}</p>
                      <p className="mt-1 text-xs text-slate-400">Floor {unit?.floor || '-'} - {unit?.building_name || '-'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No units assigned.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmModal
        isOpen={!!deletingId}
        title="Remove Tenant?"
        message="This tenant record will be permanently removed. This cannot be undone."
        confirmLabel="Remove Tenant"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}

