import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import { UnitsSkeleton } from '@/components/skeletons'
import Drawer from '@/components/ui/Drawer'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { Building2, Zap, Droplets, Plus, CheckCircle2, Circle, Edit3, Trash2, Gauge } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'

const emptyForm = { unit: '', floor: '', sqm: '', tenant: '', status: 'vacant', meterElec: '', meterWater: '' }

export default function Units() {
  const loading = usePageLoader(700)
  const { units, addUnit, updateUnit, deleteUnit } = useApp()
  const { user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('add')
  const [form, setForm]             = useState(emptyForm)
  const [errors, setErrors]         = useState({})
  const [editingId, setEditingId]   = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  if (loading) return <UnitsSkeleton />

  const occupied = units.filter(u => u.status === 'occupied').length
  const vacant   = units.filter(u => u.status === 'vacant').length

  const isSuperAdmin = user?.role === 'super_admin'


  const validate = () => {
    const e = {}
    if (!form.unit.trim()) e.unit = 'Unit number required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = () => {
    setForm(emptyForm); setErrors({})
    setDrawerMode('add'); setDrawerOpen(true)
  }

  const openEdit = (unit) => {
    setForm({ unit: unit.unit, floor: String(unit.floor), sqm: String(unit.sqm), tenant: unit.tenant || '',
              status: unit.status, meterElec: unit.meterElec, meterWater: unit.meterWater })
    setErrors({}); setEditingId(unit.id)
    setDrawerMode('edit'); setDrawerOpen(true)
  }

  const handleSubmit = () => {
    if (!validate()) return
    const data = { ...form, floor: Number(form.floor)||0, sqm: Number(form.sqm)||0, tenant: form.tenant || null }
    if (drawerMode === 'add') addUnit(data)
    else updateUnit(editingId, data)
    setDrawerOpen(false)
  }

  const fieldCls = (err) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${err ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'} text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all`

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-700 text-xl text-slate-800 dark:text-white">Units</h2>
          <p className="text-sm text-slate-400 mt-0.5">{units.length} units total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Add Unit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4" style={{maxWidth:'320px'}}>
        {[
          { label: 'Total',    value: units.length, color: 'text-slate-700 dark:text-white' },
          { label: 'Occupied', value: occupied,     color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Vacant',   value: vacant,       color: 'text-amber-600 dark:text-amber-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center shadow-sm">
            <p className={`text-2xl font-display font-700 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Meter Overview — super_admin only */}
      {isSuperAdmin && (
        <MeterOverviewPanel compact />
      )}

      {/* Units grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map(unit => (
          <div key={unit.id} className="glass rounded-2xl p-4 shadow-md card-hover group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${unit.status === 'occupied' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <Building2 className={`w-4 h-4 ${unit.status === 'occupied' ? 'text-white' : 'text-slate-400'}`} strokeWidth={1.8} />
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg capitalize ${unit.status === 'occupied' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'}`}>
                {unit.status === 'occupied' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
                {unit.status}
              </span>
            </div>

            <p className="font-display font-700 text-lg text-slate-800 dark:text-white">{unit.unit}</p>
            <p className="text-xs text-slate-400 mb-3">Floor {unit.floor} · {unit.sqm} m²</p>

            {unit.tenant
              ? <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-lg px-2.5 py-1.5 truncate mb-3">{unit.tenant}</p>
              : <p className="text-xs text-slate-400 italic mb-3">No tenant assigned</p>}

            <div className="space-y-1 text-[10px] font-mono text-slate-400 mb-3">
              <div className="flex items-center gap-1.5"><Zap className="w-3 h-3" /><span>{unit.meterElec}</span></div>
              <div className="flex items-center gap-1.5"><Droplets className="w-3 h-3" /><span>{unit.meterWater}</span></div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => openEdit(unit)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => setDeletingId(unit.id)}
                className="flex items-center justify-center py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add / Edit Drawer ─────────────────────────────────── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === 'add' ? 'Add New Unit' : `Edit Unit ${form.unit}`}
        subtitle="Fill in the unit details below"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Unit Number *</label>
            <input value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}
              placeholder="e.g. 12F-A" className={fieldCls(errors.unit)} />
            {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Floor</label>
              <input type="number" value={form.floor} onChange={e => setForm(f => ({...f, floor: e.target.value}))}
                placeholder="e.g. 12" className={fieldCls(false)} />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Area (m²)</label>
              <input type="number" value={form.sqm} onChange={e => setForm(f => ({...f, sqm: e.target.value}))}
                placeholder="e.g. 248" className={fieldCls(false)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tenant (optional)</label>
            <input value={form.tenant} onChange={e => setForm(f => ({...f, tenant: e.target.value}))}
              placeholder="Leave blank if vacant" className={fieldCls(false)} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={fieldCls(false)}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Elec Meter ID</label>
              <input value={form.meterElec} onChange={e => setForm(f => ({...f, meterElec: e.target.value}))}
                placeholder="e.g. ME-12A" className={fieldCls(false)} />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Water Meter ID</label>
              <input value={form.meterWater} onChange={e => setForm(f => ({...f, meterWater: e.target.value}))}
                placeholder="e.g. MW-12A" className={fieldCls(false)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setDrawerOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {drawerMode === 'add' ? 'Add Unit' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        isOpen={!!deletingId}
        title="Remove Unit?"
        message="This unit record will be permanently removed. This cannot be undone."
        confirmLabel="Remove Unit"
        onConfirm={() => { deleteUnit(deletingId); setDeletingId(null) }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
