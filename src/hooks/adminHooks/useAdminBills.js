import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  fetchAdminBill,
  fetchAdminBills,
  generateAdminBill,
  regenerateAdminBill,
} from '../../services/adminService/adminBillingService'

function formatShortPeriodDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatMonthLabel(value) {
  if (!value) return '—'

  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(date)
    }
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  return value
}

function getTenantName(bill) {
  if (typeof bill?.tenant === 'string') return bill.tenant
  return bill?.tenant?.name || bill?.tenant_name || 'Unknown Tenant'
}

function getUnitName(bill) {
  if (typeof bill?.unit === 'string') return bill.unit
  return bill?.unit?.unit_number || bill?.unit?.name || bill?.unit_name || '—'
}

function getBillingStart(bill) {
  return bill?.billing_start || bill?.billingstart || bill?.period_start || bill?.periodstart || null
}

function getBillingEnd(bill) {
  return bill?.billing_end || bill?.billingend || bill?.period_end || bill?.periodend || null
}

function getBillingMonthRaw(bill) {
  return bill?.billing_month || bill?.billingmonth || bill?.month || null
}

function getBillingPeriod(bill) {
  const billingStart = getBillingStart(bill)
  const billingEnd = getBillingEnd(bill)

  if (billingStart && billingEnd) {
    return `${formatShortPeriodDate(billingStart)} - ${formatShortPeriodDate(billingEnd)}`
  }

  if (billingEnd) {
    return formatShortPeriodDate(billingEnd)
  }

  return bill?.billing_period || bill?.billingPeriod || '—'
}

function getAmountValue(bill) {
  return Number(
    bill?.grand_total ??
    bill?.grandtotal ??
    bill?.total_amount ??
    bill?.totalamount ??
    bill?.amount ??
    0
  )
}

function getDueDateValue(bill) {
  return bill?.due_date || bill?.duedate || bill?.dueDate || null
}

function normalizeBill(bill) {
  const tenant = getTenantName(bill)
  const unit = getUnitName(bill)
  const billingMonthRaw = getBillingMonthRaw(bill)
  const billingStart = getBillingStart(bill)
  const billingEnd = getBillingEnd(bill)
  const billingPeriod = getBillingPeriod(bill)
  const amount = getAmountValue(bill)
  const dueDate = getDueDateValue(bill)

  return {
    id: String(bill?.id ?? ''),
    tenant,
    unit,
    month: billingMonthRaw ? formatMonthLabel(billingMonthRaw) : billingEnd ? formatMonthLabel(billingEnd) : '—',
    billingMonth: billingMonthRaw || '—',
    billingStart,
    billingEnd,
    billingPeriod,
    amount,
    dueDate,
    status: bill?.status || 'draft',
    receipt: bill?.receipt || null,
    raw: bill,
  }
}

export function useAdminBills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)

  const loadBills = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchAdminBills()
      const list = Array.isArray(data?.data) ? data.data.map(normalizeBill) : []
      setBills(list)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bills.')
      setBills([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBills()
  }, [loadBills])

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

  const createBill = useCallback(
    async ({ tenantid, billingmonth }) => {
      try {
        const data = await generateAdminBill({
          tenantid,
          billingmonth,
        })
        await loadBills()

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
    [loadBills]
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
        await loadBills()

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
    [loadBills]
  )

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

  const approvePayment = useCallback(async (billId) => {
    return {
      success: false,
      message: `Approve payment endpoint is not connected yet for bill ${billId}.`,
    }
  }, [])

  const rejectPayment = useCallback(async (billId) => {
    return {
      success: false,
      message: `Reject payment endpoint is not connected yet for bill ${billId}.`,
    }
  }, [])

  const addToast = useCallback((message) => {
    console.log(message)
  }, [])

  return {
    bills,
    loading,
    error,
    selectedBill,
    setSelectedBill,
    loadBills,
    loadBillDetail,
    createBill,
    regenerateBill,
    approvePayment,
    rejectPayment,
    addToast,
    paidBills,
    publishedBills,
    submittedBills,
    draftBills,
    overdueBills,
    totalRevenue,
  }
}
