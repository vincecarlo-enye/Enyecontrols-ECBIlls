import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeAdminBill } from '@/utils/billing'
import {
  applyAdjustment,
  approveAdjustment,
  createAdjustmentNotification,
  createBillAdjustment,
  decorateBillWithAdjustmentState,
  fetchAllAdjustments,
  fetchBillAdjustments,
  rejectAdjustment,
  summarizeAdjustmentMetrics,
} from '@/services/financeService/financeAdjustmentService'
import { addLocalNotification } from '@/services/notificationService'
import {
  deleteFinanceBill,
  fetchFinanceBill,
  fetchFinanceBills,
  fetchFinancePayments,
  fetchFinanceTenants,
  fetchSharedRates,
  generateFinanceBill,
  generateAllFinanceBills,
  rejectFinancePayment,
  regenerateFinanceBill,
  updateFinanceBillStatus,
  verifyFinancePayment,
} from '@/services/financeService/financeBillService'
import { addLocalActivityLog } from '@/services/activityLogService'

const ACTIONABLE_PAYMENT_STATUSES = new Set([
  'pending',
  'submitted',
  'payment_submitted',
])

function normalizePaymentStatus(status) {
  return String(status || '').trim().toLowerCase()
}

function isActionablePayment(payment) {
  return ACTIONABLE_PAYMENT_STATUSES.has(normalizePaymentStatus(payment?.status))
}

function mapLatestPayments(rows = []) {
  return rows.reduce((acc, payment) => {
    const key = String(payment?.bill_id || payment?.bill?.id || '')
    if (!key) return acc

    const current = acc[key]
    const currentIsActionable = isActionablePayment(current)
    const nextIsActionable = isActionablePayment(payment)

    if (
      !current
      || (nextIsActionable && !currentIsActionable)
      || (
        nextIsActionable === currentIsActionable
        && new Date(payment?.created_at || 0) > new Date(current?.created_at || 0)
      )
    ) {
      acc[key] = payment
    }

    return acc
  }, {})
}

function getBillId(value) {
  return String(
    value?.id
    ?? value?.bill_id
    ?? value?.raw?.id
    ?? value?.raw?.bill_id
    ?? value?.bill?.id
    ?? ''
  )
}

function matchPaymentToBill(payments = [], bill = null) {
  const billId = getBillId(bill)
  const paymentId = String(bill?.paymentId || bill?.raw?.paymentId || '')

  if (!billId && !paymentId) return null

  return payments.find((payment) => (
    isActionablePayment(payment)
    && (
      (paymentId && String(payment?.id || '') === paymentId)
      || String(payment?.bill_id || payment?.bill?.id || '') === billId
    )
  )) || null
}

function matchLatestPaymentToBill(payments = [], bill = null) {
  const billId = getBillId(bill)
  const paymentId = String(bill?.paymentId || bill?.raw?.paymentId || '')

  if (!billId && !paymentId) return null

  return payments
    .filter((payment) => (
      (paymentId && String(payment?.id || '') === paymentId)
      || String(payment?.bill_id || payment?.bill?.id || '') === billId
    ))
    .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))[0] || null
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

function formatMonthLabel(value) {
  if (!value) return ''

  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    }
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  return String(value)
}

function normalizeBreakdown(items = []) {
  const totals = {
    electricity: 0,
    water: 0,
    thermal: 0,
  }

  items.forEach((item) => {
    const type = String(item?.type || '').toLowerCase()
    const amount = Number(item?.amount ?? 0)

    if (type === 'electric' || type === 'electricity') totals.electricity += amount
    if (type === 'water') totals.water += amount
    if (type === 'thermal') totals.thermal += amount
  })

  return totals
}

function normalizeBill(row = {}) {
  const items = Array.isArray(row?.items) ? row.items : []

  return {
    id: String(row?.id ?? ''),
    tenant: row?.tenant?.name || 'Unknown Tenant',
    tenantId: row?.tenant_id ?? row?.tenant?.id ?? null,
    unit: row?.unit?.unit_number || row?.unit?.name || 'N/A',
    unitId: row?.unit_id ?? row?.unit?.id ?? null,
    month: formatMonthLabel(row?.billing_month || row?.billing_end || ''),
    billingMonth: row?.billing_month || '',
    billingPeriod:
      row?.billing_start && row?.billing_end
        ? `${formatDisplayDate(row.billing_start)} - ${formatDisplayDate(row.billing_end)}`
        : formatDisplayDate(row?.billing_end || ''),
    dueDate: formatDisplayDate(row?.due_date || ''),
    amount: Number(row?.amount ?? 0),
    status: row?.status || 'draft',
    breakdown: normalizeBreakdown(items),
    receipt: null,
    raw: row,
  }
}

