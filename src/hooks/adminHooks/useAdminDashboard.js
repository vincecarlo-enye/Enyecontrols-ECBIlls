import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminUnits } from '../../services/adminService/adminUnitService'
import { fetchAdminTenants } from '../../services/adminService/adminTenantService'
import { fetchAdminBills } from '../../services/adminService/adminBillingService'
import { fetchAdminBillingConcerns } from '../../services/adminService/adminBillingConcernService'

export function useAdminDashboard() {
  const [units, setUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [bills, setBills] = useState([])
  const [concerns, setConcerns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async (options = {}) => {
    const { silent = false } = options

    try {
      if (!silent) {
        setLoading(true)
      }
      setError('')

      const [unitsRes, tenantsRes, billsRes, concernsRes] = await Promise.all([
        fetchAdminUnits(),
        fetchAdminTenants(),
        fetchAdminBills(),
        fetchAdminBillingConcerns(),
      ])

      setUnits(Array.isArray(unitsRes?.data) ? unitsRes.data : [])
      setTenants(Array.isArray(tenantsRes?.data) ? tenantsRes.data : [])
      setBills(Array.isArray(billsRes?.data) ? billsRes.data : [])
      setConcerns(Array.isArray(concernsRes?.data) ? concernsRes.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const metrics = useMemo(() => {
    const totalRevenue = bills
      .filter((b) => String(b.status).toLowerCase() === 'paid')
      .reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)

    const unpaidBills = bills.filter((b) =>
      ['published', 'overdue', 'unpaid', 'pending'].includes(String(b.status).toLowerCase())
    ).length

    const activeTenants = tenants.filter(
      (t) => String(t.status).toLowerCase() === 'active'
    ).length

    const occupiedUnits = units.filter(
      (u) => String(u.status).toLowerCase() === 'occupied'
    ).length

    const pendingConcerns = concerns.filter((c) =>
      ['pending', 'assigned', 'in_review'].includes(String(c.status).toLowerCase())
    ).length

    return {
      totalRevenue,
      unpaidBills,
      activeTenants,
      totalUnits: units.length,
      occupiedUnits,
      pendingConcerns,
    }
  }, [units, tenants, bills, concerns])

  return {
    units,
    tenants,
    bills,
    concerns,
    loading,
    error,
    metrics,
    refreshDashboard: loadDashboard,
  }
}
