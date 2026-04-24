import { formatDate, formatPeso} from '@/utils/filterUtils'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, Filter, Search, X, XCircle, Wallet } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import EmptyState from '@/components/ui/EmptyState'
import PageSection, { PageHeader } from '@/components/layout/PageSection'


function formatAdjustmentLabel(row) {
  const workflow =
    row?.workflow_type && row.workflow_type !== 'direct_adjustment'
      ? row.workflow_type
      : row?.adjustment_type

  return String(workflow || 'adjustment').replace(/_/g, ' ')
}

function amountValue(row, key) {
  const snapshotKey = key === 'original_total' ? 'original_snapshot' : 'adjusted_snapshot'

  return Number(
    row?.[key] ||
    row?.[snapshotKey]?.amount ||
    (key === 'original_total' && row?.bill?.amount
      ? Number(row.bill.amount) - Number(row?.net_difference || 0)
      : 0)
  )
}

function inferLedgerEntryType(row) {
  const workflow = row?.workflow_type
  const diff = Number(row?.net_difference || 0)

  if (row?.ledger_entry?.entry_type) return row.ledger_entry.entry_type
  if (row?.planned_ledger_entry?.entry_type) return row.planned_ledger_entry.entry_type
  if (workflow === 'credit') return 'credit'
  if (workflow === 'refund') return 'refund'
  if (workflow === 'additional_charge') return 'additional_charge'
  if (workflow === 'critical_error') return 'critical_error'
  if (workflow && workflow !== 'direct_adjustment') return workflow
  if (diff > 0) return 'additional_charge'
  if (diff < 0) return 'credit'
  return ''
}

function ledgerLabel(row) {
  const entry = row?.ledger_entry || row?.planned_ledger_entry
  const entryType = inferLedgerEntryType(row)
  if (!entryType) return '-'

  const rawStatus =
    entry?.status ||
    (row?.status === 'pending_approval'
      ? 'pending_approval'
      : row?.status === 'applied'
        ? 'applied'
        : 'planned')

  const status =
    rawStatus === 'pending_approval'
      ? 'Pending'
      : rawStatus === 'planned'
        ? 'Planned'
        : String(rawStatus || '').replace(/_/g, ' ')

  return `${String(entryType).replace(/_/g, ' ')}${status ? ` (${status})` : ''}`
}

function lineOriginalAmount(line, selected) {
  const lineOriginal = Number(line?.original_amount || 0)
  if (lineOriginal > 0) return lineOriginal

  const label = String(line?.label || '').toLowerCase()
  const isWholeBillLine =
    !line?.bill_item_id ||
    label.includes('paid bill') ||
    label.includes('replace total') ||
    label.includes('critical')

  return isWholeBillLine ? amountValue(selected, 'original_total') : lineOriginal
}



function statusClass(status) {
  if (status === 'applied') {
    return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
  }
  if (status === 'pending_approval') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  }
  if (status === 'rejected') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
  }
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

