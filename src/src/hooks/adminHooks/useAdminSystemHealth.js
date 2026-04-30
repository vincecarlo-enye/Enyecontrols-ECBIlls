import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminSystemHealth } from '@/services/adminService/adminSystemHealthService'

function normalize(response) {
  const data = response?.data || response || {}

  return {
    generatedAt: data.generated_at || null,
    services: data.services || {},
    summary: data.summary || {},
    freshness: data.freshness || { page_health: [] },
    alerts: Array.isArray(data.alerts) ? data.alerts : [],
  }
}

export function useAdminSystemHealth() {
  const [data, setData] = useState({
    generatedAt: null,
    services: {},
    summary: {},
    freshness: { page_health: [] },
    alerts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHealth = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetchAdminSystemHealth()
      setData(normalize(response))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load system health.')
      setData({
        generatedAt: null,
        services: {},
        summary: {},
        freshness: { page_health: [] },
        alerts: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHealth()
  }, [loadHealth])

  const summaryCards = useMemo(() => ([
    {
      key: 'pending_readings',
      label: 'Pending Readings',
      value: Number(data.summary?.pending_readings || 0),
      tone: 'amber',
      sub: 'Facility approval queue',
    },
    {
      key: 'payment_queue',
      label: 'Payment Queue',
      value: Number(data.summary?.payment_queue || 0),
      tone: 'blue',
      sub: 'Finance verification backlog',
    },
    {
      key: 'open_disputes',
      label: 'Open Disputes',
      value: Number(data.summary?.open_disputes || 0),
      tone: 'violet',
      sub: 'Billing concerns still active',
    },
    {
      key: 'overdue_bills',
      label: 'Overdue Bills',
      value: Number(data.summary?.overdue_bills || 0),
      tone: 'rose',
      sub: 'Collections requiring follow-up',
    },
    {
      key: 'stale_pages_count',
      label: 'Stale Omni Pages',
      value: Number(data.freshness?.stale_pages_count || 0),
      tone: 'slate',
      sub: 'Pages without fresh data in 24h',
    },
  ]), [data.summary, data.freshness])

  return {
    data,
    loading,
    error,
    summaryCards,
    reload: loadHealth,
  }
}
