import { useCallback, useEffect, useState } from 'react'
import { getTenantDashboard } from '@/services/tenantService/tenantDashboardService'

export default function useTenantDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
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
