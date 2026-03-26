import { useCallback, useEffect, useState } from 'react'
import { getTenantConsumptionReports } from '../../services/tenantService/tenantConsumptionService'

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function useTenantConsumptionReports() {
  const [data, setData] = useState({
    unit: null,
    summary: {
      electricity: 0,
      water: 0,
      thermal: 0,
    },
    monthly: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getTenantConsumptionReports()

      const monthly = Array.isArray(response?.monthly)
        ? response.monthly.map((row) => ({
            month: row?.month ?? '',
            electricity: toNumber(row?.electricity),
            water: toNumber(row?.water),
            thermal: toNumber(row?.thermal),
          }))
        : []

      setData({
        unit: response?.unit ?? null,
        summary: {
          electricity: toNumber(response?.summary?.electricity),
          water: toNumber(response?.summary?.water),
          thermal: toNumber(response?.summary?.thermal),
        },
        monthly,
      })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load consumption reports.'
      )
      setData({
        unit: null,
        summary: {
          electricity: 0,
          water: 0,
          thermal: 0,
        },
        monthly: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  return {
    unit: data.unit,
    summary: data.summary,
    monthly: data.monthly,
    loading,
    error,
    reload: loadReports,
  }
}