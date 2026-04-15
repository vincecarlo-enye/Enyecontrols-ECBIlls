import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  FileText, Plus, Send, Edit2, Trash2, Search,
  Eye, CheckCircle2, X, Zap, Droplets, Flame,
  LayoutList, Settings2, Filter, AlertTriangle, History, BadgeDollarSign,
} from 'lucide-react'
import { usePageLoader } from '@/hooks/usePageLoader'
import { BillingSkeleton } from '@/components/skeletons'
import EmptyState from '@/components/ui/EmptyState'
import BillStatusBadge from '@/components/billing/BillStatusBadge'
import { useApp } from '@/context/AppContext'
import { useModalState } from '@/hooks/useModalState'
import RateConfigCard from '@/components/common/RateConfigCard'
import BillingPeriodLockPanel from '@/components/common/BillingPeriodLockPanel'
import { useFinanceBills } from '@/hooks/financeHooks/useFinanceBills'
import { useBillingPeriodLocks } from '@/hooks/useBillingPeriodLocks'
import { useBillingPenaltyRule } from '@/hooks/useBillingPenaltyRule'

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

const ADJUSTMENT_TYPES = [
  ['billing_error', 'Billing Error'],
  ['meter_reading_correction', 'Meter Reading Correction'],
  ['utility_rate_correction', 'Utility Rate Correction'],
  ['discount_waiver', 'Discount / Waiver'],
  ['penalty_removal', 'Penalty Removal'],
  ['manual_correction', 'Manual Correction'],
  ['other', 'Other'],
]

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatAdjustmentLabel(item) {
  const workflow = item?.workflow_type && item.workflow_type !== 'direct_adjustment' ? item.workflow_type : item?.adjustment_type
  return String(workflow || 'adjustment').replace(/_/g, ' ')
}

function summarizeBulkGenerationResult(result) {
  if (result?.success) return result?.message || 'Bulk bill generation completed.'

  const summary = Array.isArray(result?.data?.failure_summary) ? result.data.failure_summary : []
  const topFailure = summary[0]
  if (topFailure?.message) {
    return `${result?.message || 'Bulk bill generation failed.'} ${topFailure.count ? `Most common reason: ${topFailure.count} tenant(s) - ` : ''}${topFailure.message}`
  }

  const failedRows = Array.isArray(result?.data?.results)
    ? result.data.results.filter((row) => !row?.success)
    : []
  const firstFailure = failedRows[0]
  if (firstFailure?.message) {
    return `${result?.message || 'Bulk bill generation failed.'} First blocker: ${firstFailure.message}`
  }

  return result?.message || 'Failed to generate bills in bulk.'
}

