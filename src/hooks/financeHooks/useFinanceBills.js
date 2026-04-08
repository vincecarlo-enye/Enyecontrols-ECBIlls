import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteFinanceBill,
  fetchFinanceBill,
  fetchFinanceBills,
  fetchFinanceBillingAssistPreview,
  fetchFinanceTenants,
  fetchSharedRates,
  generateFinanceBill,
  generateFinanceBillsBulk,
  regenerateFinanceBill,
  syncFinanceOverdueBills,
  updateFinanceBillStatus,
} from '@/services/financeService/financeBillService'

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
    thermal: { rate: 0, unit: '/kBTU/h', completeness: 0 },
  }

  rows.forEach((rate) => {
    const type = String(rate?.type || '').toLowerCase()
    const mappedType = type === 'electric' ? 'electricity' : type

    if (!base[mappedType]) return

    base[mappedType] = {
      rate: Number(rate?.price_per_unit ?? 0),
      unit: rate?.unit_measure || base[mappedType].unit,
      completeness: Number(rate?.price_per_unit ?? 0) > 0 ? 100 : 0,
    }
  })

  return base
}

function normalizeAssistPreview(payload = {}) {
  const rows = Array.isArray(payload?.rows)
    ? payload.rows.map((row) => ({
        tenantId: Number(row?.tenant_id ?? 0),
        tenantName: row?.tenant_name || 'Unknown Tenant',
        unitLabel: row?.unit_label || 'N/A',
        status: row?.status || 'blocked_error',
        ready: Boolean(row?.ready),
        reason: row?.reason || '',
        estimatedTotal: Number(row?.estimated_total ?? 0),
        billableTotal: Number(row?.billable_total ?? 0),
        previousBalance: Number(row?.previous_balance ?? 0),
        existingBillId: row?.existing_bill_id ?? null,
        billingWindow: row?.billing_window || null,
        utilities: Array.isArray(row?.utilities) ? row.utilities : [],
      }))
    : []

  return {
    billingMonth: payload?.billing_month || '',
    locked: Boolean(payload?.locked),
    lock: payload?.lock || null,
    summary: {
      total: Number(payload?.summary?.total ?? rows.length),
      ready: Number(payload?.summary?.ready ?? rows.filter((row) => row.ready).length),
      alreadyBilled: Number(payload?.summary?.already_billed ?? rows.filter((row) => row.status === 'already_billed').length),
      blocked: Number(payload?.summary?.blocked ?? rows.filter((row) => !row.ready && row.status !== 'already_billed').length),
    },
    readyTenantIds: Array.isArray(payload?.ready_tenant_ids) ? payload.ready_tenant_ids.map((id) => Number(id)) : [],
    rows,
  }
}

export function useFinanceBills() {
  const [bills, setBills] = useState([])
  const [tenants, setTenants] = useState([])
  const [rates, setRates] = useState({
    electricity: { rate: 0, unit: '/kWh', completeness: 0 },
    water: { rate: 0, unit: '/m3', completeness: 0 },
    thermal: { rate: 0, unit: '/kBTU/h', completeness: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [assistPreview, setAssistPreview] = useState(null)
  const [assistLoading, setAssistLoading] = useState(false)
  const [overdueSyncing, setOverdueSyncing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [billsRes, tenantsRes, ratesRes] = await Promise.all([
        fetchFinanceBills(),
        fetchFinanceTenants(),
        fetchSharedRates(),
      ])

      setBills((Array.isArray(billsRes?.data) ? billsRes.data : []).map(normalizeBill))
      setTenants(normalizeTenants(Array.isArray(tenantsRes?.data) ? tenantsRes.data : []))
      setRates(normalizeRates(Array.isArray(ratesRes) ? ratesRes : ratesRes?.data || []))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load billing data.')
      setBills([])
      setTenants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const previewBillingAssist = useCallback(async ({ billingMonth, tenantIds = [] }) => {
    try {
      setAssistLoading(true)
      setError('')
      const response = await fetchFinanceBillingAssistPreview({
        billing_month: billingMonth,
        tenant_ids: tenantIds,
      })
      const normalized = normalizeAssistPreview(response?.data || {})
      setAssistPreview(normalized)
      return { success: true, data: normalized }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load billing assist preview.'
      setError(message)
      setAssistPreview(null)
      return { success: false, message }
    } finally {
      setAssistLoading(false)
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

  const generateBillsBulk = useCallback(async ({ tenantIds = [], billingMonth }) => {
    try {
      setSaving(true)
      setError('')
      const response = await generateFinanceBillsBulk({
        tenant_ids: tenantIds,
        billing_month: billingMonth,
      })
      await loadData()
      return { success: Boolean(response?.success), data: response?.data, message: response?.message }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to generate bills in bulk.'
      setError(message)
      return { success: false, message, data: err?.response?.data?.data }
    } finally {
      setSaving(false)
    }
  }, [loadData])

  const generateReadyBills = useCallback(async ({ billingMonth }) => {
    const preview = await previewBillingAssist({ billingMonth })
    if (!preview?.success) return preview

    const readyTenantIds = preview?.data?.readyTenantIds || []
    if (!readyTenantIds.length) {
      return { success: false, message: 'No bill-ready tenants found for the selected month.', data: preview.data }
    }

    const result = await generateBillsBulk({
      tenantIds: readyTenantIds,
      billingMonth,
    })

    if (result?.success) {
      await previewBillingAssist({ billingMonth })
    }

    return result
  }, [generateBillsBulk, previewBillingAssist])

  const syncOverdueBills = useCallback(async ({ asOfDate }) => {
    try {
      setOverdueSyncing(true)
      setError('')
      const response = await syncFinanceOverdueBills({ as_of_date: asOfDate })
      await loadData()
      return { success: true, data: response?.data, message: response?.message }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to sync overdue bills.'
      setError(message)
      return { success: false, message }
    } finally {
      setOverdueSyncing(false)
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
  }, [loadData])

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
    return normalizeBill(response?.data || {})
  }, [])

  const draftBills = useMemo(() => bills.filter((bill) => bill.status === 'draft'), [bills])
  const publishedBills = useMemo(() => bills.filter((bill) => bill.status === 'published'), [bills])
  const submittedBills = useMemo(() => bills.filter((bill) => bill.status === 'payment_submitted'), [bills])
  const paidBills = useMemo(() => bills.filter((bill) => bill.status === 'paid'), [bills])
  const totalRevenue = useMemo(() => paidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0), [paidBills])

  return {
    bills,
    tenants,
    rates,
    loading,
    saving,
    error,
    assistPreview,
    assistLoading,
    overdueSyncing,
    reload: loadData,
    previewBillingAssist,
    createBill,
    generateBillsBulk,
    generateReadyBills,
    syncOverdueBills,
    regenerateBill,
    publishBill,
    removeBill,
    getBillById,
    draftBills,
    publishedBills,
    submittedBills,
    paidBills,
    totalRevenue,
  }
}
