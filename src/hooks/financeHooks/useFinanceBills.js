import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteFinanceBill,
  fetchFinanceBill,
  fetchFinanceBills,
  fetchFinanceTenants,
  fetchSharedRates,
  generateFinanceBill,
  generateAllFinanceBills,
  regenerateFinanceBill,
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

  const generateAllBills = useCallback(async ({ billingMonth, regenerateExisting = false }) => {
    try {
      setSaving(true)
      setError('')
      const response = await generateAllFinanceBills({
        billing_month: billingMonth,
        regenerate_existing: regenerateExisting,
      })
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
    reload: loadData,
    createBill,
    generateAllBills,
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
