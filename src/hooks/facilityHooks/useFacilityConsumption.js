import { useCallback, useEffect, useState } from 'react'
import { fetchFacilityConsumption } from '@/services/facilityService/facilityConsumptionService'

export function useFacilityConsumption() {
  const [summary, setSummary] = useState({
    electricity: 0,
    water: 0,
    thermal: 0,
  })
  const [trendData, setTrendData] = useState([])
  const [unitConsumption, setUnitConsumption] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConsumption = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchFacilityConsumption()
      const data = response?.data || {}

      setSummary({
        electricity: Number(data?.summary?.electricity || 0),
        water: Number(data?.summary?.water || 0),
        thermal: Number(data?.summary?.thermal || 0),
      })
      setTrendData(Array.isArray(data?.trend_data) ? data.trend_data : [])
      setUnitConsumption(Array.isArray(data?.unit_consumption) ? data.unit_consumption : [])
      setAnomalies(Array.isArray(data?.anomalies) ? data.anomalies : [])
    } catch (err) {
      setSummary({ electricity: 0, water: 0, thermal: 0 })
      setTrendData([])
      setUnitConsumption([])
      setAnomalies([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load facility consumption.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConsumption()
  }, [loadConsumption])

  return {
    summary,
    trendData,
    unitConsumption,
    anomalies,
    loading,
    error,
    reload: loadConsumption,
  }
}
