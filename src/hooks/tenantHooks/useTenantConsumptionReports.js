import { useCallback, useEffect, useState } from 'react'
import { getTenantConsumptionReports } from '@/services/tenantService/tenantConsumptionService'

const EMPTY_SUMMARY = {
  electricity: 0,
  water: 0,
  thermal: 0,
}

export function useTenantConsumptionReports() {
  const [requestedUnit, setRequestedUnit] = useState('all')
  const [unit, setUnit] = useState(null)
  const [units, setUnits] = useState([])
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [monthly, setMonthly] = useState([])
  const [liveUsageAvailable, setLiveUsageAvailable] = useState(false)
  const [usageMessage, setUsageMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async (unitFilter = 'all') => {
    const nextUnit = unitFilter || 'all'

    try {
      setLoading(true)
      setError('')
      setRequestedUnit(nextUnit)

      const data = await getTenantConsumptionReports(nextUnit)
      setUnit(data.unit || null)
      setUnits(Array.isArray(data.units) ? data.units : [])
      setSummary(data.summary || EMPTY_SUMMARY)
      setMonthly(Array.isArray(data.monthly) ? data.monthly : [])
      setLiveUsageAvailable(Boolean(data.live_usage_available))
      setUsageMessage(data.usage_message || '')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load consumption reports.')
      setUnit(null)
      setUnits([])
      setSummary(EMPTY_SUMMARY)
      setMonthly([])
      setLiveUsageAvailable(false)
      setUsageMessage('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload('all')
  }, [reload])

  return {
    unit,
    units,
    summary,
    monthly,
    liveUsageAvailable,
    usageMessage,
    loading,
    error,
    reload,
  }
}
