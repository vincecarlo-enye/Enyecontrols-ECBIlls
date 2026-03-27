/**
 * pages/admin/BillingConcerns.jsx
 * Admin view for billing concern tickets.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Eye,
  UserCheck,
  XCircle,
  Info,
  Filter,
} from 'lucide-react'
import {
  assignBillingConcern,
  fetchAdminBillingConcerns,
  fetchFinanceUsers,
  updateAdminBillingConcernStatus,
} from '@/services/adminService/adminBillingConcernService'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import TicketStatusBadge from '@/components/billing/concerns/TicketStatusBadge'
import ConcernDetails from '@/components/billing/concerns/ConcernDetails'

const ALL_STATUSES = [
  'all',
  'pending',
  'assigned',
  'investigating',
  'resolved',
  'adjusted',
  'closed',
  'rejected',
  'reopened',
]

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeConcern(item = {}) {
  return {
    id: String(item?.id ?? ''),
    billId: String(item?.bill_id ?? item?.bill?.id ?? '—'),
    tenantName: item?.tenant?.name ?? 'Unknown tenant',
    email: item?.tenant?.email ?? '',
    unit:
      item?.tenant?.unit?.unit_number ??
      item?.unit?.unit_number ??
      item?.unit?.building_name ??
      '—',
    category: item?.category ?? 'general',
    subject: item?.subject ?? '',
    message: item?.description ?? item?.message ?? '',
    priority: item?.priority ?? 'medium',
    status: item?.status ?? 'pending',
    dateSubmitted: formatDate(item?.created_at),
    createdAt: item?.created_at ?? '',
    adminNotes: item?.admin_notes ?? '',
    financeNotes: item?.finance_notes ?? '',
    assignedTo: item?.assignee?.name ?? '',
    tenant: item?.tenant ?? null,
    raw: item,
  }
}

export default function AdminBillingConcerns() {
  const loading = usePageLoader(600)
  const { addToast } = useApp()

  const [concerns, setConcerns] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState(null)
  const [financeUsers, setFinanceUsers] = useState([])
  const [assignUserId, setAssignUserId] = useState('')
  const [assignTarget, setAssignTarget] = useState(null)

  useEffect(() => {
    const loadConcerns = async () => {
      try {
        setPageLoading(true)
        setError('')
        const [concernsRes, financeRes] = await Promise.all([
          fetchAdminBillingConcerns(),
          fetchFinanceUsers(),
        ])
        const rows = Array.isArray(concernsRes?.data) ? concernsRes.data : []
        const financeRows = Array.isArray(financeRes?.data) ? financeRes.data : []
        setConcerns(rows.map(normalizeConcern))
        setFinanceUsers(financeRows)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load billing concerns.')
      } finally {
        setPageLoading(false)
      }
    }

    loadConcerns()
  }, [])

  const filtered = concerns.filter((concern) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      concern.id.toLowerCase().includes(q) ||
      concern.tenantName.toLowerCase().includes(q) ||
      String(concern.unit).toLowerCase().includes(q) ||
      String(concern.category).toLowerCase().includes(q) ||
      String(concern.billId).toLowerCase().includes(q)

    const matchStatus = statusFilter === 'all' || concern.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = useMemo(
    () => ({
      total: concerns.length,
      pending: concerns.filter((c) => c.status === 'pending').length,
      assigned: concerns.filter((c) => c.status === 'assigned').length,
      resolved: concerns.filter((c) =>
        ['resolved', 'adjusted', 'closed'].includes(c.status)
      ).length,
    }),
    [concerns]
  )

  if (loading || pageLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-64" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    )
  }

  const syncConcern = (updatedRow) => {
    const updated = normalizeConcern(updatedRow)
    setConcerns((prev) =>
      prev.map((item) => (String(item.id) === String(updated.id) ? updated : item))
    )
    setSelectedConcern((prev) =>
      prev && String(prev.id) === String(updated.id) ? updated : prev
    )
  }

  const handleAction = async (id, action, note) => {
    try {
      setSubmitting(true)

      if (action === 'assignToFinance') {
        const res = await assignBillingConcern(id, { assigned_to: Number(assignUserId) })
        if (res?.data) syncConcern(res.data)
        setAssignTarget(null)
        setAssignUserId('')
        addToast('Ticket assigned to Finance team.', 'success')
      } else if (action === 'reject') {
        const res = await updateAdminBillingConcernStatus(id, {
          status: 'rejected',
          admin_notes: note,
        })
        if (res?.data) syncConcern(res.data)
        addToast('Ticket rejected.', 'error')
      } else if (action === 'requestInfo') {
        const res = await updateAdminBillingConcernStatus(id, {
          status: 'pending',
          admin_notes: note,
        })
        if (res?.data) syncConcern(res.data)
        addToast('More information requested from tenant.', 'info')
      }
    } catch (err) {
      addToast(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update ticket.',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const openDetail = (concern) => {
    setSelectedConcern(concern)
    setDetailOpen(true)
  }

  const openAssignModal = (concern) => {
    setAssignTarget(concern)
    setAssignUserId('')
  }

  return (
    <div className="space-y-5 animate-in">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mx-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 m-6">
        {[
          { label: 'Total', value: counts.total, cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Pending', value: counts.pending, cls: 'text-amber-600 dark:text-amber-400' },
          { label: 'Assigned', value: counts.assigned, cls: 'text-purple-600 dark:text-purple-400' },
          { label: 'Resolved', value: counts.resolved, cls: 'text-emerald-600 dark:text-emerald-400' },
        ].map((item) => (
          <div key={item.label} className="glass rounded-2xl p-4 shadow-md">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.cls}`}>{item.value}</p>
          </div>
        ))}
      </div>

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
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all w-44"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="w-3 h-3 text-slate-400" />
              {ALL_STATUSES.slice(0, 6).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {status}
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
                  <th key={col} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filtered.map((concern) => (
                  <tr
                    key={concern.id}
                    className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {concern.id}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {concern.billId}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                      {concern.tenantName}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {concern.unit}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                      {concern.category}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {concern.dateSubmitted}
                    </td>
                    <td className="px-4 py-3.5">
                      <TicketStatusBadge status={concern.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetail(concern)}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(concern.status === 'pending' || concern.status === 'reopened') && (
                          <button
                            onClick={() => openAssignModal(concern)}
                            className="p-2 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            title="Assign to Finance"
                            disabled={submitting}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {concern.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(concern.id, 'requestInfo', '')}
                              className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              title="Request More Info"
                              disabled={submitting}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(concern.id, 'reject', '')}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Reject"
                              disabled={submitting}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
            <h3 className="font-display font-700 text-lg text-slate-800 dark:text-white mb-1">
              Assign Finance
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Assign this billing concern to a finance user.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Concern</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {assignTarget.subject}
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Finance User
                </label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all"
                >
                  <option value="">Select finance user</option>
                  {financeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setAssignTarget(null)
                    setAssignUserId('')
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleAction(assignTarget.id, 'assignToFinance', '')}
                  disabled={!assignUserId || submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-all"
                >
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
