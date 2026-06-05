import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText, Plus, Send, Edit2, Trash2, Search,
  Eye, CheckCircle2, X, Zap, Droplets, Flame,
  LayoutList, Settings2, Filter, AlertTriangle, HelpCircle,
} from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import PaymentReviewModal from '@/components/billing/PaymentReviewModal'
import AdjustmentStatusBadge from '@/components/billing/adjustments/AdjustmentStatusBadge'
import BillAdjustmentDrawer from '@/components/billing/adjustments/BillAdjustmentDrawer'
import BillAdjustmentHistoryModal from '@/components/billing/adjustments/BillAdjustmentHistoryModal'
import BillingPeriodLockPanel from '@/components/common/BillingPeriodLockPanel'
import { useApp } from '@/context/AppContext'
import { useModalState } from '@/hooks/useModalState'
import RateConfigCard from '@/components/common/RateConfigCard'
import PaginationBar from '@/components/common/PaginationBar'
import PageActionBar from '@/components/common/PageActionBar'
import { useClientPagination } from '@/hooks/useClientPagination'
import { useBillingPenaltyRule } from '@/hooks/useBillingPenaltyRule'
import { useBillingPeriodLocks } from '@/hooks/useBillingPeriodLocks'
import { useFinanceBills } from '@/hooks/financeHooks/useFinanceBills'
import { exportTableCsv, printElement } from '@/utils/reporting'
import { LoadingValue, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

const UTIL_CLS = {
  electricity: 'text-amber-600 dark:text-amber-400',
  water: 'text-cyan-600 dark:text-cyan-400',
  thermal: 'text-rose-600 dark:text-rose-400',
}

const UTIL_ICONS = {
  electricity: Zap,
  water: Droplets,
  thermal: Flame,
}

function BillFormModal({ open, onClose, tenants, initial, onSave, saving, isMonthLocked, getMonthLock }) {
  const [tenantId, setTenantId] = useState(initial?.tenantId || '')
  const [billingMonth, setBillingMonth] = useState(initial?.billingMonth || '')

  useEffect(() => {
    if (!open) return
    setTenantId(initial?.tenantId || '')
    setBillingMonth(initial?.billingMonth || '')
  }, [open, initial])

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => String(tenant.id) === String(tenantId)),
    [tenantId, tenants]
  )
  const selectedLock = billingMonth ? getMonthLock?.(billingMonth) : null
  const monthLocked = billingMonth ? isMonthLocked?.(billingMonth) : false

  if (!open) return null

  const handleSubmit = async () => {
    if (!tenantId || !billingMonth) return

    const result = await onSave({
      tenantId: Number(tenantId),
      billingMonth,
    })

    if (result?.success) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">
            {initial ? 'Regenerate Bill' : 'Generate New Bill'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Tenant</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            >
              <option value="">Select tenant...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} {tenant.unit ? `- ${tenant.unit}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Billing Month</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            />
            <p className="mt-2 text-xs text-slate-400">
              Finance can only generate bills from readings already approved by the Facility Manager.
            </p>
          </div>

          {monthLocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {billingMonth} is locked. {selectedLock?.reason ? `Reason: ${selectedLock.reason}` : 'Unlock the billing period first before generating or regenerating bills.'}
            </div>
          )}

          {selectedTenant && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
              <p className="text-xs font-mono uppercase text-slate-400 mb-1">Selected Tenant</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedTenant.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Unit {selectedTenant.unit || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!tenantId || !billingMonth || saving || monthLocked}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {initial ? 'Regenerate Bill' : 'Generate Bill'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function GenerateAllBillsModal({ open, onClose, onSubmit, saving, isMonthLocked, getMonthLock }) {
  const [billingMonth, setBillingMonth] = useState('')
  const [regenerateExisting, setRegenerateExisting] = useState(false)

  useEffect(() => {
    if (!open) return
    setBillingMonth('')
    setRegenerateExisting(false)
  }, [open])

  if (!open) return null
  const selectedLock = billingMonth ? getMonthLock?.(billingMonth) : null
  const monthLocked = billingMonth ? isMonthLocked?.(billingMonth) : false

  const handleSubmit = async () => {
    if (!billingMonth) return

    const result = await onSubmit({
      billingMonth,
      regenerateExisting,
    })

    if (result?.success) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">Generate All Bills</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Billing Month</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={regenerateExisting}
              onChange={(e) => setRegenerateExisting(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Regenerate existing bills too</p>
              <p className="text-xs text-slate-400 mt-1">
                If unchecked, tenants that already have a bill for the selected month will be skipped.
              </p>
            </div>
          </label>

          {monthLocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {billingMonth} is locked. {selectedLock?.reason ? `Reason: ${selectedLock.reason}` : 'Unlock the billing period first before running bulk generation.'}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!billingMonth || saving || monthLocked}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Generate All Bills
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function BillDetailModal({ bill, onClose }) {
  if (!bill) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">Bill Details</h3>
            <p className="text-[11px] text-slate-400 font-mono">{bill.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <BillStatusBadge status={bill.status} />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{bill.tenant}</p>
              <p className="text-[11px] text-slate-400">Unit {bill.unit}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {[
              { k: 'Invoice ID', v: bill.id },
              { k: 'Month', v: bill.month },
              { k: 'Billing Period', v: bill.billingPeriod },
              { k: 'Due Date', v: bill.dueDate },
              { k: 'Total Amount', v: `PHP ${bill.amount.toLocaleString()}` },
            ].map((row) => (
              <div key={row.k} className="flex justify-between px-4 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800 text-sm">
                <span className="text-slate-400">{row.k}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{row.v}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">Utility Breakdown</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(bill.breakdown || {}).map(([key, val]) => {
                const Icon = UTIL_ICONS[key]
                return (
                  <div key={key} className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                    {Icon ? <Icon className={`w-4 h-4 mx-auto mb-1 ${UTIL_CLS[key]}`} /> : null}
                    <p className="text-[10px] font-mono uppercase text-slate-400">{key}</p>
                    <p className={`text-sm font-bold ${UTIL_CLS[key]}`}>PHP {Number(val || 0).toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">Receipt Image</p>
            {bill.receipt?.receiptImage ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 p-2 dark:bg-slate-800">
                <img
                  src={bill.receipt.receiptImage}
                  alt="Payment receipt"
                  className="block h-auto max-h-80 w-full rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
                <p className="text-xs text-slate-400">No receipt image available for this bill.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PenaltyPreviewPanel({ rule, penaltyPreview, loading, onPreview }) {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10))
  const rows = Array.isArray(penaltyPreview?.rows) ? penaltyPreview.rows : []

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Penalty Preview</h3>
          <p className="mt-1 text-xs text-slate-400">
            {rule?.isEnabled
              ? 'Overdue penalties are applied automatically. Use this preview to audit the active late-fee rule.'
              : 'Enable the penalty rule in Billing Rates to use this workflow.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
          />
          <button
            onClick={() => onPreview(asOfDate)}
            disabled={loading || !rule?.isEnabled}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Preview
          </button>
        </div>
      </div>

      {penaltyPreview && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Eligible</p>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">{Number(penaltyPreview.eligible_count || 0)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Applied</p>
            <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">{Number(penaltyPreview.already_applied_count || 0)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Skipped</p>
            <p className="mt-1 text-xl font-bold text-slate-700 dark:text-slate-200">{Number(penaltyPreview.skipped_count || 0)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Penalty Total</p>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              PHP {Number(penaltyPreview.total_penalty_amount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Tenant', 'Unit', 'Month', 'Due Date', 'Outstanding', 'Penalty', 'Status'].map((header) => (
                  <th key={header} className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row) => (
                <tr key={`${row.bill_id}-${row.status}`} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{row.tenant_name}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{row.unit_label}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{row.billing_month}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{row.due_date || '-'}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">PHP {Number(row.outstanding_amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 font-semibold text-amber-600 dark:text-amber-400">PHP {Number(row.penalty_amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{row.eligible ? 'Pending automatic run' : row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ActionGuidePills() {
  const items = [
    ['Draft', 'Publish to Tenant first, then use Regenerate or Delete Draft only if needed'],
    ['Published', 'Waiting for Tenant Payment'],
    ['Overdue', 'Tenant can still pay; penalty applies automatically when eligible'],
    ['Submitted', 'Review Submitted Payment'],
    ['Paid', 'Paid'],
  ]

  return (
    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/20">
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Action Guide</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map(([label, action]) => (
          <span
            key={label}
            className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300"
          >
            {label}: {action}
          </span>
        ))}
      </div>
    </div>
  )
}

function PrepareBillsFlowPopover({ open, onClose }) {
  if (!open) return null

  const flowItems = [
    ['1', 'Generate Drafts', 'Create missing monthly bills after Facility has approved readings.'],
    ['2', 'Review Draft Queue', 'Check draft totals and remove or regenerate drafts when they look wrong.'],
    ['3', 'Publish To Tenant', 'Send only finalized drafts so tenants can see and pay them.'],
    ['4', 'Monitor Overdue', 'Overdue bills stay payable. Penalties are applied automatically when bills become eligible.'],
  ]

  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(92vw,440px)] overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-2xl shadow-blue-950/10 dark:border-blue-900/60 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/50 dark:shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-blue-500 dark:text-blue-300">Prepare Bills Flow</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">Billing workflow guide</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Follow this order to keep bill creation, tenant publishing, and collections clean.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close prepare bills flow"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {flowItems.map(([step, title, copy]) => (
          <div key={title} className="flex gap-3 rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm shadow-blue-500/20">
              {step}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{copy}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2.5 text-xs leading-5 text-slate-600 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-slate-300">
        <p><span className="font-semibold text-slate-700 dark:text-slate-200">Draft:</span> Publish, regenerate, or delete.</p>
        <p><span className="font-semibold text-slate-700 dark:text-slate-200">Published:</span> Wait for tenant payment submission.</p>
        <p><span className="font-semibold text-slate-700 dark:text-slate-200">Overdue:</span> Tenant can still pay; eligible penalties apply automatically.</p>
      </div>
    </div>
  )
}

export default function FinanceBillManagement() {
  const printRef = useRef(null)
  const {
    bills,
    tenants,
    rates,
    loading,
    saving,
    error,
    createBill,
    generateAllBills,
    regenerateBill,
    publishBill,
    removeBill,
    loadBillDetail,
    loadPaymentReviewBill,
    approvePayment,
    rejectPayment,
    draftBills,
    publishedBills,
    submittedBills,
    paidBills,
    totalRevenue,
    saveBillAdjustmentDraft,
    submitBillAdjustment,
    applyBillAdjustmentDirect,
    adjustmentMetrics,
  } = useFinanceBills()
  const { addToast } = useApp()
  const { isMonthLocked, getMonthLock } = useBillingPeriodLocks('finance')
  const {
    rule,
    penaltyPreview,
    previewLoading: penaltyLoading,
    previewPenalties,
  } = useBillingPenaltyRule()

  const [activeTab, setActiveTab] = useState('prepare')
  const [showPrepareFlow, setShowPrepareFlow] = useState(false)
  const [manageSearch, setManageSearch] = useState('')
  const [manageStatus, setManageStatus] = useState('all')
  const [allSearch, setAllSearch] = useState('')
  const [allStatus, setAllStatus] = useState('all')
  const [allUtility, setAllUtility] = useState('all')
  const [editBill, setEditBill] = useState(null)
  const formModal = useModalState()
  const batchModal = useModalState()
  const detailModal = useModalState()
  const adjustmentDrawer = useModalState()
  const historyModal = useModalState()
  const reviewModal = useModalState()

  const isInitialLoading = loading && bills.length === 0 && tenants.length === 0 && !error
  const isRefreshing = loading && (bills.length > 0 || tenants.length > 0)

  const prepareFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = manageSearch.trim().toLowerCase()
        return (
          ['draft', 'published', 'overdue'].includes(bill.status) &&
          (!q ||
            bill.tenant.toLowerCase().includes(q) ||
            bill.unit.toLowerCase().includes(q) ||
            bill.id.toLowerCase().includes(q)) &&
          (manageStatus === 'all' || bill.status === manageStatus)
        )
      }),
    [bills, manageSearch, manageStatus]
  )

  const paymentQueueFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = manageSearch.trim().toLowerCase()
        return (
          bill.status === 'payment_submitted' &&
          (!q ||
            bill.tenant.toLowerCase().includes(q) ||
            bill.unit.toLowerCase().includes(q) ||
            bill.id.toLowerCase().includes(q))
        )
      }),
    [bills, manageSearch]
  )

  const exceptionFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = manageSearch.trim().toLowerCase()
        const hasAdjustmentActivity =
          Boolean(bill.adjustmentState?.latestAdjustment) ||
          (bill.adjustmentHistory?.length || 0) > 0 ||
          bill.status === 'partial'

        return (
          hasAdjustmentActivity &&
          (!q ||
            bill.tenant.toLowerCase().includes(q) ||
            bill.unit.toLowerCase().includes(q) ||
            bill.id.toLowerCase().includes(q))
        )
      }),
    [bills, manageSearch]
  )

  const ledgerFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = allSearch.trim().toLowerCase()
        return (
          (!q ||
            bill.tenant.toLowerCase().includes(q) ||
            bill.unit.toLowerCase().includes(q) ||
            bill.id.toLowerCase().includes(q)) &&
          (allStatus === 'all' || bill.status === allStatus) &&
          (allUtility === 'all' || Number(bill.breakdown?.[allUtility] || 0) > 0)
        )
      }),
    [bills, allSearch, allStatus, allUtility]
  )

  const preparePagination = useClientPagination(prepareFiltered, 10)
  const paymentQueuePagination = useClientPagination(paymentQueueFiltered, 10)
  const exceptionPagination = useClientPagination(exceptionFiltered, 10)
  const allBillsPagination = useClientPagination(ledgerFiltered, 10)

  useEffect(() => {
    preparePagination.setPage(1)
    paymentQueuePagination.setPage(1)
    exceptionPagination.setPage(1)
  }, [manageSearch, manageStatus])

  useEffect(() => {
    allBillsPagination.setPage(1)
  }, [allSearch, allStatus, allUtility])

  const openCreate = () => {
    setEditBill(null)
    formModal.open({})
  }

  const openBatch = () => {
    batchModal.open({})
  }

  const openEdit = (bill) => {
    setEditBill(bill)
    formModal.open(bill)
  }

  const openAdjustment = (bill) => {
    adjustmentDrawer.open(bill)
  }

  const openHistory = (bill) => {
    historyModal.open(bill)
  }

  const openPaymentReview = async (bill) => {
    const reviewBill = await loadPaymentReviewBill(bill.id)

    if (!reviewBill) {
      addToast('Payment review details could not be loaded.', 'error')
      return
    }

    reviewModal.open(reviewBill)
  }

  const openBillDetail = async (bill) => {
    const detailBill = await loadBillDetail(bill.id)

    if (!detailBill) {
      addToast('Bill details could not be loaded.', 'error')
      return
    }

    detailModal.open(detailBill)
  }

  const handleSave = async (data) => {
    if (isMonthLocked(data.billingMonth)) {
      const lock = getMonthLock(data.billingMonth)
      const result = { success: false, message: `Billing month ${data.billingMonth} is locked.${lock?.reason ? ` Reason: ${lock.reason}` : ''}` }
      addToast(result.message, 'error')
      return result
    }

    const result = editBill?.id ? await regenerateBill(data) : await createBill(data)

    if (!result?.success) {
      addToast(result?.message || 'Failed to save bill.', 'error')
      return result
    }

    addToast(
      editBill?.id
        ? 'Bill regenerated as draft. Publish it to show on the tenant side.'
        : 'Bill generated as draft. Publish it to show on the tenant side.',
      'success'
    )
    return result
  }

  const handleGenerateAll = async ({ billingMonth, regenerateExisting }) => {
    if (isMonthLocked(billingMonth)) {
      const result = { success: false, message: `Billing month ${billingMonth} is locked.` }
      addToast(result.message, 'error')
      return result
    }

    const result = await generateAllBills({ billingMonth, regenerateExisting })

    if (!result?.success) {
      addToast(result?.message || 'Failed to generate all bills.', 'error')
      return result
    }

    addToast(result.message || 'Batch bill generation completed.', 'success')
    return result
  }

  const handlePublish = async (id) => {
    const result = await publishBill(id)
    addToast(result?.success ? 'Bill published successfully.' : result?.message || 'Failed to publish bill.', result?.success ? 'success' : 'error')
  }

  const handleDelete = async (id) => {
    const result = await removeBill(id)
    addToast(result?.success ? 'Bill deleted successfully.' : result?.message || 'Failed to delete bill.', result?.success ? 'success' : 'error')
  }

  const handleSaveAdjustmentDraft = async (payload) => {
    const result = await saveBillAdjustmentDraft(adjustmentDrawer.selectedItem, payload)
    addToast(result?.success ? 'Adjustment draft saved.' : result?.message || 'Failed to save draft.', result?.success ? 'success' : 'error')
    if (result?.success) adjustmentDrawer.close()
  }

  const handleSubmitAdjustment = async (payload) => {
    const result = await submitBillAdjustment(adjustmentDrawer.selectedItem, payload)
    addToast(result?.success ? 'Adjustment request submitted.' : result?.message || 'Failed to submit adjustment.', result?.success ? 'success' : 'error')
    if (result?.success) adjustmentDrawer.close()
  }

  const handleApplyAdjustment = async (payload) => {
    const result = await applyBillAdjustmentDirect(adjustmentDrawer.selectedItem, payload)
    addToast(result?.success ? 'Bill adjustment applied.' : result?.message || 'Failed to apply adjustment.', result?.success ? 'success' : 'error')
    if (result?.success) adjustmentDrawer.close()
  }

  const handleApprovePayment = async (billOrPaymentId) => {
    const result = await approvePayment(billOrPaymentId)
    addToast(result?.success ? result?.message || 'Payment approved successfully.' : result?.message || 'Failed to approve payment.', result?.success ? 'success' : 'error')
    return result
  }

  const handleRejectPayment = async (billOrPaymentId) => {
    const result = await rejectPayment(billOrPaymentId)
    addToast(result?.success ? result?.message || 'Payment rejected successfully.' : result?.message || 'Failed to reject payment.', result?.success ? 'success' : 'error')
    return result
  }

  const PREPARE_STATUS_TABS = [
    { k: 'all', l: 'All' },
    { k: 'draft', l: 'Draft' },
    { k: 'published', l: 'Published' },
    { k: 'overdue', l: 'Overdue' },
  ]

  const LEDGER_STATUS_TABS = [
    { k: 'all', l: 'All' },
    { k: 'draft', l: 'Draft' },
    { k: 'published', l: 'Published' },
    { k: 'overdue', l: 'Overdue' },
    { k: 'payment_submitted', l: 'Submitted' },
    { k: 'partial', l: 'Partial' },
    { k: 'paid', l: 'Paid' },
  ]

  const handleExportCurrent = () => {
    const currentRows =
      activeTab === 'prepare'
        ? prepareFiltered
        : activeTab === 'payments'
          ? paymentQueueFiltered
          : activeTab === 'exceptions'
            ? exceptionFiltered
            : ledgerFiltered

    const rows = currentRows.map((bill) => ({
      invoice_id: bill.id,
      tenant: bill.tenant,
      unit: bill.unit,
      month: bill.month,
      due_date: bill.dueDate,
      electricity: Number(bill.breakdown?.electricity || 0),
      water: Number(bill.breakdown?.water || 0),
      thermal: Number(bill.breakdown?.thermal || 0),
      total: Number(bill.amount || 0),
      status: bill.status,
    }))

    exportTableCsv(`finance-bills-${activeTab}.csv`, rows)
  }

  const handlePrintCurrent = () => {
    const subtitles = {
      prepare: 'Prepare bills queue',
      payments: 'Payment review queue',
      exceptions: 'Billing exceptions queue',
      ledger: 'Bill ledger view',
    }

    printElement({
      title: 'Billing Management',
      subtitle: subtitles[activeTab] || 'Billing management view',
      element: printRef.current,
    })
  }

  const handlePenaltyPreview = async (asOfDate) => {
    const result = await previewPenalties({ asOfDate })
    addToast(result?.success ? 'Penalty preview generated.' : result?.message || 'Failed to preview penalties.', result?.success ? 'success' : 'error')
  }

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Billing Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Generate, publish, regenerate, and adjust tenant bills</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
  <UpdatingBadge show={isRefreshing} />

  <PageActionBar
    onExport={handleExportCurrent}
    onPrint={handlePrintCurrent}
    exportLabel={
      activeTab === 'prepare'
        ? 'Export Prepare Queue'
        : activeTab === 'payments'
          ? 'Export Payment Queue'
          : activeTab === 'exceptions'
            ? 'Export Exceptions Queue'
            : 'Export Bill Ledger'
    }
    printLabel={
      activeTab === 'prepare'
        ? 'Print Prepare Queue'
        : activeTab === 'payments'
          ? 'Print Payment Queue'
          : activeTab === 'exceptions'
            ? 'Print Exceptions Queue'
            : 'Print Bill Ledger'
    }
    iconOnly
  />

  {activeTab === 'prepare' && (
    <>
      <button
        onClick={openBatch}
        className="
          flex items-center gap-2
          px-3 py-2 sm:px-4 sm:py-2
          text-sm font-semibold rounded-xl
          bg-slate-900 dark:bg-slate-700
          hover:bg-slate-800 dark:hover:bg-slate-600
          text-white shadow-lg
          transition-all hover:-translate-y-0.5 active:translate-y-0
        "
      >
        <LayoutList className="w-4 h-4" />
        <span className="hidden sm:inline">
          Run Bill Generation
        </span>
      </button>

      <button
        onClick={openCreate}
        className="
          flex items-center gap-2
          px-3 py-2 sm:px-4 sm:py-2
          text-sm font-semibold rounded-xl
          bg-blue-600 hover:bg-blue-700
          text-white shadow-lg shadow-blue-500/25
          transition-all hover:-translate-y-0.5 active:translate-y-0
        "
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">
          Generate Bill
        </span>
      </button>
    </>
  )}
</div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="relative flex w-full items-center justify-between gap-2">
  
  {/* Tabs */}
  <div className="
    flex items-center gap-1
    bg-white dark:bg-slate-900
    border border-slate-200/70 dark:border-slate-700/50
    rounded-2xl p-1.5 shadow-sm

    overflow-x-auto
    whitespace-nowrap
    scrollbar-hide
    max-w-full
  ">
    {[
      { key: 'prepare', label: 'Prepare Bills', Icon: Settings2 },
      { key: 'payments', label: 'Payment Queue', Icon: Send },
      { key: 'exceptions', label: 'Exceptions', Icon: Edit2 },
      { key: 'ledger', label: 'Bill Ledger', Icon: LayoutList },
    ].map(({ key, label, Icon }) => (
      <button
        key={key}
        onClick={() => {
          setActiveTab(key)
          setShowPrepareFlow(false)
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
          activeTab === key
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    ))}
  </div>

  {/* Right actions */}
  {activeTab === 'prepare' && (
    <>
      <button
        type="button"
        onClick={() => setShowPrepareFlow((value) => !value)}
        className={`
          inline-flex h-10 w-10 items-center justify-center rounded-xl border
          text-slate-500 shadow-sm transition-all hover:-translate-y-0.5
          dark:text-slate-300
          ${
            showPrepareFlow
              ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
          }
        `}
        aria-label="Show prepare bills flow"
        title="Prepare Bills Flow"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <PrepareBillsFlowPopover
        open={showPrepareFlow}
        onClose={() => setShowPrepareFlow(false)}
      />
    </>
  )}
</div>

      <div ref={printRef}>
      {activeTab === 'prepare' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Drafts', value: draftBills.length, color: 'text-slate-600 dark:text-slate-300', sub: 'Not yet published' },
              { label: 'Published', value: publishedBills.length, color: 'text-blue-600 dark:text-blue-400', sub: 'Tenants can see' },
              { label: 'Overdue', value: bills.filter((bill) => bill.status === 'overdue').length, color: 'text-rose-600 dark:text-rose-400', sub: 'Still payable by tenants' },
              { label: 'Waiting For Payment', value: publishedBills.length, color: 'text-indigo-600 dark:text-indigo-400', sub: 'Already sent to tenants' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`text-2xl font-bold ${card.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <PenaltyPreviewPanel
            rule={rule}
            penaltyPreview={penaltyPreview}
            loading={penaltyLoading}
            onPreview={handlePenaltyPreview}
          />

          <BillingPeriodLockPanel
            scope="finance"
            title="Finance Billing Period Lock"
            description="Finalized months auto-lock after cutoff. Manual lock and unlock are available for controlled exceptions."
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {PREPARE_STATUS_TABS.map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => setManageStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${manageStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{prepareFiltered.length} bills in prepare queue</p>
            </div>
            <ActionGuidePills />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice', 'Tenant', 'Unit', 'Month', 'Amount', 'Due Date', 'Status', 'Adjustment', 'Actions'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isInitialLoading ? (
                    <TableLoadingRow colSpan={9} />
                  ) : prepareFiltered.length === 0 ? (
                    <tr><td colSpan={9}><EmptyState title="No bills found" message="Generate a new bill to get started." /></td></tr>
                  ) : preparePagination.pagedItems.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{bill.dueDate}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        {bill.adjustmentState?.latestAdjustment ? (
                          <div className="flex flex-col gap-1">
                            <AdjustmentStatusBadge status={bill.adjustmentState.latestAdjustment.status} />
                            {bill.adjustmentState.isAdjusted ? (
                              <span className="text-[10px] text-slate-400">
                                PHP {Number(bill.adjustmentState.totalAdjustmentAmount || 0).toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(bill.id)}
                              disabled={saving}
                              title="Publish this draft so the tenant can view and pay it."
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap"
                            >
                              <Send className="w-3 h-3" /> Publish to Tenant
                            </button>
                          )}
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => openEdit(bill)}
                              disabled={saving}
                              title="Rebuild this bill using the latest approved readings for the selected billing month."
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all"
                            >
                              <Edit2 className="w-3 h-3" /> Regenerate Bill
                            </button>
                          )}
                          {bill.status === 'published' && (
                            <span
                              title="This bill is already visible to the tenant and is waiting for payment submission."
                              className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg whitespace-nowrap"
                            >
                              <Send className="w-3 h-3" /> Waiting for Payment
                            </span>
                          )}
                          {bill.status === 'overdue' && (
                            <span
                              title="This bill is overdue, but the tenant can still submit payment proof."
                              className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg whitespace-nowrap"
                            >
                              <AlertTriangle className="w-3 h-3" /> Overdue - Payable
                            </span>
                          )}
                          {['published', 'overdue', 'payment_submitted', 'paid', 'partial'].includes(bill.status) && (
                            <button
                              onClick={() => openAdjustment(bill)}
                              disabled={saving}
                              title="Open the bill adjustment workflow for corrections, disputes, or approved changes."
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-all whitespace-nowrap"
                            >
                              <Edit2 className="w-3 h-3" /> Open Adjustment
                            </button>
                          )}
                          {bill.adjustmentHistory?.length > 0 && (
                            <button
                              onClick={() => openHistory(bill)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-all whitespace-nowrap"
                            >
                              <Eye className="w-3 h-3" /> History
                            </button>
                          )}
                          {bill.status === 'payment_submitted' && (
                            <button
                              onClick={() => openPaymentReview(bill)}
                              disabled={saving}
                              title="Review the tenant's submitted payment proof for this bill."
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-all whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Review Submitted Payment
                            </button>
                          )}
                          {bill.status === 'paid' && (
                            <span
                              title="This bill is fully paid and needs no further billing action."
                              className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(bill.id)}
                              disabled={saving}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                              title="Delete this draft bill if it should no longer exist."
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <PaginationBar
                meta={preparePagination.meta}
                page={preparePagination.page}
                perPage={preparePagination.perPage}
                onPageChange={preparePagination.setPage}
                onPerPageChange={(value) => {
                  preparePagination.setPerPage(value)
                  preparePagination.setPage(1)
                }}
              />
            </div>
          <RateConfigCard rates={rates} />

          </div>
        </>
      )}

      {activeTab === 'payments' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Submitted', value: submittedBills.length, color: 'text-amber-600 dark:text-amber-400', sub: 'Need finance review' },
              { label: 'Paid', value: paidBills.length, color: 'text-emerald-600 dark:text-emerald-400', sub: 'Already cleared' },
              { label: 'Partial', value: bills.filter((bill) => bill.status === 'partial').length, color: 'text-orange-600 dark:text-orange-400', sub: 'Still outstanding' },
              { label: 'Queue Total', value: paymentQueueFiltered.length, color: 'text-slate-800 dark:text-white', sub: 'Current payment submissions' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`text-2xl font-bold ${card.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Payment Queue</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This tab is only for bills with submitted payment proof. Review the receipt, approve it, or reject it so the bill can move forward cleanly.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                placeholder="Search submitted payments by tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{paymentQueueFiltered.length} bills waiting for payment review</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice', 'Tenant', 'Unit', 'Month', 'Amount', 'Due Date', 'Status', 'Next Step'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isInitialLoading ? (
                    <TableLoadingRow colSpan={8} />
                  ) : paymentQueueFiltered.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState title="No submitted payments" message="Bills will appear here only after a tenant submits payment proof." /></td></tr>
                  ) : paymentQueuePagination.pagedItems.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{bill.dueDate}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openPaymentReview(bill)}
                            disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-all whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Review Submitted Payment
                          </button>
                          <button
                            onClick={() => openBillDetail(bill)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
                          >
                            <Eye className="w-3 h-3" /> View Bill
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <PaginationBar
                meta={paymentQueuePagination.meta}
                page={paymentQueuePagination.page}
                perPage={paymentQueuePagination.perPage}
                onPageChange={paymentQueuePagination.setPage}
                onPerPageChange={(value) => {
                  paymentQueuePagination.setPerPage(value)
                  paymentQueuePagination.setPage(1)
                }}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'exceptions' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Adj Pending', value: adjustmentMetrics.pending, color: 'text-orange-600 dark:text-orange-400', sub: 'Awaiting approval' },
              { label: 'Adjusted', value: adjustmentMetrics.applied, color: 'text-cyan-600 dark:text-cyan-400', sub: 'Applied changes' },
              { label: 'Partial Bills', value: bills.filter((bill) => bill.status === 'partial').length, color: 'text-amber-600 dark:text-amber-400', sub: 'Need follow-up' },
              { label: 'Queue Total', value: exceptionFiltered.length, color: 'text-slate-800 dark:text-white', sub: 'Bills with adjustment activity' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`text-2xl font-bold ${card.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Exceptions Queue</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use this queue for bill corrections, partial payment follow-ups, and any bill that already has adjustment activity. Operational edits stay here so the ledger can stay focused on records.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                placeholder="Search exceptions by tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{exceptionFiltered.length} bills in exceptions queue</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice', 'Tenant', 'Unit', 'Month', 'Status', 'Adjustment', 'Next Step'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isInitialLoading ? (
                    <TableLoadingRow colSpan={7} />
                  ) : exceptionFiltered.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState title="No billing exceptions" message="Bills with adjustments or partial follow-ups will appear here." /></td></tr>
                  ) : exceptionPagination.pagedItems.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        {bill.adjustmentState?.latestAdjustment ? (
                          <div className="flex flex-col gap-1">
                            <AdjustmentStatusBadge status={bill.adjustmentState.latestAdjustment.status} />
                            {bill.adjustmentState.isAdjusted ? (
                              <span className="text-[10px] text-slate-400">
                                PHP {Number(bill.adjustmentState.totalAdjustmentAmount || 0).toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">No adjustment request yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openAdjustment(bill)}
                            disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-all whitespace-nowrap"
                          >
                            <Edit2 className="w-3 h-3" /> Open Adjustment
                          </button>
                          {bill.adjustmentHistory?.length > 0 && (
                            <button
                              onClick={() => openHistory(bill)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-all whitespace-nowrap"
                            >
                              <Eye className="w-3 h-3" /> View Adjustment History
                            </button>
                          )}
                          <button
                            onClick={() => openBillDetail(bill)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
                          >
                            <Eye className="w-3 h-3" /> View Bill
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <PaginationBar
                meta={exceptionPagination.meta}
                page={exceptionPagination.page}
                perPage={exceptionPagination.perPage}
                onPageChange={exceptionPagination.setPage}
                onPerPageChange={(value) => {
                  exceptionPagination.setPerPage(value)
                  exceptionPagination.setPage(1)
                }}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'ledger' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Bills', value: bills.length, color: 'text-slate-800 dark:text-white', sub: 'All time' },
              { label: 'Collected', value: `PHP ${totalRevenue.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${paidBills.length} paid` },
              { label: 'Published', value: publishedBills.length, color: 'text-blue-600 dark:text-blue-400', sub: 'Awaiting tenant payment' },
              { label: 'Pending', value: submittedBills.length, color: 'text-amber-600 dark:text-amber-400', sub: 'Awaiting confirmation' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-md">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <LoadingValue loading={isInitialLoading} updating={isRefreshing} value={card.value} className={`text-2xl font-bold ${card.color}`} spinnerClassName="h-5 w-5 text-slate-400" />
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/50
  rounded-2xl p-4 shadow-md
  flex flex-col sm:flex-row
  gap-3 sm:items-center
">

  {/* Search */}
  <div className="relative w-full sm:flex-1 min-w-0">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      value={allSearch}
      onChange={(e) => setAllSearch(e.target.value)}
      placeholder="Search tenant, unit, or bill ID..."
      className="
        w-full pl-9 pr-4 py-2.5 text-sm
        rounded-xl bg-slate-50 dark:bg-slate-800/60
        border border-slate-200 dark:border-slate-700
        text-slate-700 dark:text-slate-200
        placeholder-slate-400 outline-none
        focus:border-blue-400 transition-all
      "
    />
  </div>

  {/* Status Tabs */}
  <div className="
    flex items-center gap-1
    bg-slate-50 dark:bg-slate-800/60
    border border-slate-200 dark:border-slate-700
    rounded-xl p-1
    overflow-x-auto
    whitespace-nowrap
    scrollbar-hide
    w-full sm:w-auto
  ">
    {LEDGER_STATUS_TABS.map(({ k, l }) => (
      <button
        key={k}
        onClick={() => setAllStatus(k)}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
          ${
            allStatus === k
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
          }
        `}
      >
        {l}
      </button>
    ))}
  </div>

  {/* Select */}
  <select
    value={allUtility}
    onChange={(e) => setAllUtility(e.target.value)}
    className="
      w-full sm:w-auto
      px-3 py-2.5 text-sm
      rounded-xl bg-slate-50 dark:bg-slate-800/60
      border border-slate-200 dark:border-slate-700
      text-slate-700 dark:text-slate-200
      outline-none focus:border-blue-400 transition-all
    "
  >
    <option value="all">All Utilities</option>
    <option value="electricity">Electricity</option>
    <option value="water">Water</option>
    <option value="thermal">Thermal</option>
  </select>
</div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ledgerFiltered.length} bills found</p>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice ID', 'Tenant', 'Unit', 'Month', 'Due Date', 'Electricity', 'Water', 'Thermal', 'Total', 'Status', 'Adjustment', 'Action'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isInitialLoading ? (
                    <TableLoadingRow colSpan={12} />
                  ) : ledgerFiltered.length === 0 ? (
                    <tr><td colSpan={12}><EmptyState title="No bills match your filters" message="Try adjusting the search or status filter." /></td></tr>
                  ) : allBillsPagination.pagedItems.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.dueDate}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-amber-600 dark:text-amber-400">PHP {Number(bill.breakdown?.electricity || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-cyan-600 dark:text-cyan-400">PHP {Number(bill.breakdown?.water || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-rose-600 dark:text-rose-400">PHP {Number(bill.breakdown?.thermal || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3"><BillStatusBadge status={bill.status} /></td>
                      <td className="px-4 py-3">
                        {bill.adjustmentState?.latestAdjustment ? <AdjustmentStatusBadge status={bill.adjustmentState.latestAdjustment.status} /> : <span className="text-xs text-slate-300 dark:text-slate-600">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openBillDetail(bill)}
                            title="View the full bill details and utility breakdown."
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
                          >
                            <Eye className="w-3 h-3" /> View Bill
                          </button>
                          {bill.adjustmentHistory?.length > 0 && (
                            <button
                              onClick={() => openHistory(bill)}
                              title="Review all adjustment actions previously recorded for this bill."
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-all whitespace-nowrap"
                            >
                              <Eye className="w-3 h-3" /> View Adjustment History
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <PaginationBar
                meta={allBillsPagination.meta}
                page={allBillsPagination.page}
                perPage={allBillsPagination.perPage}
                onPageChange={allBillsPagination.setPage}
                onPerPageChange={(value) => {
                  allBillsPagination.setPerPage(value)
                  allBillsPagination.setPage(1)
                }}
              />
            </div>
          </div>
        </>
      )}
      </div>

      <BillFormModal
        open={formModal.isOpen}
        onClose={formModal.close}
        tenants={tenants}
        initial={editBill}
        onSave={handleSave}
        saving={saving}
        isMonthLocked={isMonthLocked}
        getMonthLock={getMonthLock}
      />

      <GenerateAllBillsModal
        open={batchModal.isOpen}
        onClose={batchModal.close}
        onSubmit={handleGenerateAll}
        saving={saving}
        isMonthLocked={isMonthLocked}
        getMonthLock={getMonthLock}
      />

      {detailModal.isOpen && (
        <BillDetailModal bill={detailModal.selectedItem} onClose={detailModal.close} />
      )}

      <PaymentReviewModal
        bill={reviewModal.selectedItem}
        isOpen={reviewModal.isOpen}
        onClose={reviewModal.close}
        onApprove={handleApprovePayment}
        onReject={handleRejectPayment}
      />

      <BillAdjustmentDrawer
        bill={adjustmentDrawer.selectedItem}
        isOpen={adjustmentDrawer.isOpen}
        onClose={adjustmentDrawer.close}
        onSaveDraft={handleSaveAdjustmentDraft}
        onSubmit={handleSubmitAdjustment}
        onApply={handleApplyAdjustment}
        saving={saving}
      />

      <BillAdjustmentHistoryModal
        bill={historyModal.selectedItem}
        history={historyModal.selectedItem?.adjustmentHistory || []}
        isOpen={historyModal.isOpen}
        onClose={historyModal.close}
      />
    </div>
  )
}
