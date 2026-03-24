import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantListSkeleton } from '@/components/skeletons'
import Drawer from '@/components/ui/Drawer'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { Plus, Search, CheckCircle2, XCircle, Mail, Phone, Building2, Eye, Edit3, Trash2, User, X } from 'lucide-react'

const emptyForm = { name: '', email: '', phone: '', units: [''], floor: '', contact: '', status: 'active', since: '' }

const statusConfig = {
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  unpaid:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function Tenants() {
  const loading = usePageLoader(700)
  const { tenants, addTenant, updateTenant, deleteTenant, units: allUnits, bills: allBills } = useApp()
  const [search, setSearch]         = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('add')
  const [form, setForm]             = useState(emptyForm)
  const [errors, setErrors]         = useState({})
  const [editingId, setEditingId]   = useState(null)
  const [viewTenant, setViewTenant] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [billView, setBillView]     = useState('total') // 'total' | 'perunit'

  if (loading) return <TenantListSkeleton />

  const filtered = tenants.filter(t => {
    const unitStr = Array.isArray(t.units) ? t.units.join(' ') : (t.unit || '')
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      unitStr.toLowerCase().includes(search.toLowerCase())
    )
  })

  // Get units that are occupied by OTHER tenants (not the one being edited)
  const getOccupiedByOthers = (currentEditingId) => {
    return tenants
      .filter(t => t.id !== currentEditingId)
      .flatMap(t => Array.isArray(t.units) ? t.units : [t.unit].filter(Boolean))
  }

  // Available vacant units for a given tenant (editing or adding)
  const getAvailableUnits = (currentEditingId, currentAssignedUnits) => {
    const occupiedByOthers = getOccupiedByOthers(currentEditingId)
    return allUnits.filter(u =>
      !occupiedByOthers.includes(u.unit) || currentAssignedUnits.includes(u.unit)
    )
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Name required'
    if (!form.email.trim()) e.email = 'Email required'
    const validUnits = (form.units || []).filter(u => u && u.trim())
    if (validUnits.length === 0) e.units = 'At least one unit required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = () => {
    setForm(emptyForm); setErrors({})
    setDrawerMode('add'); setDrawerOpen(true)
  }

  const openEdit = (tenant) => {
    const tenantUnits = Array.isArray(tenant.units) ? tenant.units : (tenant.unit ? [tenant.unit] : [''])
    setForm({
      name: tenant.name, email: tenant.email, phone: tenant.phone || '',
      units: tenantUnits.length > 0 ? tenantUnits : [''],
      floor: String(tenant.floor || ''), contact: tenant.contact || '',
      status: tenant.status, since: tenant.since || ''
    })
    setErrors({}); setEditingId(tenant.id)
    setDrawerMode('edit'); setDrawerOpen(true)
  }

  const handleSubmit = () => {
    if (!validate()) return
    const validUnits = (form.units || []).filter(u => u && u.trim())
    const data = { ...form, units: validUnits, floor: Number(form.floor) || 0 }
    if (drawerMode === 'add') addTenant(data)
    else updateTenant(editingId, data)
    setDrawerOpen(false)
  }

  // Unit row management
  const addUnitRow = () => setForm(f => ({ ...f, units: [...(f.units || ['']), ''] }))
  const removeUnitRow = (idx) => setForm(f => {
    const next = (f.units || ['']).filter((_, i) => i !== idx)
    return { ...f, units: next.length === 0 ? [''] : next }
  })
  const setUnitAtIndex = (idx, val) => setForm(f => {
    const next = [...(f.units || [''])]
    next[idx] = val
    return { ...f, units: next }
  })

  const fieldCls = (err) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'} text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`

  // Billing for view modal
  const tenantBills = viewTenant
    ? allBills.filter(b => b.tenant === viewTenant.name)
    : []

  const totalBill = tenantBills.reduce((acc, b) => ({
    electricity: acc.electricity + (b.breakdown?.electricity || 0),
    water: acc.water + (b.breakdown?.water || 0),
    thermal: acc.thermal + (b.breakdown?.thermal || 0),
    amount: acc.amount + b.amount,
  }), { electricity: 0, water: 0, thermal: 0, amount: 0 })

  // Per-unit bills
  const perUnitBills = viewTenant
    ? (Array.isArray(viewTenant.units) ? viewTenant.units : [viewTenant.unit]).map(unitName => ({
        unit: unitName,
        bills: tenantBills.filter(b => b.unit === unitName),
      }))
    : []

  const currentAssigned = form.units || ['']
  const availableUnits = getAvailableUnits(editingId, currentAssigned)

  return (
    <div className="space-y-6 animate-in min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Tenants</h2>
          <p className="text-sm text-slate-400 mt-0.5">{tenants.length} registered tenants</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No tenants found.</p>
          </div>
        )}
        {filtered.map(tenant => {
          const tenantUnits = Array.isArray(tenant.units) ? tenant.units : (tenant.unit ? [tenant.unit] : [])
          return (
            <div key={tenant.id} className="glass rounded-2xl p-5 shadow-md card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{tenant.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {tenantUnits.slice(0, 2).map(u => (
                        <span key={u} className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">{u}</span>
                      ))}
                      {tenantUnits.length > 2 && (
                        <span className="text-[10px] font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">+{tenantUnits.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'}`}>
                  {tenant.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {tenant.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{tenant.email}</span>
                </div>
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">{tenant.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Tenant since <span className="font-medium text-slate-600 dark:text-slate-300">{tenant.since}</span></span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {tenantUnits.length} unit{tenantUnits.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => { setViewTenant(tenant); setBillView('total') }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => openEdit(tenant)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setDeletingId(tenant.id)}
                  className="flex items-center justify-center py-2 px-2.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Add / Edit Drawer ─────────────────────────────────── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === 'add' ? 'Add New Tenant' : 'Edit Tenant'}
        subtitle={drawerMode === 'add' ? 'Fill in the tenant details below' : `Editing ${form.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tenant *</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              placeholder="e.g. ABC Corporation" className={fieldCls(errors.name)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Contact Person</label>
            <input value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))}
              placeholder="e.g. Juan Dela Cruz" className={fieldCls(false)} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
              placeholder="e.g. juan@tenant.com" className={fieldCls(errors.email)} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
            <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
              placeholder="e.g. +63 917 123 4567" className={fieldCls(false)} />
          </div>

          {/* Multi-unit assignment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">Assigned Units *</label>
              <span className="text-[10px] text-slate-400">{(form.units || ['']).filter(Boolean).length} assigned</span>
            </div>
            {errors.units && <p className="text-xs text-red-500 mb-2">{errors.units}</p>}

            <div className="space-y-2">
              {(form.units || ['']).map((unitVal, idx) => {
                // Available options: vacant units + currently assigned unit at this slot
                const otherSlots = (form.units || ['']).filter((_, i) => i !== idx).filter(Boolean)
                const options = availableUnits.filter(u => !otherSlots.includes(u.unit))
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={unitVal}
                      onChange={e => setUnitAtIndex(idx, e.target.value)}
                      className={`flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`}
                    >
                      <option value="">— Select a unit —</option>
                      {options.map(u => (
                        <option key={u.id} value={u.unit}>
                          {u.unit} (Floor {u.floor}, {u.sqm} m²)
                        </option>
                      ))}
                    </select>
                    {(form.units || ['']).length > 1 && (
                      <button
                        onClick={() => removeUnitRow(idx)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                        title="Remove unit"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              onClick={addUnitRow}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Unit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Floor</label>
              <input type="number" value={form.floor} onChange={e => setForm(f => ({...f, floor: e.target.value}))}
                placeholder="e.g. 12" className={fieldCls(false)} />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tenant Since</label>
              <input value={form.since} onChange={e => setForm(f => ({...f, since: e.target.value}))}
                placeholder="e.g. Jan 2024" className={fieldCls(false)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={fieldCls(false)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setDrawerOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {drawerMode === 'add' ? 'Add Tenant' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Drawer>

      {/* ── View Tenant Modal ─────────────────────────────────── */}
      <Modal isOpen={!!viewTenant} onClose={() => setViewTenant(null)}
        title={viewTenant?.name}
        subtitle={viewTenant ? `${(Array.isArray(viewTenant.units) ? viewTenant.units : [viewTenant.unit]).join(', ')} · Floor ${viewTenant?.floor}` : ''}>
        {viewTenant && (
          <div className="space-y-5">
            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Contact Info</p>
                {[['Contact', viewTenant.contact], ['Email', viewTenant.email], ['Phone', viewTenant.phone || '—']].map(([k,v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{v}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Lease Details</p>
                <div>
                  <p className="text-xs text-slate-400">Units</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Array.isArray(viewTenant.units) ? viewTenant.units : [viewTenant.unit]).map(u => (
                      <span key={u} className="text-xs font-mono font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg">{u}</span>
                    ))}
                  </div>
                </div>
                {[['Floor', viewTenant.floor], ['Since', viewTenant.since], ['Status', viewTenant.status]].map(([k,v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm capitalize">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Billing History</p>
                {tenantBills.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                    {['total', 'perunit'].map(mode => (
                      <button key={mode} onClick={() => setBillView(mode)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${billView === mode ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                        {mode === 'total' ? 'Total Bill' : 'Per Unit'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {tenantBills.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No billing records found.</p>
              ) : billView === 'total' ? (
                <>
                  {/* Total combined view */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">Combined Total · All Units</p>
                    <div className="space-y-1.5 text-sm">
                      {[['Electricity', totalBill.electricity], ['Water', totalBill.water], ['Thermal', totalBill.thermal]].map(([k,v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">{k}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">₱{v.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1.5 border-t border-blue-200 dark:border-blue-800">
                        <span className="font-semibold text-slate-800 dark:text-white">TOTAL</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300">₱{totalBill.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                    <table className="w-full text-sm" style={{minWidth:'360px'}}>
                      <thead>
                        <tr className="border-b border-slate-200/60 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/40">
                          {['Month','Unit','Amount','Due Date','Status'].map(h => (
                            <th key={h} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-2.5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tenantBills.map(b => (
                          <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700/30 last:border-0">
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.month}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{b.unit}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">₱{b.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{b.dueDate}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${statusConfig[b.status] || ''}`}>{b.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* Per-unit view */
                <div className="space-y-4">
                  {perUnitBills.map(({ unit, bills: unitBills }) => {
                    const unitTotal = unitBills.reduce((s, b) => ({
                      electricity: s.electricity + (b.breakdown?.electricity || 0),
                      water: s.water + (b.breakdown?.water || 0),
                      thermal: s.thermal + (b.breakdown?.thermal || 0),
                      amount: s.amount + b.amount,
                    }), { electricity: 0, water: 0, thermal: 0, amount: 0 })
                    return (
                      <div key={unit} className="rounded-xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">{unit}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">₱{unitTotal.amount.toLocaleString()}</span>
                        </div>
                        {unitBills.length === 0 ? (
                          <p className="text-xs text-slate-400 italic px-4 py-3">No bills for this unit.</p>
                        ) : (
                          <div className="px-4 py-3 space-y-1.5 text-xs">
                            {[['Electricity', unitTotal.electricity], ['Water', unitTotal.water], ['Thermal', unitTotal.thermal]].map(([k, v]) => (
                              <div key={k} className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>{k}</span>
                                <span className="font-mono">₱{v.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Remove Tenant?"
        message="This tenant and all associated records will be permanently removed. This cannot be undone."
        confirmLabel="Remove Tenant"
        onConfirm={() => { deleteTenant(deletingId); setDeletingId(null) }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
