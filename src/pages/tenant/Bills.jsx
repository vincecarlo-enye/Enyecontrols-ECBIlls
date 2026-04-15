/**
 * pages/tenant/Bills.jsx
 * Tenant billing page with receipt upload workflow.
 */

import { useEffect, useState, memo } from 'react'
import {
  Eye, CheckCircle2, Clock, Download, ChevronDown,
  FileText, FileSpreadsheet, AlertCircle, Upload, Search, Wallet,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ReceiptUploadModal from '@/components/billing/ReceiptUploadModal'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import EmptyState from '@/components/ui/EmptyState'
import PageSection, { PageHeader } from '@/components/layout/PageSection'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'

import { useModalState } from '@/hooks/useModalState'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantBillsSkeleton } from '@/components/skeletons'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { exportBillCSV } from '@/services/billingService'
import ConcernModal from '@/components/billing/concerns/ConcernModal'
import { useApp } from '@/context/AppContext'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import { useBills } from '../../components/billing/hooks/useBills'
import { submitTenantBillingReport } from '@/services/tenantService/tenantBillingReportService'
import { confirmTenantRefundReceived } from '@/services/tenantService/tenantBillingService'
import api from '@/lib/api'

const TENANT_VISIBLE = ['published', 'submitted', 'paid', 'overdue']

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Unpaid' },
  { key: 'submitted', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
]

