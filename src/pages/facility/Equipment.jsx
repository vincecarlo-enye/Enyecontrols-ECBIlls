import { useState } from 'react'
import { Cpu, Plus, Wifi, WifiOff, X } from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import MeterOverviewPanel from '@/components/meters/MeterOverviewPanel'
import { FacilityPageSkeleton } from '@/components/skeletons'
import equipmentData from '@/data/equipment.json'

const INITIAL_METERS = equipmentData.meters

const EMPTY_FORM = { type: 'Electric', name: '', assigned: '', status: 'online' }

const statusIcon = { online: <Wifi className="w-4 h-4 text-emerald-500" />, offline: <WifiOff className="w-4 h-4 text-slate-400" />, warning: <WifiOff className="w-4 h-4 text-amber-500" /> }
const statusBadge = {
  online: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  offline: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}
const typeBadge = {
  Electric: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Water: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Thermal: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function EquipmentStatus() {
  const loading = usePageLoader(700)
  const [meters, setMeters] = useState(INITIAL_METERS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  if (loading) return <FacilityPageSkeleton />

  const online = meters.filter(m => m.status === 'online').length
  const offline = meters.filter(m => m.status === 'offline').length
  const warning = meters.filter(m => m.status === 'warning').length

  const handleAdd = () => {
    if (!form.name.trim() || !form.assigned.trim()) return
    const newMeter = {
      ...form,
      id: `M-${String(Date.now()).slice(-4)}`,
      lastRead: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
    setMeters(prev => [...prev, newMeter])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const field = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all'

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Equipment Status</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage meters, sensors, and equipment assignments</p>
        </div>
        {/* <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Register Meter
        </button> */}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Online', value: online, color: 'text-emerald-600' },
          { label: 'Offline', value: offline, color: 'text-slate-500' },
          { label: 'Warning', value: warning, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Register Form */}
      {/* {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">Register New Meter</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Meter Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Electric Meter E-205" className={field} />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Assigned To *</label>
              <input value={form.assigned} onChange={e => setForm(f => ({ ...f, assigned: e.target.value }))} placeholder="e.g., Unit 205 or 2nd Floor" className={field} />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={field}>
                {['Electric', 'Water', 'Thermal'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleAdd} className="w-full py-2.5 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all">
                Add Meter
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* Meters Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Meter ID</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Name</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Assigned To</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Last Reading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {meters.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{m.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{m.name}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeBadge[m.type]}`}>{m.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{m.assigned}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadge[m.status]}`}>
                      {statusIcon[m.status]}
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{m.lastRead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