function normalizeTenants(rows = []) {
  return rows.map((tenant) => ({
    id: tenant.id,
    name: tenant.name || '',
    unit: tenant?.unit?.unit_number || tenant?.unit?.name || '',
    unitId: tenant?.unit_id ?? tenant?.unit?.id ?? null,
  }))
}

function normalizeRates(rows = []) {
  const base = {
    electricity: { rate: 0, unit: '/kWh', completeness: 0 },
    water: { rate: 0, unit: '/m3', completeness: 0 },
    thermal: { rate: 0, unit: '/kBTU', completeness: 0 },
  }

  rows.forEach((rate) => {
    const type = String(rate?.type || '').toLowerCase()
    const mappedType = type === 'electric' ? 'electricity' : type

    if (!base[mappedType]) return

    base[mappedType] = {
      rate: Number(rate?.price_per_unit ?? 0),
      unit: mappedType === 'thermal' && ['kbtu/h', 'kbut/h', 'kbuth', 'kbtu', 'btu'].includes(String(rate?.unit_measure || '').toLowerCase())
        ? '/kBTU'
        : rate?.unit_measure || base[mappedType].unit,
      completeness: Number(rate?.price_per_unit ?? 0) > 0 ? 100 : 0,
    }
  })

  return base
}

export function useFinanceBills() {
  const [bills, setBills] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [selectedBillAdjustments, setSelectedBillAdjustments] = useState([])
  const [tenants, setTenants] = useState([])
  const [rates, setRates] = useState({
    electricity: { rate: 0, unit: '/kWh', completeness: 0 },
    water: { rate: 0, unit: '/m3', completeness: 0 },
    thermal: { rate: 0, unit: '/kBTU', completeness: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [referenceLoading, setReferenceLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadReferenceData = useCallback(async ({ force = false } = {}) => {
    try {
      setReferenceLoading(true)

      const [tenantsRes, ratesRes] = await Promise.all([
        fetchFinanceTenants(),
        fetchSharedRates({ force }),
      ])

      setTenants(normalizeTenants(Array.isArray(tenantsRes?.data) ? tenantsRes.data : []))
      setRates(normalizeRates(Array.isArray(ratesRes) ? ratesRes : ratesRes?.data || []))
    } catch (err) {
      setError((current) => current || err?.response?.data?.message || 'Failed to load billing reference data.')
      setTenants([])
    } finally {
      setReferenceLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [billsRes, loadedAdjustments, paymentsRes] = await Promise.all([
        fetchFinanceBills(),
        fetchAllAdjustments(),
        fetchFinancePayments(),
      ])

      const paymentMap = mapLatestPayments(Array.isArray(paymentsRes?.data) ? paymentsRes.data : [])
      const normalizedBills = (Array.isArray(billsRes?.data) ? billsRes.data : [])
        .map((bill) => normalizeAdminBill(bill, paymentMap[String(bill?.id || '')] || null))
      setAdjustments(loadedAdjustments)
      setBills(normalizedBills.map((bill) => decorateBillWithAdjustmentState(bill, loadedAdjustments)))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load billing data.')
      setBills([])
      setAdjustments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadReferenceData()
  }, [loadReferenceData])

  const notifyBillGenerated = useCallback(async ({ billData = null, billingMonth = '', batch = false } = {}) => {
    const billId = billData?.id || billData?.bill_id || null
    const monthLabel = String(billingMonth || billData?.billing_month || '').trim()

    try {
      await addLocalNotification({
        title: 'Bill generated',
        message: batch
          ? `Finance generated bills${monthLabel ? ` for ${monthLabel}` : ''}.`
          : monthLabel
            ? `Finance created a new bill${billId ? ` (#${billId})` : ''} for ${monthLabel}.`
            : `Finance created a new bill${billId ? ` (#${billId})` : ''}.`,
        target_roles: ['admin', 'super_admin', 'finance'],
        entity_type: 'bill',
        entity_id: billId,
        preferenceKey: 'billGenerated',
      })
    } catch {
      // Keep billing action successful even if notification creation fails.
    }
  }, [])

  const createBill = useCallback(async ({ tenantId, billingMonth }) => {
    try {
      setSaving(true)
      setError('')
      const response = await generateFinanceBill({
        tenant_id: tenantId,
        billing_month: billingMonth,
      })
      await notifyBillGenerated({ billData: response?.data, billingMonth })
      await loadData()
      return { success: true, data: response?.data }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to generate bill.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const regenerateBill = useCallback(async ({ tenantId, billingMonth }) => {
    try {
      setSaving(true)
      setError('')
      const response = await regenerateFinanceBill({
        tenant_id: tenantId,
        billing_month: billingMonth,
      })
      await loadData()
      return { success: true, data: response?.data }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to regenerate bill.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData, notifyBillGenerated])

  const generateAllBills = useCallback(async ({ billingMonth, regenerateExisting = false }) => {
    try {
      setSaving(true)
      setError('')
      const response = await generateAllFinanceBills({
        billing_month: billingMonth,
        regenerate_existing: regenerateExisting,
      })
      await notifyBillGenerated({ billData: null, billingMonth, batch: true })
      await loadData()
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Batch bill generation completed.',
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to generate all bills.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData, notifyBillGenerated])

  const publishBill = useCallback(async (id) => {
    try {
      setSaving(true)
      setError('')
      await updateFinanceBillStatus(id, 'published')
      await loadData()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to publish bill.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const removeBill = useCallback(async (id) => {
    try {
      setSaving(true)
      setError('')
      await deleteFinanceBill(id)
      await loadData()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete bill.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const getBillById = useCallback(async (id) => {
    const response = await fetchFinanceBill(id)
    const normalized = normalizeBill(response?.data || {})
    const history = await fetchBillAdjustments(id)
    setSelectedBillAdjustments(history)
    return decorateBillWithAdjustmentState(normalized, history)
  }, [])

  const loadPaymentReviewBill = useCallback(async (billId) => {
    const targetBill = bills.find((bill) => String(bill.id) === String(billId) || String(bill.paymentId) === String(billId))

    if (!targetBill) return null
    if (targetBill.receipt && targetBill.paymentId) return targetBill

    try {
      const paymentsData = await fetchFinancePayments()
      const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : []
      const matchedPayment = matchPaymentToBill(payments, targetBill)

      if (!matchedPayment) return targetBill

      return decorateBillWithAdjustmentState(
        normalizeAdminBill(targetBill.raw || targetBill, matchedPayment),
        adjustments
      )
    } catch {
      return targetBill
    }
  }, [adjustments, bills])

  const loadBillDetail = useCallback(async (billId) => {
    const targetBill = bills.find((bill) => String(bill.id) === String(billId) || String(bill.paymentId) === String(billId))

    if (!targetBill) return null
    if (targetBill.receipt?.receiptImage) return targetBill

    try {
      const paymentsData = await fetchFinancePayments()
      const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : []
      const matchedPayment = matchLatestPaymentToBill(payments, targetBill)

      if (!matchedPayment) return targetBill

      return decorateBillWithAdjustmentState(
        normalizeAdminBill(targetBill.raw || targetBill, matchedPayment),
        adjustments
      )
    } catch {
      return targetBill
    }
  }, [adjustments, bills])

  const resolvePendingPaymentRecord = useCallback(async (billOrPaymentId) => {
    const targetBill = bills.find((bill) => String(bill.id) === String(billOrPaymentId) || String(bill.paymentId) === String(billOrPaymentId))

    if (!targetBill) {
      try {
        const paymentsData = await fetchFinancePayments()
        const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : []
        const matchedPayment = payments.find((payment) => isActionablePayment(payment) && String(payment?.id || '') === String(billOrPaymentId))

        if (!matchedPayment) {
          return { targetBill: null, payment: null }
        }

        const matchedBill = bills.find((bill) => String(bill.id) === String(matchedPayment?.bill_id || matchedPayment?.bill?.id || '')) || null

        return {
          targetBill: matchedBill,
          payment: matchedPayment,
        }
      } catch {
        return { targetBill: null, payment: null }
      }
    }

    try {
      const paymentsData = await fetchFinancePayments()
      const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : []
      const matchedPayment = matchPaymentToBill(payments, targetBill)

      return {
        targetBill,
        payment: matchedPayment || (targetBill.paymentId ? { id: targetBill.paymentId } : null),
      }
    } catch {
      return {
        targetBill,
        payment: targetBill.paymentId ? { id: targetBill.paymentId } : null,
      }
    }
  }, [bills])

  const saveBillAdjustmentDraft = useCallback(async (bill, payload) => {
    try {
      setSaving(true)
      setError('')
      const created = await createBillAdjustment(bill, { ...payload, saveAsDraft: true })
      addLocalActivityLog({
        action: 'bill_adjustment_draft_saved',
        description: `Saved a draft bill adjustment for Bill ${bill?.id}.`,
        entity_type: 'bill_adjustment',
        entity_id: created?.id,
        method: 'POST',
        path: `/finance/billing/${bill?.id}/adjustments/draft`,
      })
      addLocalNotification(createAdjustmentNotification({
        title: `Adjustment draft saved for Bill ${bill?.id}`,
        message: `Finance saved a draft adjustment for Bill ${bill?.id}.`,
        actor: 'Finance',
        adjustmentId: created?.id,
        targetRoles: ['finance'],
      }))
      await loadData()
      return { success: true, data: created }
    } catch (err) {
      const message = err?.message || 'Failed to save adjustment draft.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const submitBillAdjustment = useCallback(async (bill, payload) => {
    try {
      setSaving(true)
      setError('')
      const submitted = await createBillAdjustment(bill, { ...payload, saveAsDraft: false })
      addLocalActivityLog({
        action: submitted?.requiresApproval ? 'bill_adjustment_submitted' : 'bill_adjustment_applied',
        description: submitted?.requiresApproval
          ? `Submitted bill adjustment for Bill ${bill?.id} requiring approval.`
          : `Applied bill adjustment for Bill ${bill?.id}.`,
        entity_type: 'bill_adjustment',
        entity_id: submitted?.id,
        method: 'PATCH',
        path: `/finance/billing/${bill?.id}/adjustments`,
      })
      addLocalNotification(createAdjustmentNotification({
        title: `Bill adjustment submitted for Bill ${bill?.id}`,
        message: submitted?.requiresApproval
          ? `Finance submitted a bill adjustment for Bill ${bill?.id}. Review is required before it takes effect.`
          : `Finance adjusted Bill ${bill?.id} and the change has been applied.`,
        actor: 'Finance',
        adjustmentId: submitted?.id,
        targetRoles: submitted?.requiresApproval ? ['admin', 'super_admin'] : ['tenant'],
        recipientTenantId: bill?.tenantId ?? submitted?.originalSnapshot?.tenantId ?? submitted?.adjustedSnapshot?.tenantId ?? null,
      }))
      try {
        await loadData()
      } catch {
        // Keep the action successful even if the follow-up refresh fails.
      }
      return { success: true, data: submitted }
    } catch (err) {
      const message = err?.message || 'Failed to submit bill adjustment.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const applyBillAdjustmentDirect = useCallback(async (bill, payload) => {
    try {
      setSaving(true)
      setError('')
      const applied = await createBillAdjustment(bill, { ...payload, saveAsDraft: false })
      addLocalActivityLog({
        action: 'bill_adjustment_applied',
        description: `Applied bill adjustment for Bill ${bill?.id}. New total: PHP ${Number(applied?.adjustedSnapshot?.grandTotal || bill?.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        entity_type: 'bill_adjustment',
        entity_id: applied?.id,
        method: 'PATCH',
        path: `/finance/billing/${bill?.id}/adjustments/${applied?.id}/apply`,
      })
      addLocalNotification(createAdjustmentNotification({
        title: 'Your bill was adjusted',
        message: `Bill ${bill?.id} was adjusted and the updated total is now visible to authorized users and the tenant.`,
        actor: 'Finance',
        adjustmentId: applied?.id,
        targetRoles: ['tenant'],
        recipientTenantId: bill?.tenantId ?? applied?.originalSnapshot?.tenantId ?? applied?.adjustedSnapshot?.tenantId ?? null,
      }))
      try {
        await loadData()
      } catch {
        // Keep the action successful even if the follow-up refresh fails.
      }
      return { success: true, data: applied }
    } catch (err) {
      const message = err?.message || 'Failed to apply bill adjustment.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const reviewAdjustmentApproval = useCallback(async (adjustmentId, action, payload = {}) => {
    try {
      setSaving(true)
      setError('')
      let result = null

      if (action === 'approve') {
        await approveAdjustment(adjustmentId, payload)
        result = await applyAdjustment(adjustmentId)
        addLocalActivityLog({
          action: 'bill_adjustment_approved',
          description: `Approved and applied bill adjustment ${adjustmentId}.`,
          entity_type: 'bill_adjustment',
          entity_id: adjustmentId,
          method: 'PATCH',
          path: `/admin/billing/adjustments/${adjustmentId}/approve`,
        })
        addLocalNotification(createAdjustmentNotification({
          title: 'Bill adjustment approved',
          message: `Adjustment ${adjustmentId} was approved and applied.`,
          actor: 'Admin',
          adjustmentId,
          targetRoles: ['finance'],
        }))
      } else if (action === 'reject') {
        result = await rejectAdjustment(adjustmentId, payload)
        addLocalActivityLog({
          action: 'bill_adjustment_rejected',
          description: `Rejected bill adjustment ${adjustmentId}.${payload?.reason ? ` Reason: ${payload.reason}` : ''}`,
          entity_type: 'bill_adjustment',
          entity_id: adjustmentId,
          method: 'PATCH',
          path: `/admin/billing/adjustments/${adjustmentId}/reject`,
        })
        addLocalNotification(createAdjustmentNotification({
          title: 'Bill adjustment rejected',
          message: `Adjustment ${adjustmentId} was rejected.${payload?.reason ? ` Reason: ${payload.reason}` : ''}`,
          actor: 'Admin',
          adjustmentId,
          targetRoles: ['finance'],
        }))
      }

      await loadData()
      return { success: true, data: result }
    } catch (err) {
      const message = err?.message || 'Failed to review adjustment request.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const approvePayment = useCallback(async (billId) => {
    try {
      setSaving(true)
      setError('')

      const { targetBill, payment } = await resolvePendingPaymentRecord(billId)
      const paymentId = payment?.id || null

      if (!paymentId) {
        return {
          success: false,
          message: 'Payment record not found for this bill.',
        }
      }

      const response = await verifyFinancePayment(paymentId)
      addLocalActivityLog({
        action: 'payment_verified',
        description: `Verified tenant payment for Bill ${targetBill?.id || billId}.`,
        entity_type: 'payment',
        entity_id: paymentId,
        method: 'POST',
        path: `/finance/payments/${paymentId}/verify`,
      })
      addLocalNotification({
        title: 'Payment approved',
        message: `Your payment for Bill ${targetBill?.id || billId} has been approved by Finance.`,
        recipient_tenant_id: targetBill?.raw?.tenant_id ?? targetBill?.tenantId ?? null,
        entity_type: 'payment',
        entity_id: paymentId,
      })
      await loadData()
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Payment approved successfully.',
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to approve payment.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData, resolvePendingPaymentRecord])

  const rejectPayment = useCallback(async (billId) => {
    try {
      setSaving(true)
      setError('')

      const { targetBill, payment } = await resolvePendingPaymentRecord(billId)
      const paymentId = payment?.id || null

      if (!paymentId) {
        return {
          success: false,
          message: 'Payment record not found for this bill.',
        }
      }

      const response = await rejectFinancePayment(paymentId, { notes: '' })
      addLocalActivityLog({
        action: 'payment_rejected',
        description: `Rejected tenant payment for Bill ${targetBill?.id || billId}.`,
        entity_type: 'payment',
        entity_id: paymentId,
        method: 'POST',
        path: `/finance/payments/${paymentId}/reject`,
      })
      addLocalNotification({
        title: 'Payment rejected',
        message: `Your payment for Bill ${targetBill?.id || billId} was rejected by Finance. Please review and resubmit your receipt.`,
        recipient_tenant_id: targetBill?.raw?.tenant_id ?? targetBill?.tenantId ?? null,
        entity_type: 'payment',
        entity_id: paymentId,
      })
      await loadData()
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Payment rejected successfully.',
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to reject payment.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadData, resolvePendingPaymentRecord])

  const draftBills = useMemo(() => bills.filter((bill) => bill.status === 'draft'), [bills])
  const publishedBills = useMemo(() => bills.filter((bill) => bill.status === 'published'), [bills])
  const submittedBills = useMemo(() => bills.filter((bill) => bill.status === 'payment_submitted'), [bills])
  const paidBills = useMemo(() => bills.filter((bill) => bill.status === 'paid'), [bills])
  const totalRevenue = useMemo(() => paidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0), [paidBills])
  const adjustmentMetrics = useMemo(() => summarizeAdjustmentMetrics(adjustments), [adjustments])

  return {
    bills,
    adjustments,
    selectedBillAdjustments,
    tenants,
    rates,
    loading,
    referenceLoading,
    saving,
    error,
    reload: loadData,
    loadReferenceData,
    createBill,
    generateAllBills,
    regenerateBill,
    publishBill,
    removeBill,
    getBillById,
    loadBillDetail,
    loadPaymentReviewBill,
    approvePayment,
    rejectPayment,
    saveBillAdjustmentDraft,
    submitBillAdjustment,
    applyBillAdjustmentDirect,
    reviewAdjustmentApproval,
    draftBills,
    publishedBills,
    submittedBills,
    paidBills,
    totalRevenue,
    adjustmentMetrics,
  }
}
