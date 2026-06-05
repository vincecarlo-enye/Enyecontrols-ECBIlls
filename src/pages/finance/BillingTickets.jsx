import { formatDate } from '@/utils/filterUtils'
import { useEffect, useMemo, useState } from 'react'
import { Search, Ticket, Eye, Search as SearchIcon, CheckCircle2, DollarSign, Filter, Loader2 } from 'lucide-react'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'
import { useApp } from '@/context/AppContext'
import { useModalState } from '@/hooks/useModalState'
import TicketStatusBadge from '@/components/billing/concerns/TicketStatusBadge'
import ConcernDetails from '@/components/billing/concerns/ConcernDetails'
import BillAdjustmentDrawer from '@/components/billing/adjustments/BillAdjustmentDrawer'
import { useFinanceBills } from '@/hooks/financeHooks/useFinanceBills'
import api from '@/lib/api'
import { addLocalActivityLog } from '@/services/activityLogService'
import PaginationBar from '@/components/common/PaginationBar'
import { useClientPagination } from '@/hooks/useClientPagination'

const FINANCE_STATUSES = ['all', 'assigned', 'investigating', 'resolved', 'closed', 'rejected']


function mapStatus(status) {
  const raw = String(status || '').toLowerCase()
  if (raw === 'in_progress') return 'investigating'
  if (raw === 'pending') return 'assigned'
  return raw || 'assigned'
}

function buildTimeline(row, linkedAdjustments = []) {
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

  linkedAdjustments.forEach((adjustment) => {
    const actorName = adjustment?.adjustedBy?.name || adjustment?.approvedBy?.name || 'Finance'
    const actionLabel = {
      draft: 'Adjustment draft saved',
      pending_approval: 'Adjustment submitted for approval',
      approved: 'Adjustment approved',
      applied: 'Bill adjustment applied',
      rejected: 'Adjustment request rejected',
      cancelled: 'Adjustment cancelled',
    }[adjustment?.status] || 'Adjustment updated'

    timeline.push({
      id: `adjustment-${adjustment.id}`,
      role: adjustment?.approvedBy ? 'admin' : 'finance',
      action: actionLabel,
      by: actorName,
      date: formatDate(adjustment?.effectiveAt || adjustment?.approvedAt || adjustment?.submittedAt || adjustment?.createdAt),
      note: adjustment?.reason || adjustment?.notes || '',
    })
  })

  timeline.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))

  return timeline
}

function normalizeConcern(row = {}, linkedAdjustments = []) {
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
    status: mapStatus(row?.status),
    rawStatus: row?.status || 'pending',
    assignedTo: row?.assignee?.name || 'finance',
    adminNotes: row?.admin_notes || '',
    financeNotes: row?.finance_notes || '',
    dateSubmitted: formatDate(row?.created_at),
    createdAt: row?.created_at || '',
    updatedAt: row?.updated_at || '',
    timeline: Array.isArray(row?.timeline) && row.timeline.length > 0 ? row.timeline : buildTimeline(row, linkedAdjustments),
    raw: row,
  }
}