export default function BillAdjustmentsPage() {
  const { user } = useAuth()
  const { addToast } = useApp()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reference_no: '',
    refunded_at: new Date().toISOString().slice(0, 10),
    notes: '',
    proof_image: null,
  })
  const [acting, setActing] = useState(false)

  const basePath =
    user?.role === 'finance'
      ? '/api/finance/bill-adjustments'
      : '/api/admin/bill-adjustments'
  const canApprove = ['admin', 'super_admin'].includes(user?.role)
  const pageTitle = canApprove ? 'Adjustment Review' : 'Adjustment Ledger'
  const pageSubtitle = canApprove
    ? 'Approve, reject, and audit bill adjustment requests and applied changes.'
    : 'Track submitted adjustments, ledger outcomes, and refund processing.'
  const canProcessRefund =
    user?.role === 'finance' &&
    selected?.ledger_entry?.entry_type === 'refund' &&
    selected?.ledger_entry?.status === 'refund_pending' &&
    !selected?.ledger_entry?.metadata?.refund?.reference_no

  const loadRows = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(basePath, { params: { paginate: 0 } })
      setRows(Array.isArray(data?.data) ? data.data : [])
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to load bill adjustments.', 'error')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [basePath])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [
        row.id,
        row.bill_id,
        row.bill?.tenant_name,
        row.bill?.unit_number,
        row.adjustment_type,
        row.workflow_type,
        row.status,
        row.creator?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (!q || haystack.includes(q)) && (status === 'all' || row.status === status)
    })
  }, [rows, search, status])

  useEffect(() => {
    if (!selected) return

    const refundAmount =
      selected?.ledger_entry?.amount ||
      selected?.planned_ledger_entry?.amount ||
      Math.abs(Number(selected?.net_difference || 0))

    setRefundForm({
      amount: refundAmount ? String(refundAmount) : '',
      reference_no: '',
      refunded_at: new Date().toISOString().slice(0, 10),
      notes: '',
      proof_image: null,
    })
  }, [selected?.id])

  const handleReview = async (decision) => {
    if (!selected) return

    if (decision === 'reject' && !reviewNote.trim()) {
      addToast('Please provide a rejection reason.', 'error')
      return
    }

    try {
      setActing(true)

      const endpoint = `/api/admin/bill-adjustments/${selected.id}/${decision}`
      const payload = decision === 'approve' ? { note: reviewNote } : { reason: reviewNote }

      const { data } = await api.patch(endpoint, payload)

      addToast(data?.message || `Adjustment ${decision}d.`, 'success')
      setSelected(null)
      setReviewNote('')
      await loadRows()
    } catch (err) {
      addToast(err?.response?.data?.message || `Failed to ${decision} adjustment.`, 'error')
    } finally {
      setActing(false)
    }
  }

  const handleProcessRefund = async () => {
    if (!selected) return

    if (!refundForm.amount || Number(refundForm.amount) <= 0) {
      addToast('Please enter a valid refund amount.', 'error')
      return
    }

    if (!refundForm.reference_no.trim()) {
      addToast('Please enter the GCash reference number.', 'error')
      return
    }

    if (!(refundForm.proof_image instanceof File)) {
      addToast('Please upload the GCash proof image.', 'error')
      return
    }

    try {
      setActing(true)

      const formData = new FormData()
      formData.append('amount', String(refundForm.amount))
      formData.append('refund_method', 'gcash')
      formData.append('reference_no', refundForm.reference_no.trim())
      formData.append('refunded_at', refundForm.refunded_at)

      if (refundForm.notes?.trim()) {
        formData.append('notes', refundForm.notes.trim())
      }

      formData.append('proof_image', refundForm.proof_image)

      for (const [key, value] of formData.entries()) {
        console.log(key, value)
      }

      const { data } = await api.post(
        `/api/finance/bill-adjustments/${selected.id}/refund`,
        formData
      )

      addToast(data?.message || 'Refund proof sent to tenant for confirmation.', 'success')
      setSelected(null)

      setRefundForm({
        amount: '',
        reference_no: '',
        refunded_at: new Date().toISOString().slice(0, 10),
        notes: '',
        proof_image: null,
      })

      await loadRows()
    } catch (err) {
      addToast(
        err?.response?.data?.message || 'Failed to mark refund as processed.',
        'error'
      )
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="space-y-5 animate-in min-w-0">
      <PageSection>
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          icon={Wallet}
        />
      </PageSection>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center">
  
  {/* Search */}
  <div className="relative flex-1 min-w-[220px]">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search bill, tenant, unit, creator..."
      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none"
    />
  </div>

  <div className="relative w-full sm:w-auto">
    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

    <select
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="w-full sm:w-auto pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none"
    >
      <option value="all">All Status</option>
      <option value="draft">Draft</option>
      <option value="pending_approval">Pending Approval</option>
      <option value="applied">Applied</option>
      <option value="rejected">Rejected</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>

</div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '980px' }}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {[
                  'Date',
                  'Bill ID',
                  'Tenant',
                  'Workflow',
                  'Old Total',
                  'New Total',
                  'Difference',
                  'Ledger',
                  'Status',
                  'Created By',
                  'Approved By',
                  'Details',
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-sm text-slate-400">
                    Loading adjustments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <EmptyState
                      title={`No ${pageTitle.toLowerCase()} entries found`}
                      message="Adjustment records and outcomes will appear here."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                      #{row.bill_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {row.bill?.tenant_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize whitespace-nowrap">
                      {formatAdjustmentLabel(row)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {formatPeso(amountValue(row, 'original_total'))}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">
                      {formatPeso(amountValue(row, 'adjusted_total'))}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono text-xs ${Number(row.net_difference) < 0 ? 'text-teal-600' : 'text-amber-600'
                        }`}
                    >
                      {formatPeso(row.net_difference)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize whitespace-nowrap">
                      {ledgerLabel(row)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${statusClass(
                          row.status
                        )}`}
                      >
                        {String(row.status).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {row.creator?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {row.approver?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(row)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[360] flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Bill Adjustment #{selected.id}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  Bill #{selected.bill_id} - {selected.bill?.tenant_name || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="h-9 w-9 flex-shrink-0 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
                aria-label="Close bill adjustment details"
              >
                <X className="mx-auto h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400">Original</p>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {formatPeso(amountValue(selected, 'original_total'))}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400">Adjusted</p>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {formatPeso(amountValue(selected, 'adjusted_total'))}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400">Difference</p>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {formatPeso(selected.net_difference)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400">Ledger</p>
                  <p className="font-bold text-slate-800 dark:text-white capitalize">
                    {ledgerLabel(selected)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                <p className="text-xs font-mono uppercase text-slate-400 mb-2">Reason</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {selected.reason}
                </p>
                {selected.internal_notes && (
                  <p className="mt-3 text-xs text-slate-500 whitespace-pre-wrap">
                    Internal: {selected.internal_notes}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: '560px' }}>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        {['Line', 'Original', 'Adjustment', 'New'].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left text-[10px] font-mono uppercase text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.diff_snapshot?.line_items || []).map((line, index) => (
                        <tr
                          key={index}
                          className="border-t border-slate-100 dark:border-slate-800"
                        >
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            {line.label}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {formatPeso(lineOriginalAmount(line, selected))}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {formatPeso(line.adjustment_amount)}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-200">
                            {formatPeso(line.new_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {canApprove && selected.status === 'pending_approval' && (
                <div className="space-y-3">
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    placeholder="Approval note or rejection reason..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleReview('reject')}
                      disabled={acting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 text-sm font-semibold disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleReview('approve')}
                      disabled={acting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Apply
                    </button>
                  </div>
                </div>
              )}

              {canProcessRefund && (
                <div className="space-y-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800/50 dark:bg-teal-900/20">
                  <div>
                    <p className="text-sm font-bold text-teal-800 dark:text-teal-200">
                      Process GCash Refund
                    </p>
                    <p className="text-xs text-teal-700/80 dark:text-teal-300/80">
                      Use this after Finance has manually sent the refund to the tenant via
                      GCash. Upload proof so the tenant can confirm receipt.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-mono uppercase text-teal-700/70 dark:text-teal-300/70 mb-1.5 block">
                        Refund Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={refundForm.amount}
                        onChange={(e) =>
                          setRefundForm((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono uppercase text-teal-700/70 dark:text-teal-300/70 mb-1.5 block">
                        GCash Ref No.
                      </label>
                      <input
                        value={refundForm.reference_no}
                        onChange={(e) =>
                          setRefundForm((prev) => ({
                            ...prev,
                            reference_no: e.target.value,
                          }))
                        }
                        placeholder="Required"
                        className="w-full px-3 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono uppercase text-teal-700/70 dark:text-teal-300/70 mb-1.5 block">
                        Refund Date
                      </label>
                      <input
                        type="date"
                        value={refundForm.refunded_at}
                        onChange={(e) =>
                          setRefundForm((prev) => ({
                            ...prev,
                            refunded_at: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs font-mono uppercase text-teal-700/70 dark:text-teal-300/70 mb-1.5 block">
                        GCash Proof Image
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) =>
                          setRefundForm((prev) => ({
                            ...prev,
                            proof_image: e.target.files?.[0] || null,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                      />
                    </div>
                  </div>

                  <textarea
                    value={refundForm.notes}
                    onChange={(e) =>
                      setRefundForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Optional refund notes..."
                    className="w-full px-3 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none resize-none"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleProcessRefund}
                      disabled={
                        acting ||
                        !refundForm.amount ||
                        !refundForm.reference_no.trim() ||
                        !(refundForm.proof_image instanceof File)
                      }
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Send Proof to Tenant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
