import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, History, Paperclip, ShieldAlert } from 'lucide-react'
import Drawer from '@/components/ui/Drawer'
import ConfirmModal from '@/components/ui/ConfirmModal'
import AdjustmentStatusBadge from './AdjustmentStatusBadge'
import { BILL_ADJUSTMENT_RULES, buildAdjustmentComparison, extractBillAdjustmentSnapshot } from '@/services/financeService/financeAdjustmentService'

const ADJUSTMENT_TYPES = [
  { value: 'billing_error', label: 'Billing Error' },
  { value: 'meter_reading_correction', label: 'Meter Reading Correction' },
  { value: 'utility_rate_correction', label: 'Utility Rate Correction' },
  { value: 'discount_waiver', label: 'Discount / Waiver' },
  { value: 'penalty_removal', label: 'Penalty Removal' },
  { value: 'manual_correction', label: 'Manual Correction' },
  { value: 'other', label: 'Other' },
]

const METHOD_OPTIONS = [
  { value: 'fixed', label: 'Add/Subtract fixed amount' },
  { value: 'line_items', label: 'Adjust per line item' },
  { value: 'replace_total', label: 'Replace total amount' },
]

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function buildInitialState(bill, existingDraft) {
  const snapshot = extractBillAdjustmentSnapshot(bill)

  return {
    adjustmentType: existingDraft?.adjustmentType || 'billing_error',
    otherReason: existingDraft?.otherReason || '',
    reason: existingDraft?.reason || '',
    notes: existingDraft?.notes || '',
    method: existingDraft?.adjustmentMethod || 'line_items',
    fixedAmount: 0,
    replacementTotal: existingDraft?.adjustedSnapshot?.grandTotal || snapshot.grandTotal,
    replaceTotalEnabled: true,
    supportAttachmentName: existingDraft?.supportAttachmentName || '',
    lineItemAdjustments: snapshot.lineItems.reduce((acc, item) => {
      const existingRow = existingDraft?.diffSnapshot?.lineItems?.find((row) => row.key === item.key)
      acc[item.key] = { adjustment: existingRow?.adjustmentAmount || 0 }
      return acc
    }, {}),
  }
}