export default function FinanceBillingTickets() {
  const { addToast } = useApp()
  const { getBillById, saveBillAdjustmentDraft, submitBillAdjustment, applyBillAdjustmentDirect, adjustments, saving } = useFinanceBills()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConcern, setSelectedConcern] = useState(null)
  const [concerns, setConcerns] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const adjustmentDrawer = useModalState()
  const [adjustmentConcern, setAdjustmentConcern] = useState(null)

  const loadConcerns = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/finance/billing-concerns')
      const rows = Array.isArray(response?.data?.data) ? response.data.data : []
      setConcerns(rows.map((row) => {
        const linkedAdjustments = adjustments.filter((item) =>
          String(item?.concernId || '') === String(row?.id || '')
          || (row?.bill_id && String(item?.billId || '') === String(row.bill_id))
        )
        return normalizeConcern(row, linkedAdjustments)
      }))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load finance billing tickets.')
      setConcerns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConcerns()
  }, [adjustments])

  const filtered = useMemo(() => concerns.filter((concern) => {
    const q = search.toLowerCase().trim()
    const matchSearch = !q ||
      concern.id.toLowerCase().includes(q) ||
      concern.tenantName.toLowerCase().includes(q) ||
      concern.unit.toLowerCase().includes(q) ||
      concern.category.toLowerCase().includes(q) ||
      concern.billId.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || concern.status === statusFilter
    return matchSearch && matchStatus
  }), [concerns, search, statusFilter])

  const { pagedItems, meta, page, perPage, setPage, setPerPage } = useClientPagination(filtered, 15)

  const counts = useMemo(() => ({
    total: concerns.length,
    assigned: concerns.filter((concern) => concern.status === 'assigned').length,
    investigating: concerns.filter((concern) => concern.status === 'investigating').length,
    resolved: concerns.filter((concern) => ['resolved', 'closed'].includes(concern.status)).length,
  }), [concerns])
  const isInitialLoading = loading && concerns.length === 0 && !error
  const isRefreshing = loading && concerns.length > 0

  const handleAction = async (id, action, note) => {
    const endpointMap = {
      investigate: 'investigate',
      respond: 'respond',
      resolve: 'resolve',
    }

    const endpoint = endpointMap[action]
    if (!endpoint) return

    try {
      setActing(true)
      await api.post(`/api/finance/billing-concerns/${id}/${endpoint}`, { note })
      addLocalActivityLog({
        action: `billing_concern_${action}`,
        description: `Finance marked concern ${id} as ${action}.${note ? ` Note: ${note}` : ''}`,
        entity_type: 'billing_concern',
        entity_id: id,
        method: 'POST',
        path: `/finance/billing-concerns/${id}/${endpoint}`,
      })
      await loadConcerns()
      addToast({
        investigate: 'Investigation started.',
        respond: 'Response sent to tenant.',
        resolve: 'Ticket resolved.',
        adjust: 'Bill adjustment recorded.',
      }[action], 'success')
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update billing ticket.'
      setError(message)
      addToast(message, 'error')
    } finally {
      setActing(false)
    }
  }

  const openDetail = (concern) => {
    setSelectedConcern(concern)
    setDetailOpen(true)
  }

  const quickAction = async (concern, action) => {
    if (action === 'adjust') {
      const fullBill = await getBillById(concern.billId)
      setAdjustmentConcern(concern)
      adjustmentDrawer.open(fullBill)
      return
    }
    await handleAction(concern.id, action, '')
  }

  const openAdjustmentFromConcern = async (concern) => {
    const fullBill = await getBillById(concern.billId)
    setAdjustmentConcern(concern)
    adjustmentDrawer.open(fullBill)
  }

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-emerald-500" /> Finance Billing Tickets
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage and resolve assigned billing concerns</p>
      </div>
      <UpdatingBadge show={isRefreshing} />

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
            <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`mt-1 text-2xl font-bold ${card.cls}`} spinnerClassName="h-5 w-5 text-slate-400" />
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
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all w-40"
              />
            </div>
            <div className="
  flex items-center gap-1
  overflow-x-auto
  whitespace-nowrap
  w-full
">
  <Filter className="w-3 h-3 text-slate-400 shrink-0" />

  {FINANCE_STATUSES.map((status) => (
    <button
      key={status}
      onClick={() => {
        setStatusFilter(status)
        setPage(1)
      }}
      className={`
        px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize
        shrink-0 whitespace-nowrap
        transition-all

        ${
          statusFilter === status
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }
      `}
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
              {isInitialLoading ? (
                <TableLoadingRow colSpan={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">
                    {concerns.length === 0 ? 'No tickets assigned yet.' : 'No matching tickets found.'}
                  </td>
                </tr>
              ) : pagedItems.map((concern) => (
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
        {meta.last_page > 1 && (
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3">
            <PaginationBar
              meta={meta}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(val) => { setPerPage(val); setPage(1) }}
            />
          </div>
        )}
      </div>

      <ConcernDetails
        concern={selectedConcern}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        role="finance"
        onAction={handleAction}
        onAdjustBill={openAdjustmentFromConcern}
      />

      <BillAdjustmentDrawer
        bill={adjustmentDrawer.selectedItem}
        concern={adjustmentConcern}
        isOpen={adjustmentDrawer.isOpen}
        onClose={() => {
          adjustmentDrawer.close()
          setAdjustmentConcern(null)
        }}
        onSaveDraft={async (payload) => {
          const result = await saveBillAdjustmentDraft(adjustmentDrawer.selectedItem, payload)
          addToast(result?.success ? 'Adjustment draft saved from ticket.' : result?.message || 'Failed to save draft.', result?.success ? 'success' : 'error')
          if (result?.success) {
            await handleAction(adjustmentConcern.id, 'investigate', 'Adjustment draft prepared.')
            adjustmentDrawer.close()
          }
        }}
        onSubmit={async (payload) => {
          const result = await submitBillAdjustment(adjustmentDrawer.selectedItem, payload)
          addToast(result?.success ? 'Adjustment request submitted from ticket.' : result?.message || 'Failed to submit request.', result?.success ? 'success' : 'error')
          if (result?.success) {
            await handleAction(adjustmentConcern.id, 'respond', 'Adjustment proposed and sent for approval.')
            adjustmentDrawer.close()
          }
        }}
        onApply={async (payload) => {
          const result = await applyBillAdjustmentDirect(adjustmentDrawer.selectedItem, payload)
          addToast(result?.success ? 'Adjustment applied and ticket updated.' : result?.message || 'Failed to apply adjustment.', result?.success ? 'success' : 'error')
          if (result?.success) {
            await handleAction(adjustmentConcern.id, 'resolve', 'Bill adjustment applied and concern resolved.')
            adjustmentDrawer.close()
          }
        }}
        saving={saving || acting}
      />
    </div>
  )
}
