import { useEffect, useMemo, useState, useCallback } from 'react'
import { fetchAdminBill, fetchAdminBills, generateAdminBill, regenerateAdminBill } from '../../services/adminService/adminBillingService'


function mapBill(bill) {
  const tenantName = bill.tenant?.name || 'Unknown Tenant'
  const unitName = bill.unit?.unit_number || bill.unit?.name || '—'
  const amount =
    Number(bill.total_amount ?? bill.amount ?? 0)

  return {
    id: String(bill.id),
    tenant: tenantName,
    unit: unitName,
    month: bill.billing_month || bill.month || '—',
    amount,
    dueDate: bill.due_date || '—',
    status: bill.status || 'draft',
    receipt: bill.receipt || null,
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
      const list = Array.isArray(data?.data) ? data.data.map(mapBill) : []
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
      setSelectedBill(data?.data || null)
      return data?.data || null
    } catch (err) {
      return null
    }
  }, [])

  const createBill = useCallback(async ({ tenant_id, billing_month }) => {
    try {
      const data = await generateAdminBill({ tenant_id, billing_month })
      await loadBills()
      return { success: true, data: data?.data }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to generate bill.',
      }
    }
  }, [loadBills])

  const regenerateBill = useCallback(async ({ tenant_id, billing_month }) => {
    try {
      const data = await regenerateAdminBill({ tenant_id, billing_month })
      await loadBills()
      return { success: true, data: data?.data }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to regenerate bill.',
      }
    }
  }, [loadBills])

  const paidBills = useMemo(
    () => bills.filter((b) => b.status === 'paid'),
    [bills]
  )

  const publishedBills = useMemo(
    () => bills.filter((b) => b.status === 'published'),
    [bills]
  )

  const submittedBills = useMemo(
    () => bills.filter((b) => b.status === 'payment_submitted'),
    [bills]
  )

  const draftBills = useMemo(
    () => bills.filter((b) => b.status === 'draft'),
    [bills]
  )

  const overdueBills = useMemo(
    () => bills.filter((b) => b.status === 'overdue'),
    [bills]
  )

  const totalRevenue = useMemo(
    () => paidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [paidBills]
  )

  const approvePayment = async (billId) => {
    return {
      success: false,
      message: 'Approve payment endpoint is not connected yet.',
    }
  }

  const rejectPayment = async (billId) => {
    return {
      success: false,
      message: 'Reject payment endpoint is not connected yet.',
    }
  }

  const addToast = (message) => {
    console.log(message)
  }

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
