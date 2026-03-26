import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchTenantBills,
  fetchTenantBill,
  submitTenantBillPayment,
} from '@/services/tenantService/tenantBillingService'

const TENANT_VISIBLE = ['published', 'payment_submitted', 'paid', 'overdue']

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

  const statusRaw = String(raw?.status || '').toLowerCase()

  const statusMap = {
    unpaid: 'published',
    pending: 'payment_submitted',
    published: 'published',
    payment_submitted: 'payment_submitted',
    paid: 'paid',
    overdue: 'overdue',
  }

  const breakdown =
    raw?.breakdown ||
    normalizeBreakdown(raw?.items || raw?.bill_items || [])

  return {
    id: raw?.id,
    unit:
      raw?.unit?.unit_number ||
      raw?.unit?.unitnumber ||
      raw?.unit_name ||
      raw?.unit ||
      'N/A',
    month: billingMonth,
    dueDate,
    amount: toNumber(raw?.amount ?? raw?.total_amount ?? raw?.subtotal ?? 0),
    status: statusMap[statusRaw] || statusRaw || 'published',
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

  const loadBills = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetchTenantBills()
      const rows = Array.isArray(res?.data) ? res.data : []

      setBills(rows.map(normalizeBill).filter((bill) => TENANT_VISIBLE.includes(bill.status)))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bills.')
    } finally {
      setLoading(false)
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

    const pendingCount = bills.filter((b) => b.status === 'payment_submitted').length

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
