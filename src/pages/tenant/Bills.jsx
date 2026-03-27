/**
 * pages/tenant/Bills.jsx
 * Tenant billing page with receipt upload workflow.
 */

import { useState, memo } from 'react'
import {
  Eye, CheckCircle2, Clock, Download, ChevronDown,
  FileText, FileSpreadsheet, AlertCircle, Upload,
} from 'lucide-react'
import BillViewerModal from '@/components/billing/BillViewerModal'
import ReceiptUploadModal from '@/components/billing/ReceiptUploadModal'
import UnitFilterBar from '@/components/common/UnitFilterBar'
import EmptyState from '@/components/ui/EmptyState'

import { useModalState } from '@/hooks/useModalState'
import { usePageLoader } from '@/hooks/usePageLoader'
import { TenantBillsSkeleton } from '@/components/skeletons'
import { useUnitFilter } from '@/context/UnitFilterContext'
import { exportBillCSV } from '@/services/billingService'
import ConcernModal from '@/components/billing/concerns/ConcernModal'
import { useBillingConcerns } from '@/context/BillingConcernContext'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import { useBills } from '../../components/billing/hooks/useBills'

// Tenant only sees published, payment_submitted, paid, overdue bills
const TENANT_VISIBLE = ['published', 'submitted', 'paid', 'overdue']

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Unpaid' },
  { key: 'submitted', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
]

// ─── Export dropdown ─────────────────────────────────────────────────────────
function ExportDropdown({ bill }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <button
        onClick={() => setOpen(o => !o)}
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

// ─── Table ───────────────────────────────────────────────────────────────────
const BillsTableInner = memo(function BillsTableInner({
  displayedBills, filtered, unitLabel, filter, setFilter,
  viewer, receiptModal, concernModal,
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === key
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
        <table className="w-full text-sm" style={{ minWidth: '720px' }}>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
              {['Bill ID', 'Unit', 'Month', 'Due Date', 'Electricity', 'Water', 'Thermal', 'Amount', 'Status', 'Actions'].map(col => (
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
                <td colSpan={10}>
                  <EmptyState title="No bills found" message="Bills will appear here once published by Finance." />
                </td>
              </tr>
            ) : (
              displayedBills.map(bill => (
                <tr
                  key={bill.id}
                  className="border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                  <td className="px-4 py-3.5 text-xs font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{bill.unit}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">{bill.month}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.dueDate}</td>
                  <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400 text-xs font-mono">₱{(bill.breakdown?.electricity ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-cyan-600 dark:text-cyan-400 text-xs font-mono">₱{(bill.breakdown?.water ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-rose-600 dark:text-rose-400 text-xs font-mono">₱{(bill.breakdown?.thermal ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">₱{Number(bill.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <BillStatusBadge status={bill.status} />
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

// ─── Page ─────────────────────────────────────────────────────────────────────
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
  const { submitConcern } = useBillingConcerns()
  const { user } = useAuth()
  const { addToast } = useApp()

  if (pageLoading || billsLoading) return <TenantBillsSkeleton />

  const tenantBills = bills.filter(b => TENANT_VISIBLE.includes(b.status))
  const unitFiltered = selectedUnit === 'all'
    ? tenantBills
    : tenantBills.filter(b => String(b.unit) === String(selectedUnit))

  const filtered = filter === 'all'
    ? unitFiltered
    : unitFiltered.filter(b => b.status === filter)

  const displayedBills = [...filtered]
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
    .slice(0, 20)

  const totalPaid = unitFiltered
    .filter(b => b.status === 'paid')
    .reduce((s, b) => s + Number(b.amount || 0), 0)

  const totalUnpaid = unitFiltered
    .filter(b => ['published', 'overdue'].includes(b.status))
    .reduce((s, b) => s + Number(b.amount || 0), 0)

  const pendingCount = unitFiltered.filter(b => b.status === 'submitted').length
  const unitLabel = selectedUnit === 'all' ? 'All Units' : `Unit ${selectedUnit}`

  const handleReceiptSubmit = async (billId, receiptData) => {
    try {
      const billAmount = Number(receiptModal?.selectedItem?.amount ?? 0)

      const payload = {
        ...receiptData,
        amount: billAmount,
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

  const handleConcernSubmit = (data) => {
    submitConcern({ ...data, user })
    addToast('Billing concern submitted! View in My Billing Reports.', 'success')
    concernModal.close()
  }

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="font-display font-700 text-xl text-slate-800 dark:text-white">My Bills</h1>
        <p className="text-sm text-slate-400 mt-0.5">{unitLabel} · Billing history</p>
      </div>

      <UnitFilterBar />

      {billsError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{billsError}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Paid', value: `₱${totalPaid.toLocaleString()}`, cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Outstanding', value: `₱${totalUnpaid.toLocaleString()}`, cls: 'text-red-600 dark:text-red-400' },
          { label: 'Pending Review', value: pendingCount, cls: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total Bills', value: unitFiltered.length, cls: 'text-blue-600 dark:text-blue-400' },
        ].map(c => (
          <div key={c.label} className="glass rounded-2xl p-4 shadow-md">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Pending notice */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
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
