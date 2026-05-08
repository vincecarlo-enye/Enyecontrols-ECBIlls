import { unwrapPayload } from '@/utils/apiUtils'
import { useCallback, useEffect, useState } from 'react'
import { fetchFacilityConsumption } from '@/services/facilityService/facilityConsumptionService'

// Maps UI filter pill value → backend range param
function mapFilterToRange(filter) {
  if (filter === '7D') return 'daily'
  if (filter === '1D') return 'daily'
  if (filter === '1Y') return 'yearly'
  return 'monthly'
}

const EMPTY_SUMMARY = { electricity: 0, water: 0, thermal: 0 }

export function useFacilityConsumption(filters = {}) {
  const { year, month, timeRange } = filters

  const [summary, setSummary] = useState(EMPTY_SUMMARY)
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
        // Pass the raw filter too so backend can make fine-grained decisions
        time_range: timeRange,
      })
      const data = unwrapPayload(response)

      // Summary should reflect the selected period, not an all-time aggregate.
      // The backend returns per-range summary; use it directly.
      setSummary({
        electricity: Number(data?.summary?.electricity ?? 0),
        water: Number(data?.summary?.water ?? 0),
        thermal: Number(data?.summary?.thermal ?? 0),
      })
      setTrendData(Array.isArray(data?.trend_data) ? data.trend_data : [])
      setUnitConsumption(Array.isArray(data?.unit_consumption) ? data.unit_consumption : [])
      setAnomalies(Array.isArray(data?.anomalies) ? data.anomalies : [])
      setSelectedPeriod(data?.selected_period ?? null)
    } catch (err) {
      setSummary(EMPTY_SUMMARY)
      setTrendData([])
      setUnitConsumption([])
      setAnomalies([])
      setSelectedPeriod(null)
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load facility consumption.'
      )
    } finally {
      setLoading(false)
    }
  }, [month, timeRange, year]) // re-runs whenever the filter changes

  // Initial load + re-load on filter change
  useEffect(() => {
    loadConsumption()
  }, [loadConsumption])

  // Background refresh every 60 s, paused while tab is hidden
  useEffect(() => {
    const refresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      loadConsumption()
    }

    const interval = window.setInterval(refresh, 60_000)
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
