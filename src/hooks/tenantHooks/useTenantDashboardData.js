import { useCallback, useEffect, useState } from 'react'
import { getTenantDashboard } from '@/services/tenantService/tenantDashboardService'

const EMPTY_RAW = {
  available: false,
  message: '',
  current: {
    electric: { meter_name: null, page_name: null, watch_name: null, reading_value: 0, unit: 'kWh', captured_at: null },
    water: { meter_name: null, page_name: null, watch_name: null, reading_value: 0, unit: 'm3', captured_at: null },
    thermal: { meter_name: null, page_name: null, watch_name: null, reading_value: 0, unit: 'kBTU', captured_at: null },
  },
  history: [],
}

export function useTenantDashboardData(selectedUnit = 'all') {
  const [rawSnapshots, setRawSnapshots] = useState(EMPTY_RAW)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshDashboard = useCallback(async (unit = 'all', options = {}) => {
    const { silent = false } = options

    try {
      if (!silent) {
        setLoading(true)
      }
      setError('')
      const data = await getTenantDashboard(unit)
      setRawSnapshots(data?.raw_snapshots || EMPTY_RAW)
    } catch (err) {
      setRawSnapshots(EMPTY_RAW)
      setError(err?.response?.data?.message || 'Failed to load tenant dashboard raw meter data.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    refreshDashboard(selectedUnit || 'all')
  }, [refreshDashboard, selectedUnit])

  return {
    rawSnapshots,
    loading,
    error,
    refreshDashboard,
  }
}
