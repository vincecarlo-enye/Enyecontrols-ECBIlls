import { unwrapPayload } from '@/utils/apiUtils'
import { useCallback, useEffect, useState } from 'react'
import { fetchFacilityConsumption } from '@/services/facilityService/facilityConsumptionService'


/**
 * Maps the UI filter key ('1D' | '1M' | '1Y') to an API-friendly range string.
 * The backend receives 'daily', 'monthly', or 'yearly'.
 */
function mapFilterToRange(filter) {
  if (filter === '1D') return 'daily'
  if (filter === '1Y') return 'yearly'
  return 'monthly'
}

export function useFacilityConsumption(filters = {}) {
  const { year, month, timeRange } = filters
  const [summary, setSummary] = useState({
    electricity: 0,
    water: 0,
    thermal: 0,
  })
  const [trendData, setTrendData] = useState([])
  const [unitConsumption, setUnitConsumption] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConsumption = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchFacilityConsumption({
        year,
        month,
        range: mapFilterToRange(timeRange),
      })
      const data = unwrapPayload(response)

      setSummary({
        electricity: Number(data?.summary?.electricity || 0),
        water: Number(data?.summary?.water || 0),
        thermal: Number(data?.summary?.thermal || 0),
      })
      setTrendData(Array.isArray(data?.trend_data) ? data.trend_data : [])
      setUnitConsumption(Array.isArray(data?.unit_consumption) ? data.unit_consumption : [])
      setAnomalies(Array.isArray(data?.anomalies) ? data.anomalies : [])
      setSelectedPeriod(data?.selected_period || null)
    } catch (err) {
      setSummary({ electricity: 0, water: 0, thermal: 0 })
      setTrendData([])
      setUnitConsumption([])
      setAnomalies([])
      setSelectedPeriod(null)
      setError(err?.response?.data?.message || err?.message || 'Failed to load facility consumption.')
    } finally {
      setLoading(false)
    }
  }, [month, timeRange, year])

  useEffect(() => {
    loadConsumption()
  }, [loadConsumption])

  useEffect(() => {
    const refresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      loadConsumption()
    }

    const interval = window.setInterval(refresh, 60000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadConsumption])

  return {
    summary,
    trendData,
    unitConsumption,
    anomalies,
    selectedPeriod,
    loading,
    error,
    reload: loadConsumption,
  }
}
