import { useCallback, useEffect, useState } from 'react'
import { getTenantDashboard, getTenantDashboardSnapshot } from '@/services/tenantService/tenantDashboardService'

export default function useTenantDashboard() {
  const initialDashboard = getTenantDashboardSnapshot()
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [loading, setLoading] = useState(!initialDashboard)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      setLoading((current) => current || !getTenantDashboardSnapshot())
      setError('')
      const data = await getTenantDashboard()
      setDashboard(data)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load dashboard.'
      )
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return {
    dashboard,
    loading,
    error,
    reload: loadDashboard,
  }
}
