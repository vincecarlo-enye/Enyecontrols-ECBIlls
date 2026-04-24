import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  decorateBillWithAdjustmentState,
  fetchAllAdjustments,
  summarizeAdjustmentMetrics,
} from '@/services/financeService/financeAdjustmentService'
import { normalizeAdminBill } from '@/utils/billing'
import { useApp } from '@/context/AppContext'
import { addLocalNotification } from '@/services/notificationService'
import {
  deleteAdminBill,
  fetchAdminBill,
  fetchAdminBills,
  fetchAdminPayments,
  getAdminBillsSnapshot,
  getAdminPaymentsSnapshot,
  generateAdminBill,
  rejectAdminPayment,
  regenerateAdminBill,
  verifyAdminPayment,
} from '../../services/adminService/adminBillingService'

const DEFAULT_PER_PAGE = 10
const DEFAULT_META = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
}

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

export function useAdminBills(options = {}) {
  const { loadAdjustmentsOnInit = true } = options
  const { addToast } = useApp()
  const initialBillsSnapshot = getAdminBillsSnapshot({
    page: 1,
    per_page: DEFAULT_PER_PAGE,
  })
  const initialPaymentsSnapshot = getAdminPaymentsSnapshot()
  const initialRawBills = Array.isArray(initialBillsSnapshot?.data) ? initialBillsSnapshot.data : []
  const initialPaymentMap = mapLatestPayments(Array.isArray(initialPaymentsSnapshot?.data) ? initialPaymentsSnapshot.data : [])
  const initialBills = initialRawBills.length > 0
    ? initialRawBills.map((bill) => normalizeAdminBill(bill, initialPaymentMap[String(bill?.id || '')] || null))
    : []
  const [bills, setBills] = useState(initialBills)
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(initialBills.length === 0)
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(loadAdjustmentsOnInit)
  const [error, setError] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [meta, setMeta] = useState(initialBillsSnapshot?.meta || DEFAULT_META)
  const adjustmentsRef = useRef([])

  useEffect(() => {
    adjustmentsRef.current = adjustments
  }, [adjustments])

  const hydrateAdjustments = useCallback(async () => {
    try {
      setAdjustmentsLoading(true)
      const loadedAdjustments = await fetchAllAdjustments()
      setAdjustments(loadedAdjustments)
      setBills((currentBills) =>
        currentBills.map((bill) => decorateBillWithAdjustmentState(bill, loadedAdjustments))
      )
      return loadedAdjustments
    } catch {
      setAdjustments([])
      return []
    } finally {
      setAdjustmentsLoading(false)
    }
  }, [])

  const loadBills = useCallback(async (nextPage = page, nextPerPage = perPage) => {
    setLoading(true)
    setError('')

    try {
      const [data, paymentsData] = await Promise.all([
        fetchAdminBills({
          page: nextPage,
          per_page: nextPerPage,
        }),
        fetchAdminPayments(),
      ])
      const rawBills = Array.isArray(data?.data) ? data.data : []
      const paymentMap = mapLatestPayments(Array.isArray(paymentsData?.data) ? paymentsData.data : [])
      const list = rawBills.length > 0
        ? rawBills.map((bill) => normalizeAdminBill(bill, paymentMap[String(bill?.id || '')] || null))
        : []
      const decoratedBills = adjustmentsRef.current.length > 0
        ? list.map((bill) => decorateBillWithAdjustmentState(bill, adjustmentsRef.current))
        : list
      setBills(decoratedBills)
      setMeta(data?.meta || {
        ...DEFAULT_META,
        current_page: nextPage,
        per_page: nextPerPage,
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bills.')
      setBills([])
      setMeta(DEFAULT_META)
    } finally {
      setLoading(false)
    }
  }, [page, perPage])

  useEffect(() => {
    loadBills(page, perPage)
  }, [loadBills, page, perPage])

  useEffect(() => {
    if (!loadAdjustmentsOnInit) {
      setAdjustmentsLoading(false)
      return
    }

    hydrateAdjustments()
  }, [hydrateAdjustments, loadAdjustmentsOnInit])

  const ensureAdjustmentsLoaded = useCallback(async () => {
    if (adjustments.length > 0 || adjustmentsLoading) {
      return adjustments
    }

    return hydrateAdjustments()
  }, [adjustments, adjustmentsLoading, hydrateAdjustments])

  const loadBillDetail = useCallback(async (id) => {
    try {
      const data = await fetchAdminBill(id)
      const fullBill = data?.data || null
      setSelectedBill(fullBill)
      return fullBill
    } catch (err) {
      return null
    }
  }, [])

  const loadPaymentReviewBill = useCallback(async (billId) => {
    const targetBill = bills.find((bill) => String(bill.id) === String(billId) || String(bill.paymentId) === String(billId))

    if (!targetBill) return null
    if (targetBill.receipt && targetBill.paymentId) return targetBill

    try {
      const paymentsData = await fetchAdminPayments()
      const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : []
      const matchedPayment = matchPaymentToBill(payments, targetBill)

      if (!matchedPayment) return targetBill

      return normalizeAdminBill(targetBill.raw || targetBill, matchedPayment)
    } catch {
      return targetBill
    }
  }, [bills])

  const resolvePendingPaymentRecord = useCallback(async (billOrPaymentId) => {
    const targetBill = bills.find((bill) => String(bill.id) === String(billOrPaymentId) || String(bill.paymentId) === String(billOrPaymentId))

    if (!targetBill) {
      try {
        const paymentsData = await fetchAdminPayments()
        const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : []
        const matchedPayment = payments.find((payment) => isActionablePayment(payment) && String(payment?.id || '') === String(billOrPaymentId))

        if (!matchedPayment) {
          return {
            targetBill: null,
            payment: null,
          }
        }

        const matchedBill = bills.find((bill) => String(bill.id) === String(matchedPayment?.bill_id || matchedPayment?.bill?.id || '')) || null

        return {
          targetBill: matchedBill,
          payment: matchedPayment,
        }
      } catch {
        return {
          targetBill: null,
          payment: null,
        }
      }
    }

    try {
      const paymentsData = await fetchAdminPayments()
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

  const notifyBillGenerated = useCallback(async (billData, billingMonth) => {
    const billId = billData?.id || billData?.bill_id || null
    const monthLabel = String(billingMonth || billData?.billing_month || '').trim()

    try {
      await addLocalNotification({
        title: 'Bill generated',
        message: monthLabel
          ? `A new bill${billId ? ` (#${billId})` : ''} was created for ${monthLabel}.`
          : `A new bill${billId ? ` (#${billId})` : ''} was created.`,
        target_roles: ['admin', 'super_admin', 'finance'],
        entity_type: 'bill',
        entity_id: billId,
        preferenceKey: 'billGenerated',
      })
    } catch {
      // Keep bill generation successful even if notification creation fails.
    }
  }, [])

  const createBill = useCallback(
    async ({ tenantid, billingmonth }) => {
      try {
        const data = await generateAdminBill({
          tenantid,
          billingmonth,
        })
        await notifyBillGenerated(data?.data, billingmonth)
        setPage(1)
        await loadBills(1, perPage)

        return {
          success: true,
          data: data?.data,
          message: data?.message || 'Bill generated successfully.',
        }
      } catch (err) {
        return {
          success: false,
          message: err?.response?.data?.message || 'Failed to generate bill.',
          errors: err?.response?.data?.errors || null,
        }
      }
    },
    [loadBills, notifyBillGenerated, perPage]
  )

  const regenerateBill = useCallback(
    async ({ tenant_id, billing_month, billingstart, billingend, billingmonth, ...rest }) => {
      try {
        const payload = {
          tenant_id,
          billing_month: billing_month || billingmonth || null,
          billingstart: billingstart || null,
          billingend: billingend || null,
          ...rest,
        }

        const data = await regenerateAdminBill(payload)
        await loadBills(page, perPage)

        return {
          success: true,
          data: data?.data,
          message: data?.message || 'Bill regenerated successfully.',
        }
      } catch (err) {
        return {
          success: false,
          message: err?.response?.data?.message || 'Failed to regenerate bill.',
          errors: err?.response?.data?.errors || null,
        }
      }
    },
    [loadBills, page, perPage]
  )

  const deleteBill = useCallback(async (id) => {
    try {
      await deleteAdminBill(id)
      await loadBills(page, perPage)
      return {
        success: true,
        message: 'Bill deleted successfully.',
      }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to delete bill.',
      }
    }
  }, [loadBills, page, perPage])

  const paidBills = useMemo(
    () => bills.filter((bill) => bill.status === 'paid'),
    [bills]
  )

  const publishedBills = useMemo(
    () => bills.filter((bill) => bill.status === 'published'),
    [bills]
  )

  const submittedBills = useMemo(
    () => bills.filter((bill) => bill.status === 'payment_submitted'),
    [bills]
  )

  const draftBills = useMemo(
    () => bills.filter((bill) => bill.status === 'draft'),
    [bills]
  )

  const overdueBills = useMemo(
    () => bills.filter((bill) => bill.status === 'overdue'),
    [bills]
  )

  const totalRevenue = useMemo(
    () => paidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [paidBills]
  )
  const adjustmentMetrics = useMemo(
    () => summarizeAdjustmentMetrics(adjustments),
    [adjustments]
  )

  const notifyTenantPaymentUpdate = useCallback(async (bill, outcome) => {
    const tenant = bill?.raw?.tenant
    const tenantName = bill?.tenant || tenant?.name || 'Tenant'
    const dueAmount = Number(bill?.amount || 0).toLocaleString()
    const title = outcome === 'approved' ? 'Payment approved' : 'Payment rejected'
    const message = outcome === 'approved'
      ? `Your payment for bill ${bill?.id} (${tenantName}) worth PHP ${dueAmount} has been verified.`
      : `Your payment for bill ${bill?.id} (${tenantName}) worth PHP ${dueAmount} was rejected. Please review and resubmit your receipt.`

    try {
      await addLocalNotification({
        title,
        message,
        recipient_tenant_id: bill?.raw?.tenant_id ?? tenant?.id ?? null,
        recipient_user_id: tenant?.user_id ?? tenant?.userId ?? null,
        entity_type: 'payment',
        entity_id: bill?.paymentId || bill?.id || null,
      })
    } catch {
      // Keep billing action successful even if notification creation fails.
    }
  }, [])

  const approvePayment = useCallback(async (billId) => {
    try {
      const { targetBill, payment } = await resolvePendingPaymentRecord(billId)
      const paymentId = payment?.id || null

      if (!paymentId) {
        addToast('Payment record not found for this bill.', 'error')
        return {
          success: false,
          message: 'Payment record not found for this bill.',
        }
      }

        const response = await verifyAdminPayment(paymentId)
      await notifyTenantPaymentUpdate(targetBill, 'approved')
      await ensureAdjustmentsLoaded()
      await loadBills(page, perPage)
      addToast(response?.message || 'Payment approved successfully.', 'success')
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Payment approved successfully.',
      }
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to approve payment.', 'error')
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to approve payment.',
      }
    }
  }, [addToast, loadBills, notifyTenantPaymentUpdate, page, perPage, resolvePendingPaymentRecord])

  const rejectPayment = useCallback(async (billId) => {
    try {
      const { targetBill, payment } = await resolvePendingPaymentRecord(billId)
      const paymentId = payment?.id || null

      if (!paymentId) {
        addToast('Payment record not found for this bill.', 'error')
        return {
          success: false,
          message: 'Payment record not found for this bill.',
        }
      }

      const response = await rejectAdminPayment(paymentId)
      await notifyTenantPaymentUpdate(targetBill, 'rejected')
      await ensureAdjustmentsLoaded()
      await loadBills(page, perPage)
      addToast(response?.message || 'Payment rejected successfully.', 'error')
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Payment rejected successfully.',
      }
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to reject payment.', 'error')
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to reject payment.',
      }
    }
  }, [addToast, loadBills, notifyTenantPaymentUpdate, page, perPage, resolvePendingPaymentRecord])

  return {
    bills,
    loading,
    error,
    selectedBill,
    setSelectedBill,
    meta,
    page,
    perPage,
    setPage,
    setPerPage,
    loadBills,
    loadBillDetail,
    loadPaymentReviewBill,
    createBill,
    regenerateBill,
    deleteBill,
    approvePayment,
    rejectPayment,
    addToast,
    paidBills,
    publishedBills,
    submittedBills,
    draftBills,
    overdueBills,
    totalRevenue,
    adjustments,
    adjustmentsLoading,
    adjustmentMetrics,
    ensureAdjustmentsLoaded,
  }
}