export default function BillAdjustmentDrawer({
  bill,
  concern,
  isOpen,
  onClose,
  onSaveDraft,
  onSubmit,
  onApply,
  saving,
}) {
  const [form, setForm] = useState(buildInitialState(null))
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    if (!bill || !isOpen) return
    const draft = bill?.adjustmentHistory?.find((item) => item.status === 'draft')
    setForm(buildInitialState(bill, draft))
  }, [bill, isOpen])

  const snapshot = useMemo(() => extractBillAdjustmentSnapshot(bill || {}), [bill])

  const normalizedForm = useMemo(() => {
    if (!bill) return null

    if (form.method === 'fixed') {
      const fixedAdjustmentKey = snapshot.lineItems.some((item) => item.key === 'baseAmount') ? 'baseAmount' : 'misc'
      return {
        ...form,
        lineItemAdjustments: {
          ...form.lineItemAdjustments,
          [fixedAdjustmentKey]: { adjustment: Number(form.fixedAmount || 0) },
        },
      }
    }

    return form
  }, [bill, form, snapshot.lineItems])

  const preview = useMemo(() => {
    if (!bill || !normalizedForm) return null
    return buildAdjustmentComparison(bill, normalizedForm)
  }, [bill, normalizedForm])

  if (!bill) return null

  const approvalRequired = Boolean(preview?.requiresApproval)
  const hasInvalidState =
    !form.reason.trim() ||
    (form.adjustmentType === 'other' && !form.otherReason.trim()) ||
    !preview ||
    (preview?.diffSnapshot?.lineItems?.length === 0 && Number(preview?.diffSnapshot?.totalAdjustmentAmount || 0) === 0)

  const stickyActionClass = 'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50'

  const handleLineItemChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      lineItemAdjustments: {
        ...prev.lineItemAdjustments,
        [key]: { adjustment: Number(value || 0) },
      },
    }))
  }

  const handleSubmitAction = async (mode) => {
    if (!preview) return

    const payload = {
      ...normalizedForm,
      concernId: concern?.id || null,
      saveAsDraft: mode === 'draft',
    }

    if (mode === 'draft') {
      await onSaveDraft?.(payload)
      return
    }

    if (mode === 'submit') {
      await onSubmit?.(payload)
      return
    }

    await onApply?.(payload)
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        variant="center"
        panelClassName="max-w-6xl shadow-[0_25px_100px_rgba(0,0,0,0.35)]"
        title="Adjust Bill"
        subtitle={bill ? `${bill.id} • ${bill.tenant} • ${bill.unit}` : ''}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Bill Overview</p>
                <p className="mt-1 text-base font-semibold text-slate-800 dark:text-white">PHP {formatCurrency(snapshot.grandTotal)}</p>
              </div>
              {bill?.adjustmentState?.latestAdjustment ? (
                <AdjustmentStatusBadge status={bill.adjustmentState.latestAdjustment.status} />
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Bill ID', bill.id],
                ['Tenant', bill.tenant],
                ['Unit', bill.unit],
                ['Billing Period', bill.billingPeriod || bill.month],
                ['Original Due Date', bill.dueDate],
                ['Bill Status', bill.status],
                ['Payment Status', snapshot.paymentStatus],
                ['Payments Received', `PHP ${formatCurrency(snapshot.paymentsReceived)}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{value || '-'}</p>
                </div>
              ))}
            </div>

            {concern ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                Linked to billing concern {concern.id}. Once applied, this concern can be marked as resolved.
              </div>
            ) : null}
          </div>

          {snapshot.paymentStatus !== 'unpaid' ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              This bill already has payment activity. Unsafe direct apply is disabled and approval will be required.
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Adjustment Type</label>
                <select
                  value={form.adjustmentType}
                  onChange={(e) => setForm((prev) => ({ ...prev, adjustmentType: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                >
                  {ADJUSTMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {form.adjustmentType === 'other' ? (
                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Other Reason</label>
                  <input
                    value={form.otherReason}
                    onChange={(e) => setForm((prev) => ({ ...prev, otherReason: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                    placeholder="Specify the adjustment category"
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Adjustment Method</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {METHOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, method: option.value }))}
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-all ${form.method === option.value ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.method === 'fixed' ? (
                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Fixed Amount</label>
                  <input
                    type="number"
                    value={form.fixedAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, fixedAmount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                    placeholder="Use negative value to reduce the total"
                  />
                </div>
              ) : null}

              {form.method === 'replace_total' ? (
                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Replacement Total</label>
                  <input
                    type="number"
                    value={form.replacementTotal}
                    onChange={(e) => setForm((prev) => ({ ...prev, replacementTotal: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                  />
                  <p className="mt-2 text-xs text-slate-400">Use this only when a full recalculation is justified and traceable.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Line Item Adjustments</p>
                <p className="text-xs text-slate-400">Original values stay preserved in the audit history.</p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <History className="h-3 w-3" />
                Threshold: PHP {BILL_ADJUSTMENT_RULES.approvalThreshold.toLocaleString()}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Label', 'Original', 'Adjustment', 'New'].map((header) => (
                      <th key={header} className="px-2 py-2 text-left text-[10px] font-mono uppercase tracking-wide text-slate-400">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshot.lineItems.map((item) => {
                    const diff = Number(form.lineItemAdjustments?.[item.key]?.adjustment || 0)
                    const previewRow = preview?.diffSnapshot?.lineItems?.find((row) => row.key === item.key)
                    const nextValue = previewRow?.adjustedAmount ?? item.amount
                    return (
                      <tr key={item.key} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="px-2 py-3 font-medium text-slate-700 dark:text-slate-200">{item.label}</td>
                        <td className="px-2 py-3 text-slate-500 dark:text-slate-400">PHP {formatCurrency(item.amount)}</td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            value={diff}
                            disabled={form.method === 'fixed' || form.method === 'replace_total'}
                            onChange={(e) => handleLineItemChange(item.key, e.target.value)}
                            className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                          />
                        </td>
                        <td className="px-2 py-3 font-semibold text-slate-700 dark:text-slate-200">PHP {formatCurrency(nextValue)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Reason / Justification</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                  placeholder="Explain why this bill needs adjustment"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Internal Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                  placeholder="Visible in audit history for authorized reviewers"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-wide text-slate-400">Support Attachment</label>
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <Paperclip className="h-4 w-4" />
                  <input
                    value={form.supportAttachmentName}
                    onChange={(e) => setForm((prev) => ({ ...prev, supportAttachmentName: e.target.value }))}
                    className="w-full bg-transparent outline-none"
                    placeholder="Attachment name or reference"
                  />
                </div>
              </div>
            </div>
          </div>

          {preview ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Before / After Preview</p>
                  <p className="text-xs text-slate-400">Review every changed value before saving.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {approvalRequired ? <AdjustmentStatusBadge status="pending_approval" /> : <AdjustmentStatusBadge status="applied" />}
                  <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${Number(preview.diffSnapshot.totalAdjustmentAmount) >= 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                    {Number(preview.diffSnapshot.totalAdjustmentAmount) >= 0 ? '+' : ''}
                    PHP {formatCurrency(preview.diffSnapshot.totalAdjustmentAmount)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Original Total</p>
                  <p className="mt-1 text-lg font-bold text-slate-700 dark:text-slate-200">PHP {formatCurrency(preview.originalSnapshot.grandTotal)}</p>
                </div>
                <div className="rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-blue-400">Adjusted Total</p>
                  <p className="mt-1 text-lg font-bold text-blue-700 dark:text-blue-300">PHP {formatCurrency(preview.adjustedSnapshot.grandTotal)}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Remaining Balance</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">PHP {formatCurrency(preview.adjustedSnapshot.remainingBalance)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-slate-400">Credit / Overpayment</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">PHP {formatCurrency(preview.adjustedSnapshot.creditAmount)}</p>
                </div>
              </div>

              {preview.warnings.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {preview.warnings.map((warning) => (
                    <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      {warning}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  This adjustment can be reviewed and recorded safely.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 mt-5 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button onClick={onClose} className={`${stickyActionClass} bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700`}>
              Cancel
            </button>
            <button
              disabled={hasInvalidState || saving}
              onClick={() => handleSubmitAction('draft')}
              className={`${stickyActionClass} bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600`}
            >
              Save Draft
            </button>
            <button
              disabled={hasInvalidState || saving || !approvalRequired}
              onClick={() => setConfirmAction('submit')}
              className={`${stickyActionClass} bg-amber-500 text-white hover:bg-amber-600`}
            >
              Submit for Approval
            </button>
            <button
              disabled={hasInvalidState || saving || approvalRequired}
              onClick={() => setConfirmAction('apply')}
              className={`${stickyActionClass} bg-blue-600 text-white hover:bg-blue-700`}
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title="Confirm Bill Adjustment"
        message="You are about to adjust a finalized bill. This action will be logged and may be visible to authorized users."
        confirmLabel={confirmAction === 'submit' ? 'Submit Request' : 'Apply Adjustment'}
        confirmClass={confirmAction === 'submit' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          const mode = confirmAction
          setConfirmAction(null)
          await handleSubmitAction(mode)
        }}
      />
    </>
  )
}
