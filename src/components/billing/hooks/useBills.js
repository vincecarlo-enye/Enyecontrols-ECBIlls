import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  decorateBillWithAdjustmentState,
  fetchAllAdjustments,
} from '@/services/financeService/financeAdjustmentService'
import {
  fetchTenantBills,
  fetchTenantBill,
  submitTenantBillPayment,
} from '@/services/tenantService/tenantBillingService'
import { normalizeTenantBill, toNumber } from '@/utils/billing'

const TENANT_VISIBLE = ['published', 'submitted', 'paid', 'overdue']

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
      const loadedAdjustments = await fetchAllAdjustments()
      setBills(
        rows
          .map(normalizeTenantBill)
          .map((bill) => decorateBillWithAdjustmentState(bill, loadedAdjustments))
          .filter((bill) => TENANT_VISIBLE.includes(bill.status))
      )
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
    const normalized = normalizeTenantBill(res?.data || {})
    const loadedAdjustments = await fetchAllAdjustments()
    return decorateBillWithAdjustmentState(normalized, loadedAdjustments)
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
