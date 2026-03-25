import { useCallback, useEffect, useState } from 'react'
import { fetchAdminMeters } from '../../services/adminService/adminMeterService'



export function useAdminMeters() {
  const [meters, setMeters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMeters = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetchAdminMeters()
      setMeters(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load meters.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMeters()
  }, [loadMeters])

  return {
    meters,
    loading,
    error,
    loadMeters,
  }
}
