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

const EMPTY_UTILITIES = {
  electric: { consumption: 0, cost: 0, unit: 'kWh' },
  water: { consumption: 0, cost: 0, unit: 'm3' },
  thermal: { consumption: 0, cost: 0, unit: 'kBTU' },
}

export function useTenantDashboardData(selectedUnit = 'all', selectedTimeRange = '1m') {
  const [rawSnapshots, setRawSnapshots] = useState(EMPTY_RAW)
  const [utilities, setUtilities] = useState(EMPTY_UTILITIES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshDashboard = useCallback(async (unit = 'all', options = {}) => {
    const { silent = false, force = false, timeRange = '1m' } = options

    try {
      if (!silent) setLoading(true)
      setError('')
      const data = await getTenantDashboard(unit, { force, timeRange })
      setRawSnapshots(data?.raw_snapshots || EMPTY_RAW)
      setUtilities(data?.utilities || data?.summary?.latest_bill_summary || EMPTY_UTILITIES)
    } catch (err) {
      setRawSnapshots(EMPTY_RAW)
      setUtilities(EMPTY_UTILITIES)
      setError(err?.response?.data?.message || 'Failed to load tenant dashboard raw meter data.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshDashboard(selectedUnit || 'all', { timeRange: selectedTimeRange || '1m' })
  }, [refreshDashboard, selectedTimeRange, selectedUnit])

  useEffect(() => {
    const refresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      refreshDashboard(selectedUnit || 'all', {
        silent: true,
        force: true,
        timeRange: selectedTimeRange || '1m',
      })
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
  }, [refreshDashboard, selectedTimeRange, selectedUnit])

  return {
    rawSnapshots,
    utilities,
    loading,
    error,
    refreshDashboard,
  }
}
