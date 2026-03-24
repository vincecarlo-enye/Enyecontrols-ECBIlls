/**
 * pages/admin/BillingConcerns.jsx
 * Admin view — "Billing Concerns" tab under Tenant Reports.
 * Admin can view all tickets, filter, assign to Finance, reject, or request info.
 */

import { useState } from 'react'
import { Search, Ticket, Eye, UserCheck, XCircle, Info, Filter } from 'lucide-react'
import { useBillingConcerns } from '@/context/BillingConcernContext'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import TicketStatusBadge from '@/components/billing/concerns/TicketStatusBadge'
import ConcernDetails from '@/components/billing/concerns/ConcernDetails'

const ALL_STATUSES = ['all', 'pending', 'assigned', 'investigating', 'resolved', 'adjusted', 'closed', 'rejected', 'reopened']

export default function AdminBillingConcerns() {
  const loading = usePageLoader(600)
  const { concerns, assignToFinance, rejectTicket, requestMoreInfo } = useBillingConcerns()
  const { addToast } = useApp()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState(null)

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-64" />
      {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
    </div>
  )

  const filtered = concerns.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.id.toLowerCase().includes(q) ||
      c.tenantName.toLowerCase().includes(q) ||
      c.unit.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.billId.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    total: concerns.length,
    pending: concerns.filter(c => c.status === 'pending').length,
    assigned: concerns.filter(c => c.status === 'assigned').length,
    resolved: concerns.filter(c => ['resolved', 'adjusted', 'closed'].includes(c.status)).length,
  }

  const handleAction = (id, action, note) => {
    if (action === 'assignToFinance') {
      assignToFinance(id, note)
      addToast('Ticket assigned to Finance team.', 'success')
    } else if (action === 'reject') {
      rejectTicket(id, note)
      addToast('Ticket rejected.', 'error')
    } else if (action === 'requestInfo') {
      requestMoreInfo(id, note)
      addToast('More information requested from tenant.', 'info')
    }
  }

  const openDetail = (c) => { setSelectedConcern(c); setDetailOpen(true) }

  return (
    <div className="space-y-5 animate-in">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 m-6">
        {[
          { label: 'Total',    value: counts.total,    cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Pending',  value: counts.pending,  cls: 'text-amber-600 dark:text-amber-400' },
          { label: 'Assigned', value: counts.assigned, cls: 'text-purple-600 dark:text-purple-400' },
          { label: 'Resolved', value: counts.resolved, cls: 'text-emerald-600 dark:text-emerald-400' },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4 shadow-md">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="font-semibold text-[14px] text-slate-800 dark:text-white">All Tickets</p>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all w-44"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="w-3 h-3 text-slate-400" />
              {ALL_STATUSES.slice(0, 6).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                    statusFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '900px' }}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                {['Ticket ID', 'Bill ID', 'Tenant', 'Unit', 'Category', 'Date', 'Status', 'Actions'].map((col) => (
                  <th key={col} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">No tickets found</td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.id}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">{c.billId}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">{c.tenantName}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{c.unit}</td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{c.category}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{c.dateSubmitted}</td>
                  <td className="px-4 py-3.5">
                    <TicketStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDetail(c)}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(c.status === 'pending' || c.status === 'reopened') && (
                        <button
                          onClick={() => { assignToFinance(c.id, ''); addToast('Assigned to Finance.', 'success') }}
                          className="p-2 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          title="Assign to Finance"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      {c.status === 'pending' && (
                        <>
                          <button
                            onClick={() => { requestMoreInfo(c.id, ''); addToast('More info requested.', 'info') }}
                            className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title="Request More Info"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { rejectTicket(c.id, ''); addToast('Ticket rejected.', 'error') }}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConcernDetails
        concern={selectedConcern}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        role="admin"
        onAction={handleAction}
      />
    </div>
  )
}
