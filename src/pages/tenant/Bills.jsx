/**
 * pages/tenant/Bills.jsx
 * Tenant billing page with receipt upload workflow.
 */

import { memo, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Upload,
} from 'lucide-react'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ReceiptUploadModal from '@/components/billing/ReceiptUploadModal'
import ConcernModal from '@/components/billing/concerns/ConcernModal'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import AdjustmentStatusBadge from '@/components/billing/adjustments/AdjustmentStatusBadge'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'
import EmptyState from '@/components/ui/EmptyState'
import { useModalState } from '@/hooks/useModalState'
import { usePageLoader } from '@/hooks/usePageLoader'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { useApp } from '@/context/AppContext'
import { exportBillCSV } from '@/services/billingService'
import { useBills } from '../../components/billing/hooks/useBills'
import useTenantBillingReports from '@/hooks/tenantHooks/useTenantBillingReports'

const TENANT_VISIBLE = ['published', 'submitted', 'paid', 'overdue']

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Unpaid' },
  { key: 'submitted', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
]

function formatPhp(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`
}

function ExportDropdown({ bill }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-0.5 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        title="Export"
      >
        <Download className="h-4 w-4" />
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
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
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
            >
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const BillsTableInner = memo(function BillsTableInner({
  displayedBills,
  filtered,
  unitLabel,
  filter,
  setFilter,
  viewer,
  receiptModal,
  concernModal,
  loading = false,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md dark:border-slate-700/50 dark:bg-slate-900">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800 dark:text-white">My Bills</h2>
          <p className="mt-0.5 text-xs text-slate-400">{filtered.length} records · {unitLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '720px' }}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40">
              {['Bill ID', 'Unit', 'Month', 'Due Date', 'Electricity', 'Water', 'Thermal', 'Amount', 'Status', 'Adjustment', 'Actions'].map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <TableLoadingRow colSpan={11} />
            ) : displayedBills.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState title="No bills found" message="Bills will appear here once published by Finance." />
                </td>
              </tr>
            ) : (
              displayedBills.map((bill) => (
                <tr
                  key={bill.id}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/30 dark:hover:bg-slate-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-400">{bill.id}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs font-mono font-medium text-blue-600 dark:text-blue-400">{bill.unit}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-800 dark:text-white">{bill.month}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{bill.dueDate}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-amber-600 dark:text-amber-400">{formatPhp(bill.breakdown?.electricity)}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-cyan-600 dark:text-cyan-400">{formatPhp(bill.breakdown?.water)}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-rose-600 dark:text-rose-400">{formatPhp(bill.breakdown?.thermal)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-800 dark:text-white">{formatPhp(bill.amount)}</td>
                  <td className="px-4 py-3.5">
                    <BillStatusBadge status={bill.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    {bill.adjustmentState?.latestAdjustment ? (
                      <AdjustmentStatusBadge status={bill.adjustmentState.latestAdjustment.status} />
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => viewer.open(bill)}
                        className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="View Bill"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <ExportDropdown bill={bill} />

                      <button
                        onClick={() => concernModal.open(bill)}
                        className="rounded-lg p-2 text-orange-500 transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        title="Report Billing Concern"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </button>

                      {bill.status === 'published' && (
                        <button
                          onClick={() => receiptModal.open(bill)}
                          className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
                          title="Upload Payment Receipt"
                        >
                          <Upload className="h-3.5 w-3.5" /> Pay
                        </button>
                      )}

                      {bill.status === 'submitted' && (
                        <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" /> Pending Review
                        </span>
                      )}

                      {bill.status === 'paid' && (
                        <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                        </span>
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
  const [filter, setFilter] = useState('all')
  const { submitConcern } = useTenantBillingReports()
  const { addToast } = useApp()

  const tenantBills = useMemo(
    () => bills.filter((bill) => TENANT_VISIBLE.includes(bill.status)),
    [bills]
  )
  const isInitialLoading = (pageLoading || billsLoading) && tenantBills.length === 0 && !billsError
  const isRefreshing = !isInitialLoading && billsLoading

  const unitFiltered = useMemo(
    () => selectedUnit === 'all' || !selectedUnit
      ? tenantBills
      : tenantBills.filter((bill) => String(bill.unit) === String(selectedUnit)),
    [tenantBills, selectedUnit]
  )

  const filtered = useMemo(
    () => filter === 'all' ? unitFiltered : unitFiltered.filter((bill) => bill.status === filter),
    [unitFiltered, filter]
  )

  const displayedBills = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)).slice(0, 20),
    [filtered]
  )

  const totalPaid = useMemo(
    () => unitFiltered.filter((bill) => bill.status === 'paid').reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [unitFiltered]
  )

  const totalUnpaid = useMemo(
    () => unitFiltered.filter((bill) => ['published', 'overdue'].includes(bill.status)).reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [unitFiltered]
  )

  const pendingCount = useMemo(
    () => unitFiltered.filter((bill) => bill.status === 'submitted').length,
    [unitFiltered]
  )

  const unitLabel = selectedUnit === 'all' ? 'All Units' : `Unit ${selectedUnit}`

  const handleReceiptSubmit = async (billId, receiptData) => {
    try {
      const billAmount = Number(receiptModal?.selectedItem?.amount ?? 0)

      await submitPaymentReceipt(billId, {
        amount: billAmount,
        payment_method: 'bank_transfer',
        reference_no: receiptData.referenceNumber,
        notes: receiptData.note,
        proof_image: receiptData.proofImageFile,
      })

      receiptModal.close()
      addToast('Payment receipt submitted successfully.', 'success')
    } catch (error) {
      addToast(
        error?.response?.data?.message || 'Failed to submit payment receipt.',
        'error',
      )
    }
  }

  const handleConcernSubmit = async (data) => {
    try {
      const rawBillId =
        concernModal?.selectedItem?.raw?.id ??
        concernModal?.selectedItem?.raw?.bill_id ??
        concernModal?.selectedItem?.id ??
        null

      const billId =
        typeof rawBillId === 'string' && /^\d+$/.test(rawBillId)
          ? Number(rawBillId)
          : rawBillId

      if (!billId) {
        addToast('Invalid bill selected.', 'error')
        return
      }

      await submitConcern({
        bill_id: billId,
        billId,
        subject: data?.subject || 'Billing Concern',
        message: data?.message ?? data?.description ?? '',
        description: data?.message ?? data?.description ?? '',
        category: data?.category ?? 'general',
        priority: data?.priority ?? 'medium',
      })

      addToast('Billing concern submitted! View in My Billing Reports.', 'success')
      concernModal.close()
    } catch (error) {
      const validationErrors = error?.response?.data?.errors
      const validationMessage = validationErrors
        ? Object.values(validationErrors).flat().filter(Boolean).join(' ')
        : null

      addToast(validationMessage || error?.message || 'Failed to submit billing concern.', 'error')
    }
  }

  return (
    <div className="animate-in space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-xl font-700 text-slate-800 dark:text-white">My Bills</h1>
        <p className="mt-0.5 text-sm text-slate-400">{unitLabel} · Billing history</p>
        <UpdatingBadge show={isRefreshing} />
      </div>

      <UnitFilterBar />

      {billsError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{billsError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Paid', value: formatPhp(totalPaid), cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Outstanding', value: formatPhp(totalUnpaid), cls: 'text-red-600 dark:text-red-400' },
          { label: 'Pending Review', value: pendingCount, cls: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total Bills', value: unitFiltered.length, cls: 'text-blue-600 dark:text-blue-400' },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl p-4 shadow-md">
            <p className="font-mono text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
            <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`mt-1 text-2xl font-bold ${card.cls}`} spinnerClassName="h-5 w-5 text-slate-400" />
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <Clock className="h-5 w-5 flex-shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            You have <strong>{pendingCount}</strong> bill{pendingCount > 1 ? 's' : ''} awaiting payment verification by Finance.
          </p>
        </div>
      )}

      <BillsTableInner
        displayedBills={displayedBills}
        filtered={filtered}
        unitLabel={unitLabel}
        filter={filter}
        setFilter={setFilter}
        viewer={viewer}
        receiptModal={receiptModal}
        concernModal={concernModal}
        loading={isInitialLoading}
      />

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
    </div>
  )
}
