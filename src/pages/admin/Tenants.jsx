import { useMemo, useState } from 'react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantListSkeleton } from '@/components/skeletons'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Building2,
  Eye,
  Edit3,
  Trash2,
  User,
} from 'lucide-react'
import { useAdminTenants } from '@/hooks/adminHooks/useAdminTenants'
import { useAdminUnits } from '@/hooks/adminHooks/useAdminUnits'

const emptyForm = {
  user_id: '',
  unit_id: '',
  name: '',
  email: '',
  phone: '',
  contact_person: '',
  contact_person_phone: '',
  status: 'active',
  move_in_date: '',
  move_out_date: '',
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
  } = useAdminTenants()

  const { units } = useAdminUnits()

  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('add')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [viewTenant, setViewTenant] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return tenants

    return tenants.filter((t) => {
      const unitText = t.unit?.unit_number || ''
      return (
        String(t.name || '').toLowerCase().includes(q) ||
        String(t.email || '').toLowerCase().includes(q) ||
        String(unitText).toLowerCase().includes(q)
      )
    })
  }, [tenants, search])

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
      unit_id: tenant.unit_id || '',
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
    const e = {}
    if (!form.user_id) e.user_id = 'Tenant user is required'
    if (!form.name.trim()) e.name = 'Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
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

  const fieldCls = (err) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${
      err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
    } text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`

  if (pageLoading || loading) return <TenantListSkeleton />

  return (
    <div className="space-y-6 animate-in min-h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">
            Tenants
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">{tenants.length} registered tenants</p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Add Tenant
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No tenants found.</p>
          </div>
        )}

        {filtered.map((tenant) => (
          <div key={tenant.id} className="glass rounded-2xl p-5 shadow-md card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {tenant.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">
                    {tenant.name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                      {tenant.unit?.unit_number || 'No unit'}
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                  tenant.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'
                }`}
              >
                {tenant.status === 'active' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {tenant.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate text-xs">{tenant.email || '—'}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">{tenant.phone || '—'}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Move in{' '}
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {tenant.move_in_date ? String(tenant.move_in_date).slice(0, 10) : '—'}
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {tenant.unit?.unit_number || 'No unit'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setViewTenant(tenant)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>

              <button
                onClick={() => openEdit(tenant)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>

              <button
                onClick={() => setDeletingId(tenant.id)}
                className="flex items-center justify-center py-2 px-2.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === 'add' ? 'Add New Tenant' : 'Edit Tenant'}
        subtitle={drawerMode === 'add' ? 'Fill in the tenant details below' : `Editing ${form.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Tenant User *
            </label>
            <select
              value={form.user_id}
              onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
              className={fieldCls(errors.user_id)}
            >
              <option value="">— Select tenant user —</option>
              {tenantUsers
                .filter((u) => drawerMode === 'add' || String(u.id) !== String(form.user_id))
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              {drawerMode === 'edit' && form.user_id && !tenantUsers.some((u) => String(u.id) === String(form.user_id)) && (
                <option value={form.user_id}>Current linked user</option>
              )}
            </select>
            {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Tenant Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Tenant User"
              className={fieldCls(errors.name)}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Assigned Unit
            </label>
            <select
              value={form.unit_id}
              onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))}
              className={fieldCls(errors.unit_id)}
            >
              <option value="">— No unit assigned —</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_number} ({unit.building_name || '—'})
                </option>
              ))}
            </select>
            {errors.unit_id && <p className="text-xs text-red-500 mt-1">{errors.unit_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="e.g. tenant@example.com"
              className={fieldCls(errors.email)}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Phone Number
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. 09123456789"
                className={fieldCls(errors.phone)}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Contact Person
              </label>
              <input
                value={form.contact_person}
                onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                placeholder="e.g. Maria Dela Cruz"
                className={fieldCls(errors.contact_person)}
              />
              {errors.contact_person && (
                <p className="text-xs text-red-500 mt-1">{errors.contact_person}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Contact Person Phone
            </label>
            <input
              value={form.contact_person_phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, contact_person_phone: e.target.value }))
              }
              placeholder="e.g. 09987654321"
              className={fieldCls(errors.contact_person_phone)}
            />
            {errors.contact_person_phone && (
              <p className="text-xs text-red-500 mt-1">{errors.contact_person_phone}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Move In Date
              </label>
              <input
                type="date"
                value={form.move_in_date}
                onChange={(e) => setForm((f) => ({ ...f, move_in_date: e.target.value }))}
                className={fieldCls(errors.move_in_date)}
              />
              {errors.move_in_date && (
                <p className="text-xs text-red-500 mt-1">{errors.move_in_date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Move Out Date
              </label>
              <input
                type="date"
                value={form.move_out_date}
                onChange={(e) => setForm((f) => ({ ...f, move_out_date: e.target.value }))}
                className={fieldCls(errors.move_out_date)}
              />
              {errors.move_out_date && (
                <p className="text-xs text-red-500 mt-1">{errors.move_out_date}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className={fieldCls(errors.status)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="moved_out">Moved Out</option>
            </select>
            {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
            >
              {submitting
                ? 'Saving...'
                : drawerMode === 'add'
                  ? 'Add Tenant'
                  : 'Save Changes'}
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={!!viewTenant}
        onClose={() => setViewTenant(null)}
        title={viewTenant?.name}
        subtitle={viewTenant ? `${viewTenant.unit?.unit_number || 'No unit assigned'}` : ''}
      >
        {viewTenant && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Contact Info
                </p>

                {[
                  ['Email', viewTenant.email || '—'],
                  ['Phone', viewTenant.phone || '—'],
                  ['Contact Person', viewTenant.contact_person || '—'],
                  ['Contact Person Phone', viewTenant.contact_person_phone || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{v}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Lease Details
                </p>

                {[
                  ['Unit', viewTenant.unit?.unit_number || '—'],
                  ['Building', viewTenant.unit?.building_name || '—'],
                  ['Floor', viewTenant.unit?.floor || '—'],
                  ['Status', viewTenant.status || '—'],
                  ['Move In', viewTenant.move_in_date ? String(viewTenant.move_in_date).slice(0, 10) : '—'],
                  ['Move Out', viewTenant.move_out_date ? String(viewTenant.move_out_date).slice(0, 10) : '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm capitalize">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
