import { useState } from 'react'
import { Wrench, Plus, X } from 'lucide-react'
import { useFacilityMaintenance } from '@/hooks/facilityHooks/useFacilityMaintenance'
import { useApp } from '@/context/AppContext'
import PaginationBar from '@/components/common/PaginationBar'
import { useClientPagination } from '@/hooks/useClientPagination'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

const priorityBadge = {
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const statusBadge = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'in-progress': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const EMPTY = { title: '', type: 'Plumbing', priority: 'medium', technician: '', status: 'open' }

export default function Maintenance() {
  const { addToast } = useApp()
  const { tickets, loading, saving, error, stats, createTicket, updateStatus } = useFacilityMaintenance()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [formErrors, setFormErrors] = useState({})
  const pagination = useClientPagination(tickets, 10)

  const isInitialLoading = loading && tickets.length === 0 && !error
  const isRefreshing = loading && tickets.length > 0
  const handleCreate = async () => {
    if (!form.title.trim()) {
      setFormErrors({ title: 'Issue title is required.' })
      return
    }

    const result = await createTicket({
      title: form.title,
      type: form.type,
      priority: form.priority,
      technician: form.technician === 'Unassigned' ? '' : form.technician,
      status: form.status,
    })

    if (!result.success) {
      setFormErrors({ title: result?.errors?.title?.[0] || '' })
      addToast(result.message, 'error')
      return
    }

    addToast(result.message, 'success')
    setForm(EMPTY)
    setFormErrors({})
    setShowForm(false)
  }

  const handleStatusChange = async (ticketId, status) => {
    const result = await updateStatus(ticketId, status)
    addToast(result.message, result.success ? 'success' : 'error')
  }

  const field = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all'

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white">Maintenance Requests</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track and manage utility-related incidents</p>
        </div>
        <div className="flex items-center gap-2 w-full justify-end sm:w-auto sm:justify-start">
  <UpdatingBadge show={isRefreshing} />

  <button
    onClick={() => setShowForm(true)}
    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
  >
    <Plus className="w-4 h-4" />
    New Ticket
  </button>
</div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Open', value: stats.open, color: 'text-blue-600' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-violet-600' },
          { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm text-center">
            <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={s.value} className={`text-3xl font-bold ${s.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">Create Maintenance Ticket</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Issue Title *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Describe the issue..." className={field} />
              {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={field}>
                {['Plumbing', 'Electrical', 'Thermal', 'HVAC', 'Structural', 'Other'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className={field}>
                {['low', 'medium', 'high', 'critical'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Technician</label>
              <input
                value={form.technician}
                onChange={(e) => setForm((f) => ({ ...f, technician: e.target.value }))}
                placeholder="Enter technician name or leave blank"
                className={field}
              />
            </div>
            <div className="flex items-end">
              <button onClick={handleCreate} disabled={saving} className="w-full py-2.5 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">ID</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Issue</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Technician</th>
                <th className="text-center px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isInitialLoading ? (
                <TableLoadingRow colSpan={7} />
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">No maintenance tickets yet.</td>
                </tr>
              ) : pagination.pagedItems.map((t) => (
                <tr key={t.ticket_id || t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{t.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200 max-w-[200px]">{t.title}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{t.type}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${priorityBadge[t.priority] || priorityBadge.medium}`}>{t.priority}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{t.technician || '-'} </td>
                  <td className="px-5 py-3.5 text-center">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.ticket_id, e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer ${statusBadge[t.status] || statusBadge.open}`}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <PaginationBar
            meta={pagination.meta}
            page={pagination.page}
            perPage={pagination.perPage}
            onPageChange={pagination.setPage}
            onPerPageChange={(value) => {
              pagination.setPerPage(value)
              pagination.setPage(1)
            }}
          />
        </div>
      </div>
    </div>
  )
}
