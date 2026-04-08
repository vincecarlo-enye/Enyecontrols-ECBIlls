import { useEffect, useMemo, useState } from 'react'
import { Search, Ticket, Eye, Search as SearchIcon, CheckCircle2, DollarSign, Filter } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { usePageLoader } from '@/hooks/usePageLoader'
import TicketStatusBadge from '@/components/billing/concerns/TicketStatusBadge'
import ConcernDetails from '@/components/billing/concerns/ConcernDetails'
import api from '@/lib/api'

const FINANCE_STATUSES = ['all', 'assigned', 'awaiting_tenant', 'investigating', 'resolved', 'adjusted', 'rejected']

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildTimeline(row) {
  if (Array.isArray(row?.timeline) && row.timeline.length > 0) {
    return row.timeline.map((entry) => ({
      id: entry.id,
      role: entry.role || 'admin',
      action: entry.action,
      by: entry.by || 'System',
      date: formatDate(entry.date),
      note: entry.note || '',
    }))
  }

  const timeline = []
  if (row?.created_at) {
    timeline.push({
      id: `created-${row.id}`,
      role: 'tenant',
      action: 'Concern submitted',
      by: row?.tenant?.name || 'Tenant',
      date: formatDate(row.created_at),
      note: row?.description || '',
    })
  }

  if (row?.assignedBy?.name) {
    timeline.push({
      id: `assigned-${row.id}`,
      role: 'admin',
      action: 'Assigned to Finance',
      by: row.assignedBy.name,
      date: formatDate(row.updated_at || row.created_at),
      note: row?.admin_notes || '',
    })
  }

  if (row?.admin_notes) {
    timeline.push({
      id: `note-${row.id}`,
      role: 'finance',
      action: 'Finance update',
      by: row?.assignee?.name || 'Finance',
      date: formatDate(row.updated_at || row.created_at),
      note: row.admin_notes,
    })
  }

  return timeline
}

function normalizeConcern(row = {}) {
  return {
    id: String(row?.id ?? ''),
    billId: String(row?.bill_id ?? row?.bill?.id ?? ''),
    tenantName: row?.tenant?.name || '',
    company: row?.tenant?.name || '',
    email: row?.tenant?.email || '',
    unit: row?.tenant?.unit?.unit_number || row?.tenant?.unit?.name || '',
    category: row?.category || row?.subject || 'General',
    subject: row?.subject || '',
    message: row?.description || '',
    status: String(row?.status || 'assigned').toLowerCase(),
    rawStatus: row?.status || 'pending',
    assignedTo: row?.assignee?.name || 'finance',
    adminNotes: row?.admin_notes || '',
    financeNotes: row?.admin_notes || '',
    dateSubmitted: formatDate(row?.created_at),
    createdAt: row?.created_at || '',
    updatedAt: row?.updated_at || '',
    timeline: buildTimeline(row),
    raw: row,
  }
}

export default function FinanceBillingTickets() {
  const pageLoading = usePageLoader(600)
  const { addToast } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState(null)
  const [concerns, setConcerns] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')

  const loadConcerns = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/finance/billing-concerns')
      setConcerns((Array.isArray(response?.data?.data) ? response.data.data : []).map(normalizeConcern))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load finance billing tickets.')
      setConcerns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConcerns()
  }, [])

  const filtered = useMemo(() => concerns.filter((concern) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      concern.id.toLowerCase().includes(q) ||
      concern.tenantName.toLowerCase().includes(q) ||
      concern.unit.toLowerCase().includes(q) ||
      concern.category.toLowerCase().includes(q) ||
      concern.billId.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || concern.status === statusFilter
    return matchSearch && matchStatus
  }), [concerns, search, statusFilter])

  const counts = useMemo(() => ({
    total: concerns.length,
    assigned: concerns.filter((concern) => concern.status === 'assigned').length,
    investigating: concerns.filter((concern) => ['investigating', 'awaiting_tenant'].includes(concern.status)).length,
    resolved: concerns.filter((concern) => ['resolved', 'adjusted', 'closed', 'rejected'].includes(concern.status)).length,
  }), [concerns])

  const loadingState = pageLoading || loading
  if (loadingState) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-64" />
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
      </div>
    )
  }

  const handleAction = async (id, action, note) => {
    const endpointMap = {
      investigate: 'investigate',
      respond: 'respond',
      resolve: 'resolve',
      adjust: 'adjust',
    }

    const endpoint = endpointMap[action]
    if (!endpoint) return

    try {
      setActing(true)
      await api.post(`/api/finance/billing-concerns/${id}/${endpoint}`, { note })
      await loadConcerns()
      addToast({
        investigate: 'Investigation started.',
        respond: 'Response sent to tenant.',
        resolve: 'Ticket resolved.',
        adjust: 'Bill adjustment recorded.',
      }[action], 'success')
      return true
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update billing ticket.'
      setError(message)
      addToast(message, 'error')
      throw err
    } finally {
      setActing(false)
    }
  }

  const openDetail = (concern) => {
    setSelectedConcern(concern)
    setDetailOpen(true)
  }

  const quickAction = async (concern, action) => {
    await handleAction(concern.id, action, '')
  }

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-emerald-500" /> Finance Billing Tickets
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage and resolve assigned billing concerns</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Assigned', value: counts.total, cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'New', value: counts.assigned, cls: 'text-amber-600 dark:text-amber-400' },
          { label: 'Investigating', value: counts.investigating, cls: 'text-purple-600 dark:text-purple-400' },
          { label: 'Resolved', value: counts.resolved, cls: 'text-emerald-600 dark:text-emerald-400' },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl p-4 shadow-md">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.cls}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {counts.assigned > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-5 py-3.5">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            {counts.assigned} new ticket{counts.assigned > 1 ? 's' : ''} awaiting your review
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="font-semibold text-[14px] text-slate-800 dark:text-white">Assigned Tickets</p>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all w-40"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="w-3 h-3 text-slate-400" />
              {FINANCE_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${statusFilter === status ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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
                  <th key={col} className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    {concerns.length === 0 ? 'No tickets assigned yet.' : 'No matching tickets found.'}
                  </td>
                </tr>
              ) : filtered.map((concern) => (
                <tr key={concern.id} className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{concern.id}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">{concern.billId}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">{concern.tenantName}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{concern.unit}</td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{concern.category}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{concern.dateSubmitted}</td>
                  <td className="px-4 py-3.5"><TicketStatusBadge status={concern.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(concern)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {concern.status === 'assigned' && (
                        <button onClick={() => quickAction(concern, 'investigate')} disabled={acting} className="p-2 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" title="Start Investigating">
                          <SearchIcon className="w-4 h-4" />
                        </button>
                      )}
                      {(concern.status === 'assigned' || concern.status === 'investigating') && (
                        <>
                          <button onClick={() => quickAction(concern, 'resolve')} disabled={acting} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Resolve">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => quickAction(concern, 'adjust')} disabled={acting} className="p-2 rounded-lg text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors" title="Adjust Bill">
                            <DollarSign className="w-4 h-4" />
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
        role="finance"
        onAction={handleAction}
      />
    </div>
  )
}
