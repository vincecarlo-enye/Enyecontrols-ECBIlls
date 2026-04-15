import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchTenantBills,
  fetchTenantBill,
  submitTenantBillPayment,
} from '@/services/tenantService/tenantBillingService'

const TENANT_VISIBLE = ['published', 'submitted', 'paid', 'overdue']

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeBreakdown(items = []) {
  const totals = {
    electricity: 0,
    water: 0,
    thermal: 0,
  }

  if (!Array.isArray(items)) return totals

  items.forEach((item) => {
    const type = String(item?.type || item?.utility_type || '').toLowerCase()
    const amount = toNumber(item?.amount || item?.subtotal || item?.cost || 0)

    if (type === 'electric' || type === 'electricity') totals.electricity += amount
    else if (type === 'water') totals.water += amount
    else if (type === 'thermal') totals.thermal += amount
  })

  return totals
}

function formatDisplayDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeBill(raw = {}) {
  const billingMonth =
    raw?.billing_month ||
    raw?.billingMonth ||
    raw?.month ||
    raw?.period ||
    ''

  const dueDate =
    raw?.due_date ||
    raw?.dueDate ||
    raw?.billing_end ||
    raw?.billingEnd ||
    ''

  const billingPeriod =
    raw?.billing_start && raw?.billing_end
      ? `${formatShortDate(raw.billing_start)} - ${formatShortDate(raw.billing_end)}`
      : raw?.billing_end
        ? formatShortDate(raw.billing_end)
        : formatShortDate(dueDate)

  const statusRaw = String(raw?.status || '').toLowerCase()

  const statusMap = {
    unpaid: 'published',
    pending: 'submitted',
    published: 'published',
    payment_submitted: 'submitted',
    paid: 'paid',
    overdue: 'overdue',
  }

  const breakdown =
    raw?.breakdown ||
    normalizeBreakdown(raw?.items || raw?.bill_items || [])

  const adjustments = Array.isArray(raw?.adjustments) ? raw.adjustments : []
  const pendingRefunds = adjustments
    .filter((item) => {
      const ledger = item?.ledger_entry || item?.ledgerEntry
      const refund = ledger?.metadata?.refund || {}
      return item?.status === 'applied'
        && ledger?.entry_type === 'refund'
        && ledger?.status === 'refund_pending'
        && refund?.reference_no
        && !refund?.tenant_confirmation
    })
    .map((item) => {
      const ledger = item?.ledger_entry || item?.ledgerEntry || {}
      const refund = ledger?.metadata?.refund || {}
      return {
        adjustmentId: item.id,
        ledgerId: ledger.id,
        amount: toNumber(refund.amount ?? ledger.amount ?? Math.abs(Number(item?.net_difference || 0))),
        referenceNo: refund.reference_no || '',
        method: refund.method || 'gcash',
        refundedAt: refund.refunded_at || '',
        proofImage: refund.proof_image || '',
        notes: refund.notes || '',
      }
    })

  return {
    id: raw?.id,

    tenantId:
      raw?.tenant_id ??
      raw?.tenantId ??
      raw?.tenant?.id ??
      null,

    unitId:
      raw?.unit_id ??
      raw?.unitId ??
      raw?.unit?.id ??
      null,

    unit:
      raw?.unit?.unit_number ||
      raw?.unit?.unitnumber ||
      raw?.unit?.building_name ||
      raw?.unit_name ||
      raw?.unit ||
      'N/A',

    month: billingMonth,
    dueDate: formatDisplayDate(dueDate),
    billingPeriod,
    amount: toNumber(raw?.amount ?? raw?.total_amount ?? raw?.subtotal ?? 0),
    status: statusMap[statusRaw] || statusRaw || 'published',
    adjustments,
    pendingRefunds,
    hasPendingRefundConfirmation: pendingRefunds.length > 0,
    hasAdjustment: adjustments.some((item) => item.status === 'applied'),
    hasPendingAdjustment: adjustments.some((item) => item.status === 'pending_approval'),
    breakdown: {
      electricity: toNumber(breakdown?.electricity ?? breakdown?.electric ?? 0),
      water: toNumber(breakdown?.water ?? 0),
      thermal: toNumber(breakdown?.thermal ?? 0),
    },
    raw,
  }
}

export function useBills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadBills = useCallback(async (options = {}) => {
    const { silent = false } = options

    try {
      if (!silent) {
        setLoading(true)
      }
      setError('')

      const res = await fetchTenantBills()
      const rows = Array.isArray(res?.data) ? res.data : []
      console.log('fetchTenantBills response:', res)

      setBills(rows.map(normalizeBill).filter((bill) => TENANT_VISIBLE.includes(bill.status)))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bills.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadBills()
  }, [loadBills])

  const getBillById = useCallback(async (id) => {
    const res = await fetchTenantBill(id)
    return normalizeBill(res?.data || {})
  }, [])

  const submitPaymentReceipt = useCallback(async (billId, receiptData) => {
    try {
      setSubmitting(true)
      setError('')

      await submitTenantBillPayment(billId, receiptData)
      await loadBills()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to submit payment receipt.'
      setError(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [loadBills])

  const metrics = useMemo(() => {
    const totalPaid = bills
      .filter((b) => b.status === 'paid')
      .reduce((sum, b) => sum + toNumber(b.amount), 0)

    const totalUnpaid = bills
      .filter((b) => b.status === 'published' || b.status === 'overdue')
      .reduce((sum, b) => sum + toNumber(b.amount), 0)

    const pendingCount = bills.filter((b) => b.status === 'submitted').length

    return {
      totalPaid,
      totalUnpaid,
      pendingCount,
      totalBills: bills.length,
    }
  }, [bills])

  return {
    bills,
    loading,
    submitting,
    error,
    metrics,
    refreshBills: loadBills,
    getBillById,
    submitPaymentReceipt,
  }
}



