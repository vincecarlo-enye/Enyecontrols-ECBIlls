import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchFacilityEquipment } from '@/services/facilityService/facilityEquipmentService'

export function useFacilityEquipment() {
  const [meters, setMeters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEquipment = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchFacilityEquipment()
      const data = Array.isArray(response?.data) ? response.data : []
      setMeters(data)
    } catch (err) {
      setMeters([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load equipment data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEquipment()
  }, [loadEquipment])

  const stats = useMemo(() => ({
    online: meters.filter((meter) => meter.status === 'online').length,
    offline: meters.filter((meter) => meter.status === 'offline').length,
    warning: meters.filter((meter) => meter.status === 'warning').length,
  }), [meters])

  return {
    meters,
    loading,
    error,
    stats,
    reload: loadEquipment,
  }
}
