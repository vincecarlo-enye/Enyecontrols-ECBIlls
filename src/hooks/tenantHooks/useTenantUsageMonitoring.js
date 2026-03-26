import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTenantUsageMonitoring } from '../../services/tenantService/tenantUsageService'

function normalizeUtilityCard(raw = {}, fallbackUnit = '') {
  return {
    previous: Number(raw?.previous_reading ?? 0),
    current: Number(raw?.current_reading ?? 0),
    consumption: Number(raw?.consumption ?? 0),
    unit: raw?.unit ?? fallbackUnit,
  }
}

export function useTenantUsageMonitoring() {
  const [data, setData] = useState({
    summary: {
      electric: {},
      water: {},
      thermal: {},
    },
    hourly: [],
    daily: [],
    monthly: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetchTenantUsageMonitoring()
      setData(res?.data ?? {})
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load usage monitoring.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsage()
  }, [loadUsage])

  const summary = useMemo(() => ({
    electric: normalizeUtilityCard(data?.summary?.electric, 'kWh'),
    water: normalizeUtilityCard(data?.summary?.water, 'm³'),
    thermal: normalizeUtilityCard(data?.summary?.thermal, 'kBTU'),
  }), [data])

  return {
    summary,
    hourly: data?.hourly ?? [],
    daily: data?.daily ?? [],
    monthly: data?.monthly ?? [],
    loading,
    error,
    refreshUsage: loadUsage,
  }
}
