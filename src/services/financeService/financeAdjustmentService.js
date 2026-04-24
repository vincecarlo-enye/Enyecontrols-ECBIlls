import api from '@/lib/api'

const STORAGE_KEY = 'ec_bill_adjustments'
const REMOTE_SUPPORT_KEY = 'ec_adjustments_remote_supported'
const APPROVAL_THRESHOLD = 1000
const DEFAULT_APPROVER_ROLES = ['admin', 'super_admin']
let remoteAdjustmentsSupported = (() => {
  try {
    const raw = localStorage.getItem(REMOTE_SUPPORT_KEY)
    return raw == null ? true : raw !== 'false'
  } catch {
    return true
  }
})()

function setRemoteAdjustmentsSupported(value) {
  remoteAdjustmentsSupported = Boolean(value)
  try {
    localStorage.setItem(REMOTE_SUPPORT_KEY, String(Boolean(value)))
  } catch {
    // Ignore storage failures and keep in-memory fallback behavior.
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStore(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('sb_auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function generateId() {
  return `ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function isoNow() {
  return new Date().toISOString()
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function labelFromKey(key) {
  const map = {
    baseAmount: 'Base Bill Amount',
    electricity: 'Electricity Charge',
    water: 'Water Charge',
    thermal: 'Thermal Charge',
    penalty: 'Penalty / Late Fee',
    misc: 'Misc Charges',
    discount: 'Discount',
    previousBalance: 'Previous Balance',
    other: 'Other Charges',
  }

  return map[key] || key
}

function normalizePaymentStatus(snapshot = {}) {
  const paymentsReceived = toNumber(snapshot.paymentsReceived)
  const total = toNumber(snapshot.grandTotal)

  if (paymentsReceived <= 0) return 'unpaid'
  if (paymentsReceived >= total && total > 0) return 'paid'
  return 'partial'
}

function deriveBillStatus(snapshot = {}) {
  if (toNumber(snapshot.creditAmount) > 0) return 'paid'
  if (toNumber(snapshot.remainingBalance) > 0 && toNumber(snapshot.paymentsReceived) > 0) return 'partial'
  return snapshot.status || 'published'
}

export function extractBillAdjustmentSnapshot(bill = {}) {
  const raw = bill?.raw || bill || {}
  const breakdown = bill?.breakdown || raw?.breakdown || {}
  const baseLineItems = [
    {
      key: 'electricity',
      label: labelFromKey('electricity'),
      amount: toNumber(
        breakdown?.electricity ??
        breakdown?.electric ??
        raw?.electricity_charge ??
        0
      ),
      editable: true,
    },
    {
      key: 'water',
      label: labelFromKey('water'),
      amount: toNumber(breakdown?.water ?? raw?.water_charge ?? 0),
      editable: true,
    },
    {
      key: 'thermal',
      label: labelFromKey('thermal'),
      amount: toNumber(breakdown?.thermal ?? raw?.thermal_charge ?? 0),
      editable: true,
    },
    {
      key: 'penalty',
      label: labelFromKey('penalty'),
      amount: toNumber(raw?.penalty ?? raw?.late_fee ?? 0),
      editable: true,
    },
    {
      key: 'misc',
      label: labelFromKey('misc'),
      amount: toNumber(raw?.misc_charges ?? raw?.other_charges ?? 0),
      editable: true,
    },
    {
      key: 'discount',
      label: labelFromKey('discount'),
      amount: toNumber(raw?.discount ?? 0),
      editable: true,
    },
    {
      key: 'previousBalance',
      label: labelFromKey('previousBalance'),
      amount: toNumber(raw?.previous_balance ?? raw?.balance_forward ?? 0),
      editable: true,
    },
  ]

  const baseSubtotal = baseLineItems
    .filter((item) => item.key !== 'discount' && item.key !== 'previousBalance')
    .reduce((sum, item) => sum + toNumber(item.amount), 0)

  const discount = toNumber(baseLineItems.find((item) => item.key === 'discount')?.amount || 0)
  const previousBalance = toNumber(baseLineItems.find((item) => item.key === 'previousBalance')?.amount || 0)
  const tax = toNumber(raw?.tax ?? raw?.vat ?? raw?.tax_amount ?? 0)
  const paymentsReceived = toNumber(raw?.payments_received ?? raw?.amount_paid ?? 0)
  const computedGrandTotal = baseSubtotal + tax + previousBalance - discount
  const grandTotal = toNumber(
    raw?.grand_total ??
    raw?.total_amount ??
    bill?.amount ??
    computedGrandTotal
  )
  const residualBaseAmount = grandTotal - computedGrandTotal
  const lineItems = Math.abs(residualBaseAmount) > 0.009
    ? [
      {
        key: 'baseAmount',
        label: labelFromKey('baseAmount'),
        amount: residualBaseAmount,
        editable: true,
      },
      ...baseLineItems,
    ]
    : baseLineItems
  const subtotal = lineItems
    .filter((item) => item.key !== 'discount' && item.key !== 'previousBalance')
    .reduce((sum, item) => sum + toNumber(item.amount), 0)
  const remainingBalance = Math.max(grandTotal - paymentsReceived, 0)
  const creditAmount = Math.max(paymentsReceived - grandTotal, 0)

  return {
    billId: String(bill?.id ?? raw?.id ?? ''),
    tenantName: bill?.tenant || raw?.tenant?.name || raw?.tenant_name || 'Unknown Tenant',
    tenantId: bill?.tenantId ?? raw?.tenant_id ?? raw?.tenant?.id ?? null,
    unit: bill?.unit || raw?.unit?.unit_number || raw?.unit?.name || raw?.unit_name || 'N/A',
    unitId: bill?.unitId ?? raw?.unit_id ?? raw?.unit?.id ?? null,
    month: bill?.month || raw?.billing_month || '',
    billingPeriod: bill?.billingPeriod || raw?.billing_period || '',
    originalDueDate: bill?.dueDate || raw?.due_date || raw?.dueDate || '',
    status: bill?.status || raw?.status || 'draft',
    paymentStatus: normalizePaymentStatus({ paymentsReceived, grandTotal }),
    meterSummary: raw?.meter_summary || {
      previous: raw?.previous_reading ?? null,
      current: raw?.current_reading ?? null,
      consumption: raw?.consumption ?? null,
    },
    lineItems,
    subtotal,
    tax,
    discount,
    previousBalance,
    paymentsReceived,
    grandTotal,
    remainingBalance,
    creditAmount,
  }
}

export function buildAdjustmentComparison(bill, adjustmentInput = {}) {
  const originalSnapshot = extractBillAdjustmentSnapshot(bill)
  const adjustmentsByKey = adjustmentInput?.lineItemAdjustments || {}

  const adjustedLineItems = originalSnapshot.lineItems.map((item) => {
    const adjustmentAmount = toNumber(adjustmentsByKey[item.key]?.adjustment || 0)
    const adjustedAmount = item.key === 'discount'
      ? Math.max(item.amount + adjustmentAmount, 0)
      : item.amount + adjustmentAmount

    return {
      ...item,
      originalAmount: item.amount,
      adjustmentAmount,
      adjustedAmount,
    }
  })

  const adjustedSubtotal = adjustedLineItems
    .filter((item) => item.key !== 'discount' && item.key !== 'previousBalance')
    .reduce((sum, item) => sum + toNumber(item.adjustedAmount), 0)

  const adjustedDiscount = toNumber(adjustedLineItems.find((item) => item.key === 'discount')?.adjustedAmount || 0)
  const adjustedPreviousBalance = toNumber(adjustedLineItems.find((item) => item.key === 'previousBalance')?.adjustedAmount || 0)
  const adjustedTax = toNumber(adjustmentInput?.taxOverride ?? originalSnapshot.tax)

  let adjustedGrandTotal = adjustedSubtotal + adjustedTax + adjustedPreviousBalance - adjustedDiscount
  if (adjustmentInput?.method === 'replace_total' && adjustmentInput?.replaceTotalEnabled) {
    adjustedGrandTotal = toNumber(adjustmentInput?.replacementTotal, adjustedGrandTotal)
  }

  adjustedGrandTotal = Math.max(adjustedGrandTotal, 0)

  const totalAdjustmentAmount = adjustedGrandTotal - originalSnapshot.grandTotal
  const remainingBalance = Math.max(adjustedGrandTotal - originalSnapshot.paymentsReceived, 0)
  const creditAmount = Math.max(originalSnapshot.paymentsReceived - adjustedGrandTotal, 0)

  const adjustedSnapshot = {
    ...originalSnapshot,
    lineItems: adjustedLineItems.map((item) => ({
      key: item.key,
      label: item.label,
      amount: item.adjustedAmount,
      editable: item.editable,
    })),
    subtotal: adjustedSubtotal,
    tax: adjustedTax,
    discount: adjustedDiscount,
    previousBalance: adjustedPreviousBalance,
    grandTotal: adjustedGrandTotal,
    remainingBalance,
    creditAmount,
    paymentStatus: normalizePaymentStatus({
      paymentsReceived: originalSnapshot.paymentsReceived,
      grandTotal: adjustedGrandTotal,
    }),
    status: deriveBillStatus({
      status: originalSnapshot.status,
      paymentsReceived: originalSnapshot.paymentsReceived,
      remainingBalance,
      creditAmount,
    }),
  }

  const diffSnapshot = {
    totalAdjustmentAmount,
    oldTotal: originalSnapshot.grandTotal,
    newTotal: adjustedGrandTotal,
    paymentImpact: {
      remainingBalance,
      creditAmount,
    },
    lineItems: adjustedLineItems
      .filter((item) => toNumber(item.adjustmentAmount) !== 0)
      .map((item) => ({
        key: item.key,
        label: item.label,
        originalAmount: item.originalAmount,
        adjustmentAmount: item.adjustmentAmount,
        adjustedAmount: item.adjustedAmount,
      })),
  }

  const warnings = []
  if (originalSnapshot.paymentStatus !== 'unpaid') {
    warnings.push('This bill already has recorded payments. Approval is required before applying adjustments.')
  }
  if (Math.abs(totalAdjustmentAmount) >= APPROVAL_THRESHOLD) {
    warnings.push(`This adjustment exceeds the approval threshold of PHP ${APPROVAL_THRESHOLD.toLocaleString()}.`)
  }
  if (readStore().some((item) => String(item.billId) === String(originalSnapshot.billId) && ['draft', 'pending_approval', 'applied'].includes(item.status))) {
    warnings.push('This bill already has adjustment history. Review previous entries before applying another change.')
  }
  if (adjustedGrandTotal < 0) {
    warnings.push('Adjusted total is below zero. Review line items before proceeding.')
  }
  if (adjustedGrandTotal === 0 && originalSnapshot.grandTotal > 0 && Math.abs(totalAdjustmentAmount) < originalSnapshot.grandTotal) {
    warnings.push('Adjusted total resolved to zero unexpectedly. Review the bill breakdown before proceeding.')
  }

  return {
    originalSnapshot,
    adjustedSnapshot,
    diffSnapshot,
    warnings,
    requiresApproval:
      Math.abs(totalAdjustmentAmount) >= APPROVAL_THRESHOLD ||
      originalSnapshot.paymentStatus !== 'unpaid' ||
      originalSnapshot.status === 'paid',
    allowedApproverRoles: DEFAULT_APPROVER_ROLES,
  }
}

function sortNewestFirst(rows = []) {
  return [...rows].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))
}

function normalizeRemoteAdjustment(row = {}) {
  if (!row || typeof row !== 'object') return row

  return {
    id: row.id,
    billId: String(row.billId ?? row.bill_id ?? ''),
    concernId: row.concernId ?? row.concern_id ?? null,
    adjustmentType: row.adjustmentType ?? row.adjustment_type ?? 'manual_correction',
    adjustmentMethod: row.adjustmentMethod ?? row.adjustment_method ?? 'line_items',
    status: row.status ?? 'draft',
    reason: row.reason ?? '',
    otherReason: row.otherReason ?? row.other_reason ?? '',
    notes: row.notes ?? '',
    supportAttachmentName: row.supportAttachmentName ?? row.support_attachment_name ?? '',
    originalSnapshot: row.originalSnapshot ?? row.original_snapshot ?? {},
    adjustedSnapshot: row.adjustedSnapshot ?? row.adjusted_snapshot ?? {},
    diffSnapshot: row.diffSnapshot ?? row.diff_snapshot ?? {},
    warnings: Array.isArray(row.warnings) ? row.warnings : [],
    requiresApproval: Boolean(row.requiresApproval ?? row.requires_approval),
    approvalThreshold: row.approvalThreshold ?? row.approval_threshold ?? APPROVAL_THRESHOLD,
    allowedApproverRoles: row.allowedApproverRoles ?? row.allowed_approver_roles ?? DEFAULT_APPROVER_ROLES,
    approvalNotes: row.approvalNotes ?? row.approval_notes ?? '',
    rejectionReason: row.rejectionReason ?? row.rejection_reason ?? '',
    adjustedBy: row.adjustedBy ?? row.adjusted_by_user ?? null,
    approvedBy: row.approvedBy ?? row.approved_by_user ?? null,
    rejectedBy: row.rejectedBy ?? row.rejected_by_user ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    submittedAt: row.submittedAt ?? row.submitted_at ?? null,
    approvedAt: row.approvedAt ?? row.approved_at ?? null,
    rejectedAt: row.rejectedAt ?? row.rejected_at ?? null,
    effectiveAt: row.effectiveAt ?? row.effective_at ?? null,
    cancelledAt: row.cancelledAt ?? row.cancelled_at ?? null,
  }
}

function mergeById(rows = []) {
  const map = new Map()
  rows.forEach((row) => {
    map.set(String(row.id), row)
  })
  return Array.from(map.values())
}

export async function fetchBillAdjustments(billId) {
  const localRows = readStore().filter((row) => String(row.billId) === String(billId))

  if (!remoteAdjustmentsSupported) {
    return sortNewestFirst(localRows)
  }

  try {
    const res = await api.get(`/api/bills/${billId}/adjustments`, {
      validateStatus: (status) => status < 500,
    })
    if (res.status === 404) {
      setRemoteAdjustmentsSupported(false)
      return sortNewestFirst(localRows)
    }
    const remoteRows = (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []).map(normalizeRemoteAdjustment)
    return sortNewestFirst(mergeById([...remoteRows, ...localRows]))
  } catch {
    return sortNewestFirst(localRows)
  }
}

export async function fetchAllAdjustments() {
  const localRows = readStore()

  if (!remoteAdjustmentsSupported) {
    return sortNewestFirst(localRows)
  }

  try {
    const res = await api.get('/api/adjustments', {
      validateStatus: (status) => status < 500,
    })
    if (res.status === 404) {
      setRemoteAdjustmentsSupported(false)
      return sortNewestFirst(localRows)
    }
    const remoteRows = (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []).map(normalizeRemoteAdjustment)
    return sortNewestFirst(mergeById([...remoteRows, ...localRows]))
  } catch {
    return sortNewestFirst(localRows)
  }
}

export async function fetchAdjustmentById(id) {
  const localMatch = readStore().find((row) => String(row.id) === String(id))

  if (!remoteAdjustmentsSupported) {
    return localMatch || null
  }

  try {
    const res = await api.get(`/api/adjustments/${id}`, {
      validateStatus: (status) => status < 500,
    })
    if (res.status === 404) {
      setRemoteAdjustmentsSupported(false)
      return localMatch || null
    }
    return normalizeRemoteAdjustment(res?.data?.data || res?.data || localMatch || null)
  } catch {
    return localMatch || null
  }
}

function saveLocalAdjustment(record) {
  const existing = readStore()
  const next = existing.filter((row) => String(row.id) !== String(record.id))
  next.push(record)
  writeStore(next)
  return record
}

function removeLocalAdjustment(id) {
  writeStore(readStore().filter((row) => String(row.id) !== String(id)))
}

export function createAdjustmentNotification({
  title,
  message,
  actor = 'System',
  adjustmentId = null,
  tenantId = null,
  recipientTenantId = null,
  userId = null,
  recipientUserId = null,
  targetRoles = [],
  role = null,
}) {
  return {
    title,
    message,
    created_by: actor,
    tenant_id: tenantId,
    recipient_tenant_id: recipientTenantId,
    user_id: userId,
    recipient_user_id: recipientUserId,
    target_roles: Array.isArray(targetRoles) ? targetRoles : [],
    role,
    entity_type: 'bill_adjustment',
    entity_id: adjustmentId,
  }
}

export async function createBillAdjustment(bill, payload) {
  const actor = getCurrentUser()
  const comparison = buildAdjustmentComparison(bill, payload)
  const record = {
    id: generateId(),
    billId: String(bill?.id),
    concernId: payload?.concernId || null,
    adjustmentType: payload?.adjustmentType || 'manual_correction',
    adjustmentMethod: payload?.method || 'line_items',
    status: payload?.saveAsDraft ? 'draft' : comparison.requiresApproval ? 'pending_approval' : 'applied',
    reason: payload?.reason || '',
    otherReason: payload?.otherReason || '',
    notes: payload?.notes || '',
    supportAttachmentName: payload?.supportAttachmentName || '',
    originalSnapshot: comparison.originalSnapshot,
    adjustedSnapshot: comparison.adjustedSnapshot,
    diffSnapshot: comparison.diffSnapshot,
    warnings: comparison.warnings,
    requiresApproval: comparison.requiresApproval,
    approvedBy: comparison.requiresApproval ? null : actor ? { id: actor.id, name: actor.name, role: actor.role } : null,
    adjustedBy: actor ? { id: actor.id, name: actor.name, role: actor.role } : null,
    rejectedBy: null,
    rejectionReason: '',
    createdAt: isoNow(),
    submittedAt: payload?.saveAsDraft ? null : isoNow(),
    effectiveAt: payload?.saveAsDraft || comparison.requiresApproval ? null : isoNow(),
    approvalThreshold: APPROVAL_THRESHOLD,
    allowedApproverRoles: DEFAULT_APPROVER_ROLES,
  }

  try {
    const res = await api.post(`/api/bills/${bill?.id}/adjustments`, payload)
    return normalizeRemoteAdjustment(res?.data?.data || record)
  } catch {
    return saveLocalAdjustment(record)
  }
}

export async function submitAdjustment(id) {
  const actor = getCurrentUser()
  const current = await fetchAdjustmentById(id)
  if (!current) throw new Error('Adjustment request not found.')
  const next = {
    ...current,
    status: current.requiresApproval ? 'pending_approval' : 'applied',
    submittedAt: isoNow(),
    effectiveAt: current.requiresApproval ? null : isoNow(),
    approvedBy: current.requiresApproval ? null : actor ? { id: actor.id, name: actor.name, role: actor.role } : null,
  }

  try {
    const res = await api.patch(`/api/adjustments/${id}/submit`)
    return normalizeRemoteAdjustment(res?.data?.data || next)
  } catch {
    return saveLocalAdjustment(next)
  }
}

export async function applyAdjustment(id) {
  const actor = getCurrentUser()
  const current = await fetchAdjustmentById(id)
  if (!current) throw new Error('Adjustment request not found.')
  if (current.requiresApproval && current.status !== 'approved') {
    throw new Error('This adjustment requires approval before it can be applied.')
  }

  const next = {
    ...current,
    status: 'applied',
    approvedBy: current.approvedBy || (actor ? { id: actor.id, name: actor.name, role: actor.role } : null),
    effectiveAt: isoNow(),
  }

  try {
    const res = await api.patch(`/api/adjustments/${id}/apply`)
    return normalizeRemoteAdjustment(res?.data?.data || next)
  } catch {
    return saveLocalAdjustment(next)
  }
}

export async function approveAdjustment(id, payload = {}) {
  const actor = getCurrentUser()
  const current = await fetchAdjustmentById(id)
  if (!current) throw new Error('Adjustment request not found.')
  if (current?.adjustedBy?.id && actor?.id && String(current.adjustedBy.id) === String(actor.id)) {
    throw new Error('You cannot approve your own adjustment request.')
  }

  const next = {
    ...current,
    status: 'approved',
    approvalNotes: payload?.notes || '',
    approvedBy: actor ? { id: actor.id, name: actor.name, role: actor.role } : null,
    approvedAt: isoNow(),
  }

  try {
    const res = await api.patch(`/api/adjustments/${id}/approve`, payload)
    return normalizeRemoteAdjustment(res?.data?.data || saveLocalAdjustment(next))
  } catch {
    return saveLocalAdjustment(next)
  }
}

export async function rejectAdjustment(id, payload = {}) {
  const actor = getCurrentUser()
  const current = await fetchAdjustmentById(id)
  if (!current) throw new Error('Adjustment request not found.')
  const next = {
    ...current,
    status: 'rejected',
    rejectedBy: actor ? { id: actor.id, name: actor.name, role: actor.role } : null,
    rejectionReason: payload?.reason || '',
    rejectedAt: isoNow(),
  }

  try {
    const res = await api.patch(`/api/adjustments/${id}/reject`, payload)
    return normalizeRemoteAdjustment(res?.data?.data || saveLocalAdjustment(next))
  } catch {
    return saveLocalAdjustment(next)
  }
}

export async function cancelAdjustment(id) {
  const current = await fetchAdjustmentById(id)
  if (!current) return null

  const next = {
    ...current,
    status: 'cancelled',
    cancelledAt: isoNow(),
  }

  try {
    const res = await api.patch(`/api/adjustments/${id}/cancel`)
    return normalizeRemoteAdjustment(res?.data?.data || saveLocalAdjustment(next))
  } catch {
    return saveLocalAdjustment(next)
  }
}

export function removeDraftAdjustment(id) {
  removeLocalAdjustment(id)
}

export function decorateBillWithAdjustmentState(bill, adjustments = []) {
  const billAdjustments = adjustments.filter((item) => String(item.billId) === String(bill?.id))
  if (billAdjustments.length === 0) {
    return {
      ...bill,
      adjustmentHistory: [],
      adjustmentState: {
        isAdjusted: false,
        hasPendingAdjustment: false,
        latestAdjustment: null,
        originalAmount: Number(bill?.amount || 0),
        adjustedAmount: Number(bill?.amount || 0),
        totalAdjustmentAmount: 0,
        creditAmount: 0,
        remainingBalance: Number(bill?.amount || 0),
      },
    }
  }

  const latestApplied = billAdjustments.find((item) => item.status === 'applied')
  const latestPending = billAdjustments.find((item) => ['pending_approval', 'approved'].includes(item.status))
  const latest = latestApplied || latestPending || billAdjustments[0]

  return {
    ...bill,
    amount: latestApplied ? toNumber(latestApplied.adjustedSnapshot?.grandTotal, bill.amount) : bill.amount,
    status: latestApplied ? latestApplied.adjustedSnapshot?.status || bill.status : bill.status,
    adjustmentHistory: billAdjustments,
    adjustmentState: {
      isAdjusted: Boolean(latestApplied),
      hasPendingAdjustment: Boolean(latestPending),
      latestAdjustment: latest,
      originalAmount: toNumber(latest?.originalSnapshot?.grandTotal, bill.amount),
      adjustedAmount: latestApplied
        ? toNumber(latestApplied.adjustedSnapshot?.grandTotal, bill.amount)
        : toNumber(latest?.adjustedSnapshot?.grandTotal, bill.amount),
      totalAdjustmentAmount: toNumber(latest?.diffSnapshot?.totalAdjustmentAmount, 0),
      creditAmount: toNumber(latestApplied?.adjustedSnapshot?.creditAmount, 0),
      remainingBalance: toNumber(latestApplied?.adjustedSnapshot?.remainingBalance, bill.amount),
    },
  }
}

export function summarizeAdjustmentMetrics(adjustments = []) {
  const applied = adjustments.filter((item) => item.status === 'applied')
  const pending = adjustments.filter((item) => item.status === 'pending_approval')

  return {
    total: adjustments.length,
    applied: applied.length,
    pending: pending.length,
    rejected: adjustments.filter((item) => item.status === 'rejected').length,
    totalAdjustmentAmount: applied.reduce((sum, item) => sum + toNumber(item.diffSnapshot?.totalAdjustmentAmount, 0), 0),
  }
}

export const BILL_ADJUSTMENT_RULES = {
  approvalThreshold: APPROVAL_THRESHOLD,
  approverRoles: DEFAULT_APPROVER_ROLES,
}