function getBillItems(bill) {
  const rawItems = Array.isArray(bill?.raw?.items) ? bill.raw.items : []
  if (rawItems.length > 0) {
    return rawItems.map((item) => ({
      id: item.id,
      label: item.description || item.type || `Line #${item.id}`,
      type: item.type || 'line_item',
      amount: Number(item.amount || 0),
      previousReading: item.previous_reading,
      currentReading: item.current_reading,
      consumption: item.consumption,
    }))
  }

  return Object.entries(bill?.breakdown || {})
    .filter(([, amount]) => Number(amount || 0) !== 0)
    .map(([key, amount]) => ({
      id: null,
      label: key,
      type: key,
      amount: Number(amount || 0),
      previousReading: null,
      currentReading: null,
      consumption: null,
    }))
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
              Finance can only generate bills from approved readings and active billing rates that cover the selected billing month.
            </p>
          </div>

          {monthLocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {billingMonth} is locked. {selectedLock?.reason ? `Reason: ${selectedLock.reason}` : 'Unlock the billing period first before generating or regenerating bills.'}
            </div>
          )}

          {selectedTenant && (
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-xs font-mono uppercase text-slate-400 mb-1">Selected Tenant</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedTenant.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unit {selectedTenant.unit || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                Bills now use dedicated submeters only. If this unit has no dedicated approved electric, water, or thermal submeter readings, that utility will not be billed for the selected month.
              </div>
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

function BulkBillFormModal({ open, onClose, tenantCount, onSave, saving, isMonthLocked, getMonthLock }) {
  const [billingMonth, setBillingMonth] = useState('')

  useEffect(() => {
    if (!open) return
    setBillingMonth('')
  }, [open])

  if (!open) return null
  const selectedLock = billingMonth ? getMonthLock?.(billingMonth) : null
  const monthLocked = billingMonth ? isMonthLocked?.(billingMonth) : false

  const handleSubmit = async () => {
    if (!billingMonth) return
    const result = await onSave({ billingMonth })
    if (result?.success) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white">Generate Bills in Bulk</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-xs font-mono uppercase text-slate-400 mb-1">Target</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{tenantCount} active tenant records</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Existing bills for the same month will be skipped automatically.</p>
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
              Bulk generation still requires approved readings and active rates per tenant/unit.
            </p>
          </div>

          {monthLocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {billingMonth} is locked. {selectedLock?.reason ? `Reason: ${selectedLock.reason}` : 'Unlock the billing period first before running bulk bill generation.'}
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
            Generate All
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
            <div className="grid grid-cols-3 gap-2">
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

          <AdjustmentHistoryPanel bill={bill} />
        </div>
      </div>
    </div>,
    document.body
  )
}

function AdjustmentHistoryPanel({ bill }) {
  const rows = Array.isArray(bill?.adjustments) ? bill.adjustments : []

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Adjustment History</p>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-slate-400">No bill adjustments recorded yet.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((item) => (
            <div key={item.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatAdjustmentLabel(item)}
                </p>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${item.status === 'applied' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : item.status === 'pending_approval' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {String(item.status || '').replace(/_/g, ' ')}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatPeso(item.original_total)} to {formatPeso(item.adjusted_total)} ({formatPeso(item.net_difference)})
                {item.ledger_entry ? <span className="ml-1">Ledger: {String(item.ledger_entry.entry_type || '').replace(/_/g, ' ')}</span> : null}
              </p>
              {item.reason && <p className="mt-1 text-xs text-slate-400">{item.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BillAdjustmentModal({ open, bill, onClose, onSave, saving }) {
  const [adjustmentType, setAdjustmentType] = useState('manual_correction')
  const [method, setMethod] = useState('line_items')
  const [direction, setDirection] = useState('subtract')
  const [amount, setAmount] = useState('')
  const [targetTotal, setTargetTotal] = useState('')
  const [workflowType, setWorkflowType] = useState('credit')
  const [settlementMethod, setSettlementMethod] = useState('apply_next_bill')
  const [correctedTotal, setCorrectedTotal] = useState('')
  const [reason, setReason] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [otherExplanation, setOtherExplanation] = useState('')
  const [lineAdjustments, setLineAdjustments] = useState({})
  const [confirmed, setConfirmed] = useState(false)

  const billItems = useMemo(() => getBillItems(bill), [bill])
  const isPaidBill = bill?.status === 'paid'

  useEffect(() => {
    if (!open) return
    setAdjustmentType('manual_correction')
    setMethod('line_items')
    setDirection('subtract')
    setAmount('')
    setTargetTotal('')
    setWorkflowType('credit')
    setSettlementMethod('apply_next_bill')
    setCorrectedTotal('')
    setReason('')
    setInternalNotes('')
    setOtherExplanation('')
    setLineAdjustments({})
    setConfirmed(false)
  }, [open, bill?.id])

  useEffect(() => {
    if (!isPaidBill) return
    if (workflowType === 'credit') setSettlementMethod('apply_next_bill')
    if (workflowType === 'refund') setSettlementMethod('refund_manual')
    if (workflowType === 'additional_charge') setSettlementMethod('add_next_bill')
    if (workflowType === 'critical_error') setSettlementMethod('reopen_bill')
  }, [isPaidBill, workflowType])

  const netDifference = useMemo(() => {
    if (isPaidBill) {
      if (workflowType === 'critical_error') return 0
      if (correctedTotal === '') return 0
      return Number(correctedTotal || 0) - Number(bill?.amount || 0)
    }

    if (method === 'fixed_amount') {
      const value = Math.abs(Number(amount || 0))
      return direction === 'add' ? value : -value
    }

    if (method === 'replace_total') {
      return Number(targetTotal || 0) - Number(bill?.amount || 0)
    }

    return billItems.reduce((sum, item) => sum + Number(lineAdjustments[item.id || item.label] || 0), 0)
  }, [amount, bill?.amount, billItems, correctedTotal, direction, isPaidBill, lineAdjustments, method, targetTotal, workflowType])

  const adjustedTotal = Number(bill?.amount || 0) + netDifference
  const requiresApproval = isPaidBill || Math.abs(netDifference) > 5000
  const paidWorkflowDirectionValid =
    !isPaidBill ||
    workflowType === 'critical_error' ||
    (['credit', 'refund'].includes(workflowType) && netDifference < 0) ||
    (workflowType === 'additional_charge' && netDifference > 0)
  const canSubmit = bill && reason.trim() && paidWorkflowDirectionValid && adjustedTotal >= 0 && (workflowType === 'critical_error' || netDifference !== 0) && (adjustmentType !== 'other' || otherExplanation.trim()) && confirmed

  if (!open || !bill) return null

  const buildPayload = (action) => {
    if (isPaidBill) {
      return {
        action: action === 'apply' ? 'submit' : action,
        adjustment_type: adjustmentType,
        method: 'replace_total',
        workflow_type: workflowType,
        settlement_method: settlementMethod,
        corrected_total: workflowType === 'critical_error' ? Number(bill.amount || 0) : Number(correctedTotal || 0),
        target_total: workflowType === 'critical_error' ? Number(bill.amount || 0) : Number(correctedTotal || 0),
        line_items: [],
        reason,
        internal_notes: internalNotes,
        other_explanation: otherExplanation,
      }
    }

    return {
      action,
      adjustment_type: adjustmentType,
      method,
      workflow_type: 'direct_adjustment',
      direction,
      amount: method === 'fixed_amount' ? Number(amount || 0) : undefined,
      target_total: method === 'replace_total' ? Number(targetTotal || 0) : undefined,
      line_items: method === 'line_items'
        ? billItems.map((item) => ({
            bill_item_id: item.id,
            label: item.label,
            adjustment_amount: Number(lineAdjustments[item.id || item.label] || 0),
          })).filter((item) => item.adjustment_amount !== 0)
        : [],
      reason,
      internal_notes: internalNotes,
      other_explanation: otherExplanation,
    }
  }

  const handleSave = async (action) => {
    const result = await onSave(bill.id, buildPayload(action))
    if (result?.success) onClose()
  }

  const workflowCards = [
    { value: 'credit', title: 'Credit Balance', body: 'Tenant paid too much. Create credit and apply it to the next bill.' },
    { value: 'refund', title: 'Refund Record', body: 'Tenant paid too much but Finance will process refund manually.' },
    { value: 'additional_charge', title: 'Additional Charge', body: 'Tenant paid too little. Add the balance to the next bill.' },
    { value: 'critical_error', title: 'Critical Error', body: 'Approval-only action for reopening or voiding payment records.' },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-[16px] text-slate-800 dark:text-white flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5 text-teal-500" />
              {isPaidBill ? 'Paid Bill Adjustment Workflow' : 'Adjust Bill'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">Bill #{bill.id} - {bill.tenant} - {bill.unit}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {[
              ['Bill ID', bill.id],
              ['Tenant', bill.tenant],
              ['Unit', bill.unit],
              ['Period', bill.billingPeriod || bill.month],
              ['Due Date', bill.dueDate],
              ['Status', bill.status],
              ['Original Total', formatPeso(bill.amount)],
              ['Payment Status', isPaidBill ? 'Fully paid - direct edits locked' : bill.status === 'payment_submitted' ? 'Payment submitted' : 'Open'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{value || '-'}</p>
              </div>
            ))}
          </div>

          {isPaidBill && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300 flex gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>This bill is already paid. Direct editing is disabled. Use a separate adjustment record so overpayment becomes credit/refund and underpayment becomes a next-bill charge.</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Reason Category</label>
                  <select value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none">
                    {ADJUSTMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                {!isPaidBill && (
                  <div>
                    <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Method</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none">
                      <option value="line_items">Adjust per line item</option>
                      <option value="fixed_amount">Add/Subtract fixed amount</option>
                      <option value="replace_total">Replace total amount</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Approval Rule</label>
                  <div className={`px-3 py-2.5 rounded-xl border text-sm font-semibold ${requiresApproval ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300' : 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800/50 dark:bg-teal-900/20 dark:text-teal-300'}`}>
                    {requiresApproval ? 'Approval required' : 'Finance can apply'}
                  </div>
                </div>
              </div>

              {adjustmentType === 'other' && (
                <input value={otherExplanation} onChange={(e) => setOtherExplanation(e.target.value)} placeholder="Explain the Other adjustment type..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none" />
              )}

              {isPaidBill ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {workflowCards.map((card) => (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => setWorkflowType(card.value)}
                        className={`text-left rounded-2xl border p-4 transition-all ${workflowType === card.value ? 'border-teal-400 bg-teal-50 text-teal-800 dark:border-teal-500/60 dark:bg-teal-900/20 dark:text-teal-200' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300'}`}
                      >
                        <p className="text-sm font-bold">{card.title}</p>
                        <p className="mt-1 text-xs opacity-80">{card.body}</p>
                      </button>
                    ))}
                  </div>

                  {workflowType !== 'critical_error' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Correct Amount</label>
                        <input type="number" step="0.01" value={correctedTotal} onChange={(e) => setCorrectedTotal(e.target.value)} placeholder="Correct bill amount" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Settlement</label>
                        <select value={settlementMethod} onChange={(e) => setSettlementMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none">
                          {workflowType === 'credit' && <option value="apply_next_bill">Apply credit to next bill</option>}
                          {workflowType === 'refund' && <option value="refund_manual">Manual refund record</option>}
                          {workflowType === 'additional_charge' && <option value="add_next_bill">Add charge to next bill</option>}

                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-mono uppercase text-slate-400 mb-1.5 block">Critical Action</label>
                      <select value={settlementMethod} onChange={(e) => setSettlementMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none">
                        <option value="reopen_bill">Reopen bill after approval</option>
                        <option value="void_payment_reopen_bill">Void verified payment and reopen bill after approval</option>
                      </select>
                    </div>
                  )}

                  {!paidWorkflowDirectionValid && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300">
                      Credit/refund needs a lower corrected amount. Additional charge needs a higher corrected amount.
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {method === 'line_items' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-sm" style={{ minWidth: '720px' }}>
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50">
                            {['Label', 'Original Amount', 'Adjustment', 'New Amount', 'Meter Summary'].map((header) => (
                              <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {billItems.map((item) => {
                            const key = item.id || item.label
                            const adjustment = Number(lineAdjustments[key] || 0)
                            return (
                              <tr key={key}>
                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{item.label}</td>
                                <td className="px-4 py-3 font-mono text-slate-500">{formatPeso(item.amount)}</td>
                                <td className="px-4 py-3">
                                  <input type="number" step="0.01" value={lineAdjustments[key] || ''} onChange={(e) => setLineAdjustments((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="0.00" className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none" />
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{formatPeso(item.amount + adjustment)}</td>
                                <td className="px-4 py-3 text-xs text-slate-400">{item.previousReading || item.currentReading ? `${item.previousReading || '-'} to ${item.currentReading || '-'} (${item.consumption || 0})` : '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {method === 'fixed_amount' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select value={direction} onChange={(e) => setDirection(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none">
                        <option value="subtract">Subtract / Credit tenant</option>
                        <option value="add">Add charge</option>
                      </select>
                      <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Fixed amount" className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none" />
                    </div>
                  )}

                  {method === 'replace_total' && (
                    <input type="number" step="0.01" value={targetTotal} onChange={(e) => setTargetTotal(e.target.value)} placeholder="New grand total" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none" />
                  )}
                </>
              )}

              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Required reason / tenant-visible justification..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none resize-none" />
              <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} placeholder="Internal notes for audit trail..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none resize-none" />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Before / After Preview</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Original</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatPeso(bill.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Difference</span><span className={`font-semibold ${netDifference < 0 ? 'text-teal-600' : 'text-amber-600'}`}>{formatPeso(netDifference)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700"><span className="text-slate-400">Correct / New Total</span><span className="font-bold text-slate-900 dark:text-white">{formatPeso(adjustedTotal)}</span></div>
                </div>
                {isPaidBill && (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {netDifference < 0 ? 'Result: credit/refund ledger will be created. Original paid bill remains traceable.' : netDifference > 0 ? 'Result: additional charge ledger will be created for the next bill.' : 'Result: approval-only critical correction. No direct edit until reviewed.'}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-400">Timestamp preview: {new Date().toLocaleString()}</p>
              </div>

              <AdjustmentHistoryPanel bill={bill} />

              <label className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
                <span>{isPaidBill ? 'This paid bill will stay locked. The correction will be logged and processed through approval, ledger, refund, or reopen workflow.' : 'You are about to adjust a finalized bill. This action will be logged and may be visible to authorized users.'}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-5 py-4 flex flex-col sm:flex-row justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Cancel</button>
          <button onClick={() => handleSave('draft')} disabled={saving || !reason.trim()} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50">Save Draft</button>
          <button onClick={() => handleSave(requiresApproval ? 'submit' : 'apply')} disabled={!canSubmit || saving} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
            {requiresApproval ? 'Submit for Approval' : 'Apply Adjustment'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
export default function FinanceBillManagement() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageLoading = usePageLoader(700)
  const {
    bills,
    tenants,
    rates,
    loading,
    saving,
    error,
    assistPreview,
    assistLoading,
    previewBillingAssist,
    createBill,
    generateBillsBulk,
    generateReadyBills,
    regenerateBill,
    publishBill,
    removeBill,
    adjustBill,
    draftBills,
    publishedBills,
    submittedBills,
    paidBills,
    totalRevenue,
  } = useFinanceBills()
  const { addToast } = useApp()
  const { isMonthLocked, getMonthLock } = useBillingPeriodLocks('finance')
  const [assistMonth, setAssistMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const {
    rule: penaltyRule,
    penaltyPreview,
    previewLoading: penaltyPreviewLoading,
    applyPenalties,
    previewPenalties,
  } = useBillingPenaltyRule()

  const [activeTab, setActiveTab] = useState('manage')
  const [manageSearch, setManageSearch] = useState('')
  const [manageStatus, setManageStatus] = useState('all')
  const [allSearch, setAllSearch] = useState('')
  const [allStatus, setAllStatus] = useState('all')
  const [allUtility, setAllUtility] = useState('all')
  const [penaltyAsOf, setPenaltyAsOf] = useState(() => new Date().toISOString().slice(0, 10))
  const [editBill, setEditBill] = useState(null)
  const formModal = useModalState()
  const bulkFormModal = useModalState()
  const detailModal = useModalState()
  const adjustmentModal = useModalState()

  useEffect(() => {
    const navbarSearchItem = location.state?.navbarSearchItem
    if (!navbarSearchItem?.query) return

    const query = String(navbarSearchItem.query).trim()
    if (!query) return

    setActiveTab('all-bills')
    setManageSearch(query)
    setAllSearch(query)

    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        navbarSearchItem: null,
      },
    })
  }, [location.pathname, location.state, navigate])

  const loadingState = pageLoading || loading

  const manageFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = manageSearch.toLowerCase()
        return (
          (!q ||
            bill.tenant.toLowerCase().includes(q) ||
            bill.unit.toLowerCase().includes(q) ||
            bill.id.toLowerCase().includes(q)) &&
          (manageStatus === 'all' || bill.status === manageStatus)
        )
      }),
    [bills, manageSearch, manageStatus]
  )

  const allFiltered = useMemo(
    () =>
      bills.filter((bill) => {
        const q = allSearch.toLowerCase()
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

  if (loadingState) return <BillingSkeleton />

  const openCreate = () => {
    setEditBill(null)
    formModal.open({})
  }

  const openBulkCreate = () => {
    bulkFormModal.open({})
  }

  const openEdit = (bill) => {
    setEditBill(bill)
    formModal.open(bill)
  }

  const handleSave = async (data) => {
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

  const handlePublish = async (id) => {
    const result = await publishBill(id)
    addToast(result?.success ? 'Bill published successfully.' : result?.message || 'Failed to publish bill.', result?.success ? 'success' : 'error')
  }

  const handleDelete = async (id) => {
    const result = await removeBill(id)
    addToast(result?.success ? 'Bill deleted successfully.' : result?.message || 'Failed to delete bill.', result?.success ? 'success' : 'error')
  }

  const handleBulkSave = async ({ billingMonth }) => {
    const result = await generateBillsBulk({
      tenantIds: tenants.map((tenant) => tenant.id),
      billingMonth,
    })

    addToast(summarizeBulkGenerationResult(result), result?.success ? 'success' : 'error')

    return result
  }

  const handleAssistPreview = async () => {
    if (!assistMonth) {
      addToast('Select a billing month first.', 'error')
      return
    }

    const result = await previewBillingAssist({ billingMonth: assistMonth })
    addToast(
      result?.success ? 'Billing assist preview loaded.' : result?.message || 'Failed to load billing assist preview.',
      result?.success ? 'success' : 'error'
    )
  }

  const handleGenerateReady = async () => {
    if (!assistMonth) {
      addToast('Select a billing month first.', 'error')
      return
    }

    const result = await generateReadyBills({ billingMonth: assistMonth })
    addToast(
      result?.success
        ? result?.message || 'Ready bills generated successfully.'
        : result?.message || 'No bill-ready tenants found for the selected month.',
      result?.success ? 'success' : 'error'
    )
  }

  const handleAdjustBill = async (billId, payload) => {
    const result = await adjustBill(billId, payload)
    addToast(
      result?.success
        ? result?.message || 'Bill adjustment saved.'
        : result?.message || 'Failed to save bill adjustment.',
      result?.success ? 'success' : 'error'
    )
    return result
  }

  const handlePenaltyPreview = async () => {
    const result = await previewPenalties({ asOfDate: penaltyAsOf })
    addToast(
      result?.success ? 'Penalty preview loaded.' : result?.message || 'Failed to preview penalties.',
      result?.success ? 'success' : 'error'
    )
  }

  const handleApplyPenalties = async () => {
    const result = await applyPenalties({ asOfDate: penaltyAsOf })
    addToast(
      result?.success ? result?.message || 'Penalties applied successfully.' : result?.message || 'No penalties were applied.',
      result?.success ? 'success' : 'error'
    )
  }

  const STATUS_TABS = [
    { k: 'all', l: 'All' },
    { k: 'draft', l: 'Draft' },
    { k: 'published', l: 'Published' },
    { k: 'payment_submitted', l: 'Submitted' },
    { k: 'paid', l: 'Paid' },
  ]

  return (
    <div className="space-y-5 animate-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Billing Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Generate, publish, and monitor all tenant bills</p>
        </div>
        {activeTab === 'manage' && (
          <div className="flex items-center gap-2">
            <button
              onClick={openBulkCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" /> Generate All
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" /> Generate Bill
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'manage', label: 'Manage Bills', Icon: Settings2 },
          { key: 'all-bills', label: 'All Bills', Icon: LayoutList },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'manage' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Drafts', value: draftBills.length, color: 'text-slate-600 dark:text-slate-300', sub: 'Not yet published' },
              { label: 'Published', value: publishedBills.length, color: 'text-blue-600 dark:text-blue-400', sub: 'Tenants can see' },
              { label: 'Submitted', value: submittedBills.length, color: 'text-amber-600 dark:text-amber-400', sub: 'Pending review' },
              { label: 'Paid', value: paidBills.length, color: 'text-emerald-600 dark:text-emerald-400', sub: 'Completed' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Automated Monthly Billing Assist</p>
                <p className="text-xs text-slate-400 mt-1">
                  Preview which tenant records are bill-ready for a billing month, then generate only the ready ones.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="month"
                  value={assistMonth}
                  onChange={(e) => setAssistMonth(e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
                />
                <button
                  onClick={handleAssistPreview}
                  disabled={!assistMonth || assistLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all"
                >
                  {assistLoading ? 'Checking...' : 'Preview Readiness'}
                </button>
                <button
                  onClick={handleGenerateReady}
                  disabled={!assistMonth || saving || assistLoading || !assistPreview?.readyTenantIds?.length || assistPreview?.locked}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Generate Ready Only
                </button>
              </div>
            </div>

            {assistPreview?.billingMonth === assistMonth && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Checked', value: assistPreview.summary.total, cls: 'text-slate-700 dark:text-slate-200' },
                    { label: 'Ready', value: assistPreview.summary.ready, cls: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Already Billed', value: assistPreview.summary.alreadyBilled, cls: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Blocked', value: assistPreview.summary.blocked, cls: 'text-amber-600 dark:text-amber-400' },
                  ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                      <p className={`text-2xl font-bold ${card.cls}`}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {assistPreview.locked && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                    {assistMonth} is locked. {assistPreview?.lock?.reason ? `Reason: ${assistPreview.lock.reason}` : 'Unlock the billing period first before generating ready bills.'}
                  </div>
                )}

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-sm" style={{ minWidth: '760px' }}>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        {['Tenant', 'Unit', 'Readiness', 'Billable Usage', 'Previous Balance', 'Estimated Total', 'Notes'].map((header) => (
                          <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {assistPreview.rows.map((row) => (
                        <tr key={`${row.tenantId}-${row.status}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenantName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.unitLabel}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${row.ready ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : row.status === 'already_billed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                              {row.ready ? 'Ready' : row.status === 'already_billed' ? 'Already Billed' : 'Blocked'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">PHP {row.billableTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">PHP {row.previousBalance.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {row.estimatedTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Penalty / Surcharge Assist</p>
                <p className="text-xs text-slate-400 mt-1">
                  Review overdue bills eligible for late fees based on the current super admin rule, then apply them in one run.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={penaltyAsOf}
                  onChange={(e) => setPenaltyAsOf(e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-amber-400 transition-all"
                />
                <button
                  onClick={handlePenaltyPreview}
                  disabled={penaltyPreviewLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all"
                >
                  {penaltyPreviewLoading ? 'Checking...' : 'Preview Penalties'}
                </button>
                <button
                  onClick={handleApplyPenalties}
                  disabled={
                    !penaltyRule?.isEnabled ||
                    penaltyPreviewLoading ||
                    !penaltyPreview?.summary?.eligible
                  }
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Apply Due Penalties
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              {penaltyRule?.isEnabled ? (
                <>
                  Active rule: <span className="font-semibold">{penaltyRule.penaltyType === 'fixed' ? `PHP ${Number(penaltyRule.penaltyValue || 0).toFixed(2)}` : `${Number(penaltyRule.penaltyValue || 0).toFixed(2)}%`}</span>
                  {' '}after <span className="font-semibold">{penaltyRule.graceDays}</span> grace day(s).
                </>
              ) : (
                <>Penalty rules are disabled in Super Admin Billing Rates, so no surcharge can be applied yet.</>
              )}
            </div>

            {penaltyPreview && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Bills Checked', value: penaltyPreview.summary.checked, cls: 'text-slate-700 dark:text-slate-200' },
                    { label: 'Eligible', value: penaltyPreview.summary.eligible, cls: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Already Penalized', value: penaltyPreview.summary.already_penalized, cls: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Not Yet Due', value: penaltyPreview.summary.not_due, cls: 'text-slate-500 dark:text-slate-300' },
                  ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                      <p className={`text-2xl font-bold ${card.cls}`}>{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-sm" style={{ minWidth: '780px' }}>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        {['Tenant', 'Unit', 'Bill Month', 'Due Date', 'Outstanding', 'Penalty', 'Status', 'Notes'].map((header) => (
                          <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {penaltyPreview.rows.map((row) => (
                        <tr key={row.bill_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenant_name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.unit_label}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.billing_month}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.due_date || '-'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">PHP {Number(row.outstanding_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">PHP {Number(row.penalty_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${row.eligible ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : row.status === 'already_penalized' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {row.eligible ? 'Eligible' : row.status === 'already_penalized' ? 'Applied' : 'Skipped'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <BillingPeriodLockPanel
            scope="finance"
            title="Finance Billing Period Lock"
            description="Freeze finalized months before collections and audits so bill actions cannot be changed accidentally."
          />

          <RateConfigCard rates={rates} />

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
              {STATUS_TABS.map(({ k, l }) => (
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
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{manageFiltered.length} bills</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice', 'Tenant', 'Unit', 'Month', 'Amount', 'Due Date', 'Status', 'Actions'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {manageFiltered.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState title="No bills found" message="Generate a new bill to get started." /></td></tr>
                  ) : manageFiltered.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{bill.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{bill.tenant}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{bill.unit}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{bill.month}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">PHP {bill.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{bill.dueDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <BillStatusBadge status={bill.status} />
                          {bill.hasAdjustment && (
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-[10px] font-semibold">Adjusted</span>
                          )}
                          {bill.hasPendingAdjustment && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-semibold">Pending Adjustment</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(bill.id)}
                              disabled={saving}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all whitespace-nowrap"
                            >
                              <Send className="w-3 h-3" /> Publish
                            </button>
                          )}
                          {['draft', 'published'].includes(bill.status) && (
                            <button
                              onClick={() => openEdit(bill)}
                              disabled={saving}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all"
                            >
                              <Edit2 className="w-3 h-3" /> Regenerate
                            </button>
                          )}
                          {bill.status === 'payment_submitted' && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" /> Needs Review
                            </span>
                          )}
                          {!['draft'].includes(bill.status) && (
                            <button
                              onClick={() => adjustmentModal.open(bill)}
                              disabled={saving}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 transition-all whitespace-nowrap"
                            >
                              <BadgeDollarSign className="w-3 h-3" /> {bill.status === 'paid' ? 'Workflow' : 'Adjust'}
                            </button>
                          )}
                          {bill.status === 'paid' && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" /> Complete
                            </span>
                          )}
                          {['draft', 'published'].includes(bill.status) && (
                            <button
                              onClick={() => handleDelete(bill.id)}
                              disabled={saving}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                              title="Delete"
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
          </div>
        </>
      )}

      {activeTab === 'all-bills' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Bills', value: bills.length, color: 'text-slate-800 dark:text-white', sub: 'All time' },
              { label: 'Collected', value: `PHP ${totalRevenue.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400', sub: `${paidBills.length} paid` },
              { label: 'Published', value: publishedBills.length, color: 'text-blue-600 dark:text-blue-400', sub: 'Awaiting tenant payment' },
              { label: 'Pending', value: submittedBills.length, color: 'text-amber-600 dark:text-amber-400', sub: 'Awaiting confirmation' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-md">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-md flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={allSearch}
                onChange={(e) => setAllSearch(e.target.value)}
                placeholder="Search tenant, unit, or bill ID..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {STATUS_TABS.map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => setAllStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${allStatus === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <select
              value={allUtility}
              onChange={(e) => setAllUtility(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 transition-all"
            >
              <option value="all">All Utilities</option>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="thermal">Thermal</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{allFiltered.length} bills found</p>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Invoice ID', 'Tenant', 'Unit', 'Month', 'Due Date', 'Electricity', 'Water', 'Thermal', 'Total', 'Status', 'Action'].map((header) => (
                      <th key={header} className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allFiltered.length === 0 ? (
                    <tr><td colSpan={11}><EmptyState title="No bills match your filters" message="Try adjusting the search or status filter." /></td></tr>
                  ) : allFiltered.map((bill) => (
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
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <BillStatusBadge status={bill.status} />
                          {bill.hasAdjustment && (
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-[10px] font-semibold">Adjusted</span>
                          )}
                          {bill.hasPendingAdjustment && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-semibold">Pending Adjustment</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => detailModal.open(bill)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {!['draft'].includes(bill.status) && (
                            <button
                              onClick={() => adjustmentModal.open(bill)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 transition-all"
                            >
                              <BadgeDollarSign className="w-3 h-3" /> {bill.status === 'paid' ? 'Workflow' : 'Adjust'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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

      <BulkBillFormModal
        open={bulkFormModal.isOpen}
        onClose={bulkFormModal.close}
        tenantCount={tenants.length}
        onSave={handleBulkSave}
        saving={saving}
        isMonthLocked={isMonthLocked}
        getMonthLock={getMonthLock}
      />

      {detailModal.isOpen && (
        <BillDetailModal bill={detailModal.selectedItem} onClose={detailModal.close} />
      )}

      <BillAdjustmentModal
        open={adjustmentModal.isOpen}
        bill={adjustmentModal.selectedItem}
        onClose={adjustmentModal.close}
        onSave={handleAdjustBill}
        saving={saving}
      />
    </div>
  )
}









