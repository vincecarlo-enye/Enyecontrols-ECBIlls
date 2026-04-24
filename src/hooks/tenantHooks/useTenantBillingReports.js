import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getTenantBillingReports,
  submitTenantBillingReport,
  reopenTenantBillingReport,
} from '@/services/tenantService/tenantBillingReportService'

function formatTimelineDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function buildTimeline(concern = {}, tenant = null) {
  if (Array.isArray(concern?.timeline) && concern.timeline.length > 0) {
    return concern.timeline
  }

  const createdAt = concern?.createdAt ?? concern?.created_at ?? ''
  const updatedAt = concern?.updatedAt ?? concern?.updated_at ?? ''
  const adminNotes = concern?.adminNotes ?? concern?.admin_notes ?? ''
  const financeNotes = concern?.financeNotes ?? concern?.finance_notes ?? ''
  const tenantName =
    concern?.tenantName ??
    concern?.tenant_name ??
    tenant?.name ??
    tenant?.full_name ??
    'Tenant'

  const timeline = []

  if (createdAt) {
    timeline.push({
      id: `${concern?.id ?? 'concern'}-submitted`,
      action: 'Ticket submitted',
      by: tenantName,
      role: 'tenant',
      date: formatTimelineDate(createdAt),
      note: concern?.message ?? '',
    })
  }

  if (adminNotes) {
    timeline.push({
      id: `${concern?.id ?? 'concern'}-admin`,
      action: 'Admin update added',
      by: 'Admin',
      role: 'admin',
      date: formatTimelineDate(updatedAt || createdAt),
      note: adminNotes,
    })
  }

  if (financeNotes) {
    timeline.push({
      id: `${concern?.id ?? 'concern'}-finance`,
      action: 'Finance update added',
      by: 'Finance',
      role: 'finance',
      date: formatTimelineDate(updatedAt || createdAt),
      note: financeNotes,
    })
  }

  if (
    concern?.status &&
    !['pending'].includes(String(concern.status).toLowerCase())
  ) {
    timeline.push({
      id: `${concern?.id ?? 'concern'}-status`,
      action: `Status changed to ${String(concern.status).replace(/_/g, ' ')}`,
      by: 'System',
      role: concern?.assignedTo ? 'finance' : 'admin',
      date: formatTimelineDate(updatedAt || createdAt),
      note: '',
    })
  }

  return timeline
}

function normalizeConcern(concern = {}) {
  const tenant =
    concern?.tenant ??
    concern?.user ??
    concern?.bill?.tenant ??
    concern?.bill?.user ??
    null

  const tenantUnit =
    concern?.unit ??
    concern?.bill?.unit ??
    tenant?.unit?.unit_number ??
    tenant?.unit?.name ??
    tenant?.unit ??
    ''

  return {
    id: concern?.id,
    billId: concern?.billId ?? concern?.bill_id ?? concern?.bill?.id ?? null,
    tenantId: concern?.tenantId ?? concern?.tenant_id ?? null,
    unitId: concern?.unitId ?? concern?.unit_id ?? null,
    unit: tenantUnit,
    tenantName:
      concern?.tenantName ??
      concern?.tenant_name ??
      tenant?.name ??
      tenant?.full_name ??
      '',
    email:
      concern?.email ??
      concern?.tenantEmail ??
      concern?.tenant_email ??
      tenant?.email ??
      '',
    company:
      concern?.company ??
      concern?.company_name ??
      tenant?.company ??
      tenant?.company_name ??
      '',
    subject: concern?.subject ?? '',
    category: concern?.category ?? 'general',
    message: concern?.message ?? '',
    priority: concern?.priority ?? 'medium',
    status: concern?.status ?? 'pending',
    adminNotes: concern?.adminNotes ?? concern?.admin_notes ?? '',
    financeNotes: concern?.financeNotes ?? concern?.finance_notes ?? '',
    createdAt: concern?.createdAt ?? concern?.created_at ?? '',
    updatedAt: concern?.updatedAt ?? concern?.updated_at ?? '',
    dateSubmitted:
      concern?.dateSubmitted ??
      concern?.date_submitted ??
      concern?.createdAt ??
      concern?.created_at ??
      '',
    dateUpdated:
      concern?.dateUpdated ??
      concern?.date_updated ??
      concern?.updatedAt ??
      concern?.updated_at ??
      '',
    assignedTo:
      concern?.assignedTo ??
      concern?.assigned_to ??
      concern?.assignee?.role ??
      concern?.assignee?.name ??
      null,
    timeline: buildTimeline(concern, tenant),
    tenant: tenant
      ? {
          id: tenant?.id ?? null,
          name: tenant?.name ?? tenant?.full_name ?? '',
          email: tenant?.email ?? '',
          company: tenant?.company ?? tenant?.company_name ?? '',
          unit:
            tenant?.unit?.unit_number ??
            tenant?.unit?.name ??
            tenant?.unit ??
            tenantUnit,
        }
      : null,
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

export default function useTenantBillingReports() {
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
        ? response.concerns.map((concern) => normalizeConcern(concern))
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