function formatPHP(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`
}

function ExportDropdown({ bill }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-0.5 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
        title="Export"
      >
        <Download className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {[
            { label: 'CSV', icon: FileText },
            { label: 'Excel', icon: FileSpreadsheet },
            { label: 'PDF', icon: FileText },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                exportBillCSV(bill)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function storageUrl(path) {
  if (!path) return ''
  const raw = String(path)
  if (raw.startsWith('http')) return raw
  const base = String(api.defaults.baseURL || '').replace(/\/$/, '')
  return `${base}/storage/${raw.replace(/^\/?storage\/?/, '')}`
}

function RefundConfirmModal({ item, isOpen, onClose, onConfirm }) {
  const [notes, setNotes] = useState('')
  if (!isOpen || !item?.refund) return null

  const refund = item.refund
  const proofUrl = storageUrl(refund.proofImage)

  return (
    <div className="fixed inset-0 z-[360] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm GCash Refund</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Only confirm if the refund is already received in your GCash account.</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
              <p className="text-[10px] font-mono uppercase text-slate-400">Amount</p>
              <p className="font-bold text-slate-900 dark:text-white">{formatPHP(refund.amount)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
              <p className="text-[10px] font-mono uppercase text-slate-400">GCash Ref No.</p>
              <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{refund.referenceNo || '-'}</p>
            </div>
          </div>
          {proofUrl && (
            <a href={proofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <img src={proofUrl} alt="GCash refund proof" className="max-h-72 w-full object-contain bg-slate-950/5 dark:bg-slate-950" />
            </a>
          )}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional confirmation note..." className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={() => onConfirm({ notes })} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">I received this refund</button>
        </div>
      </div>
    </div>
  )
}
const BillsTableInner = memo(function BillsTableInner({
  displayedBills, filtered, unitLabel, filter, setFilter,
  viewer, receiptModal, concernModal, refundModal,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="font-semibold text-[15px] text-slate-800 dark:text-white">My Bills</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} records · {unitLabel}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '860px' }}>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
              {[
                'Bill ID',
                'Unit',
                'Month',
                'Due Date',
                'Electricity',
                'Water',
                'Thermal',
                'Previous Balance',
                'Amount Due',
                'Status',
                'Actions',
              ].map((col) => (
                <th
                  key={col}
                  className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {displayedBills.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState title="No bills found" message="Bills will appear here once published by Finance." />
                </td>
              </tr>
            ) : (
              displayedBills.map((bill) => (
                <tr
                  key={bill.id}
                  className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                  <td className="px-4 py-3.5 text-xs font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{bill.unit}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">{bill.month}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.dueDate}</td>
                  <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400 text-xs font-mono">{formatPHP(bill.breakdown?.electricity ?? 0)}</td>
                  <td className="px-4 py-3.5 text-cyan-600 dark:text-cyan-400 text-xs font-mono">{formatPHP(bill.breakdown?.water ?? 0)}</td>
                  <td className="px-4 py-3.5 text-rose-600 dark:text-rose-400 text-xs font-mono">{formatPHP(bill.breakdown?.thermal ?? 0)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-amber-700 dark:text-amber-300 whitespace-nowrap">{formatPHP(bill.previous_balance || 0)}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">{formatPHP(bill.amount || 0)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col items-start gap-1.5">
                      <BillStatusBadge status={bill.status} />
                      {bill.hasAdjustment && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-[10px] font-semibold">Adjusted Bill</span>
                      )}
                      {bill.hasPendingAdjustment && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-semibold">Pending Adjustment</span>
                      )}
                      {bill.hasPendingRefundConfirmation && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 text-[10px] font-semibold">Refund confirmation needed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => viewer.open(bill)}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="View Bill"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <ExportDropdown bill={bill} />

                      <button
                        onClick={() => concernModal.open(bill)}
                        className="p-2 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                        title="Report Billing Concern"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>

                      {bill.status === 'published' && (
                        <button
                          onClick={() => receiptModal.open(bill)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                          title="Upload Payment Receipt"
                        >
                          <Upload className="w-3.5 h-3.5" /> Pay
                        </button>
                      )}

                      {bill.status === 'submitted' && (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" /> Pending Review
                        </span>
                      )}

                      {bill.status === 'paid' && (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      )}

                      {bill.hasPendingRefundConfirmation && (
                        <button
                          onClick={() => refundModal.open({ bill, refund: bill.pendingRefunds[0] })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 transition-all shadow-sm"
                          title="Confirm GCash refund received"
                        >
                          <Wallet className="w-3.5 h-3.5" /> Confirm Refund
                        </button>
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
  )
})

export default function TenantBills() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageLoading = usePageLoader(700)
  const {
    bills,
    loading: billsLoading,
    error: billsError,
    submitPaymentReceipt,
  } = useBills()

  const { selectedUnit } = useUnitFilter()
  const viewer = useModalState()
  const receiptModal = useModalState()
  const concernModal = useModalState()
  const refundModal = useModalState()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { addToast } = useApp()

  useEffect(() => {
    const navbarSearchItem = location.state?.navbarSearchItem
    if (!navbarSearchItem?.query) return

    const query = String(navbarSearchItem.query).trim()
    if (!query) return

    setSearch(query)

    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        navbarSearchItem: null,
      },
    })
  }, [location.pathname, location.state, navigate])

  if (pageLoading || billsLoading) return <TenantBillsSkeleton />

  const tenantBills = bills.filter((b) => TENANT_VISIBLE.includes(b.status))
  const unitFiltered = selectedUnit === 'all'
    ? tenantBills
    : tenantBills.filter((b) => String(b.unit) === String(selectedUnit))

  const searched = !search.trim()
    ? unitFiltered
    : unitFiltered.filter((b) => {
        const q = search.trim().toLowerCase()
        return [
          b.id,
          b.unit,
          b.month,
          b.status,
          b.dueDate,
        ].filter(Boolean).join(' ').toLowerCase().includes(q)
      })

  const filtered = filter === 'all'
    ? searched
    : searched.filter((b) => b.status === filter)

  const displayedBills = [...filtered]
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
    .slice(0, 20)

  const totalPaid = unitFiltered
    .filter((b) => b.status === 'paid')
    .reduce((s, b) => s + Number(b.amount || 0), 0)

  const totalUnpaid = unitFiltered
    .filter((b) => ['published', 'overdue'].includes(b.status))
    .reduce((s, b) => s + Number(b.amount || 0), 0)

  const pendingCount = unitFiltered.filter((b) => b.status === 'submitted').length
  const unitLabel = selectedUnit === 'all' ? 'All Units' : `Unit ${selectedUnit}`

  const handleReceiptSubmit = async (billId, receiptData) => {
    try {
      const billAmount = Number(receiptModal?.selectedItem?.amount ?? 0)

      const payload = {
        amount: billAmount,
        payment_method: 'bank_transfer',
        reference_no: receiptData.referenceNumber,
        notes: receiptData.note,
        proof_image: receiptData.proofImageFile,
      }

      await submitPaymentReceipt(billId, payload)
      receiptModal.close()
      addToast('Payment receipt submitted successfully.', 'success')
    } catch (error) {
      addToast(
        error?.response?.data?.message || 'Failed to submit payment receipt.',
        'error'
      )
    }
  }

  const handleRefundConfirm = async (payload = {}) => {
    try {
      const adjustmentId = refundModal.selectedItem?.refund?.adjustmentId
      if (!adjustmentId) return
      await confirmTenantRefundReceived(adjustmentId, payload)
      refundModal.close()
      await refreshBills({ silent: true })
      addToast('Refund receipt confirmed. Billing concern resolved.', 'success')
    } catch (error) {
      addToast(error?.response?.data?.message || 'Failed to confirm refund receipt.', 'error')
    }
  }
  const handleConcernSubmit = async (data) => {
    try {
      await submitTenantBillingReport({
        bill_id: Number(data.billId),
        subject: `${data.category || 'Billing Concern'} - ${data.billMonth || 'Selected Bill'}`,
        category: data.category || 'general',
        message: data.message || '',
        priority: 'medium',
      })
      addToast('Billing concern submitted! View in My Billing Reports.', 'success')
      concernModal.close()
    } catch (error) {
      addToast(
        error?.response?.data?.message || 'Failed to submit billing concern.',
        'error'
      )
      throw error
    }
  }

  return (
    <div className="space-y-5 animate-in">
      <PageSection>
        <PageHeader
          title="My Bills"
          subtitle={`${unitLabel} - Billing history and payment activity`}
          icon={FileText}
        />
        <UnitFilterBar />
      </PageSection>

      {billsError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{billsError}</p>
        </div>
      )}

      <SummaryCardStrip
        stretch
        cards={[
          {
            title: 'Total Paid',
            value: formatPHP(totalPaid),
            sub: 'Verified payments',
            gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
          },
          {
            title: 'Outstanding',
            value: formatPHP(totalUnpaid),
            sub: 'Open published and overdue bills',
            gradient: 'from-rose-500/20 via-rose-400/10 to-transparent',
          },
          {
            title: 'Pending Review',
            value: pendingCount,
            sub: 'Receipts waiting for Finance',
            gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
          },
          {
            title: 'Total Bills',
            value: unitFiltered.length,
            sub: unitLabel,
            gradient: 'from-sky-500/20 via-cyan-400/10 to-transparent',
          },
        ]}
      />

      {pendingCount > 0 && (
        <PageSection className="border-amber-200/70 dark:border-amber-500/20" variant="plain">
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-4 dark:bg-amber-900/20">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have <strong>{pendingCount}</strong> bill{pendingCount > 1 ? 's' : ''} awaiting payment verification by Finance.
            </p>
          </div>
        </PageSection>
      )}

      <PageSection>
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bill ID, unit, month, or status..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
          />
        </div>
      </PageSection>

      <PageSection padded={false}>
        <BillsTableInner
          displayedBills={displayedBills}
          filtered={filtered}
          unitLabel={unitLabel}
          filter={filter}
          setFilter={setFilter}
          viewer={viewer}
          receiptModal={receiptModal}
          concernModal={concernModal}
          refundModal={refundModal}
        />
      </PageSection>

      <BillViewerModal
        bill={viewer.selectedItem}
        isOpen={viewer.isOpen}
        onClose={viewer.close}
      />

      <ReceiptUploadModal
        bill={receiptModal.selectedItem}
        isOpen={receiptModal.isOpen}
        onClose={receiptModal.close}
        onSubmit={handleReceiptSubmit}
      />

      <ConcernModal
        bill={concernModal.selectedItem}
        isOpen={concernModal.isOpen}
        onClose={concernModal.close}
        onSubmit={handleConcernSubmit}
      />

      <RefundConfirmModal
        item={refundModal.selectedItem}
        isOpen={refundModal.isOpen}
        onClose={refundModal.close}
        onConfirm={handleRefundConfirm}
      />
    </div>
  )
}








