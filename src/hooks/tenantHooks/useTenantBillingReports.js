import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getTenantBillingReports,
  submitTenantBillingReport,
  reopenTenantBillingReport,
} from '@/services/tenantBillingReportService'

function normalizeConcern(concern = {}) {
  return {
    id: concern?.id,
    billId: concern?.billId ?? concern?.bill_id ?? concern?.bill?.id ?? null,
    tenantId: concern?.tenantId ?? concern?.tenant_id ?? null,
    unitId: concern?.unitId ?? concern?.unit_id ?? null,
    unit: concern?.unit ?? concern?.bill?.unit ?? '',
    subject: concern?.subject ?? '',
    category: concern?.category ?? 'general',
    message: concern?.message ?? '',
    priority: concern?.priority ?? 'medium',
    status: concern?.status ?? 'pending',
    adminNotes: concern?.adminNotes ?? concern?.admin_notes ?? '',
    createdAt: concern?.createdAt ?? concern?.created_at ?? '',
    updatedAt: concern?.updatedAt ?? concern?.updated_at ?? '',
    bill: concern?.bill
      ? {
          id: concern.bill.id,
          billingMonth: concern.bill.billing_month ?? concern.bill.billingMonth ?? '',
          amount: Number(concern.bill.amount ?? 0),
          status: concern.bill.status ?? '',
          dueDate: concern.bill.due_date ?? concern.bill.dueDate ?? '',
        }
      : null,
  }
}

export function useTenantBillingReports() {
  const [concerns, setConcerns] = useState([])
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    active: 0,
    resolved: 0,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getTenantBillingReports()

      const normalizedConcerns = Array.isArray(response?.concerns)
        ? response.concerns.map(normalizeConcern)
        : []

      setConcerns(normalizedConcerns)
      setCounts({
        total: Number(response?.counts?.total ?? normalizedConcerns.length ?? 0),
        pending: Number(response?.counts?.pending ?? 0),
        active: Number(response?.counts?.active ?? 0),
        resolved: Number(response?.counts?.resolved ?? 0),
      })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load billing reports.'
      )
      setConcerns([])
      setCounts({
        total: 0,
        pending: 0,
        active: 0,
        resolved: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const submitConcern = useCallback(async (payload) => {
    setSubmitting(true)
    setError('')

    try {
      const created = await submitTenantBillingReport(payload)
      const normalized = normalizeConcern(created)

      setConcerns((prev) => [normalized, ...prev])
      setCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
      }))

      return normalized
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to submit billing concern.'
      setError(message)
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }, [])

  const reopenConcern = useCallback(async (id, note = '') => {
    setSubmitting(true)
    setError('')

    try {
      const updated = await reopenTenantBillingReport(id, { note })
      const normalized = normalizeConcern(updated)

      setConcerns((prev) =>
        prev.map((item) => (item.id === normalized.id ? normalized : item))
      )

      await loadReports()
      return normalized
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reopen billing concern.'
      setError(message)
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }, [loadReports])

  return useMemo(() => ({
    concerns,
    counts,
    loading,
    submitting,
    error,
    reload: loadReports,
    submitConcern,
    reopenConcern,
  }), [concerns, counts, loading, submitting, error, loadReports, submitConcern, reopenConcern])
}
