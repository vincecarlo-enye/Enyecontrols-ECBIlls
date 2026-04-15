import { useCallback, useEffect, useState } from 'react'
import { fetchTenantUsageMonitoring } from '@/services/tenantService/tenantUsageService'

const EMPTY_SUMMARY = {
  electric: { previous: 0, current: 0, previous_reading: 0, current_reading: 0, consumption: 0, unit: 'kWh' },
  water: { previous: 0, current: 0, previous_reading: 0, current_reading: 0, consumption: 0, unit: 'm3' },
  thermal: { previous: 0, current: 0, previous_reading: 0, current_reading: 0, consumption: 0, unit: 'kBTU' },
}

export function useTenantUsageMonitoring() {
  const [requestedUnit, setRequestedUnit] = useState('all')
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [unit, setUnit] = useState(null)
  const [units, setUnits] = useState([])
  const [hourly, setHourly] = useState([])
  const [daily, setDaily] = useState([])
  const [monthly, setMonthly] = useState([])
  const [liveUsageAvailable, setLiveUsageAvailable] = useState(false)
  const [usageMessage, setUsageMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshUsage = useCallback(async (unitFilter = 'all', options = {}) => {
    const nextUnit = unitFilter || 'all'
    const { silent = false } = options

    try {
      if (!silent) {
        setLoading(true)
      }
      setError('')
      setRequestedUnit(nextUnit)

      const res = await fetchTenantUsageMonitoring(nextUnit)
      const data = res?.data || {}

      setSummary(data.summary || EMPTY_SUMMARY)
      setUnit(data.unit || null)
      setUnits(Array.isArray(data.units) ? data.units : [])
      setHourly(Array.isArray(data.hourly) ? data.hourly : [])
      setDaily(Array.isArray(data.daily) ? data.daily : [])
      setMonthly(Array.isArray(data.monthly) ? data.monthly : [])
      setLiveUsageAvailable(Boolean(data.live_usage_available))
      setUsageMessage(data.usage_message || '')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load usage monitoring.')
      setSummary(EMPTY_SUMMARY)
      setUnit(null)
      setUnits([])
      setHourly([])
      setDaily([])
      setMonthly([])
      setLiveUsageAvailable(false)
      setUsageMessage('')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    refreshUsage('all')
  }, [refreshUsage])

  return {
    summary,
    unit,
    units,
    hourly,
    daily,
    monthly,
    liveUsageAvailable,
    usageMessage,
    loading,
    error,
    refreshUsage,
  }
}
