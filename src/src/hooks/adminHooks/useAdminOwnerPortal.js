import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAdminOwnerPortal,
  fetchAdminOwnerPortalServiceStatus,
  getAdminOwnerPortalServiceStatusSnapshot,
  getAdminOwnerPortalSnapshot,
} from '@/services/adminService/adminOwnerPortalService'

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function normalize(response) {
  const data = response?.data || response || {}

  return {
    period: data.period || {},
    executiveSummary: data.executive_summary || {},
    operationsSummary: data.operations_summary || {},
    occupancySummary: data.occupancy_summary || {},
    financialTrend: Array.isArray(data.financial_trend) ? data.financial_trend : [],
    utilitySnapshot: Array.isArray(data.utility_snapshot) ? data.utility_snapshot : [],
    healthAlerts: Array.isArray(data.health_alerts) ? data.health_alerts : [],
    recentActivity: Array.isArray(data.recent_activity) ? data.recent_activity : [],
  }
}

function normalizeServiceStatus(response) {
  const data = response?.data || response || {}
  return data.services || {}
}

export function useAdminOwnerPortal() {
  const [month, setMonth] = useState(currentMonth)
  const initialPortalSnapshot = getAdminOwnerPortalSnapshot(currentMonth())
  const initialServiceStatusSnapshot = getAdminOwnerPortalServiceStatusSnapshot()
  const hasInitialPortalSnapshot = initialPortalSnapshot != null
  const hasInitialServiceSnapshot = initialServiceStatusSnapshot != null
  const [data, setData] = useState(() => normalize(initialPortalSnapshot))
  const [loading, setLoading] = useState(!hasInitialPortalSnapshot)
  const [error, setError] = useState('')
  const [serviceStatus, setServiceStatus] = useState(() => normalizeServiceStatus(initialServiceStatusSnapshot))
  const [serviceStatusLoading, setServiceStatusLoading] = useState(!hasInitialServiceSnapshot)
  const [serviceStatusError, setServiceStatusError] = useState('')

  const loadPortal = useCallback(async (targetMonth = month) => {
    try {
      setLoading((current) => current || !hasInitialPortalSnapshot)
      setError('')
      const response = await fetchAdminOwnerPortal(targetMonth)
      setData(normalize(response))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load owner portal snapshot.')
      setData(normalize({}))
    } finally {
      setLoading(false)
    }
  }, [hasInitialPortalSnapshot, month])

  const loadServiceStatus = useCallback(async () => {
    try {
      setServiceStatusLoading((current) => current || !hasInitialServiceSnapshot)
      setServiceStatusError('')
      const response = await fetchAdminOwnerPortalServiceStatus()
      setServiceStatus(normalizeServiceStatus(response))
    } catch (err) {
      setServiceStatusError(err?.response?.data?.message || 'Failed to load service status.')
      setServiceStatus({})
    } finally {
      setServiceStatusLoading(false)
    }
  }, [hasInitialServiceSnapshot])

  useEffect(() => {
    loadPortal(month)
  }, [loadPortal, month])

  useEffect(() => {
    loadServiceStatus()
  }, [loadServiceStatus])

  const executiveCards = useMemo(() => ([
    {
      key: 'total_billed',
      label: 'Total Billed',
      value: Number(data.executiveSummary?.total_billed || 0),
      tone: 'blue',
      helper: 'Current billing month total',
      currency: true,
    },
    {
      key: 'total_collected',
      label: 'Collected',
      value: Number(data.executiveSummary?.total_collected || 0),
      tone: 'emerald',
      helper: 'Verified collections this month',
      currency: true,
    },
    {
      key: 'collection_rate',
      label: 'Collection Rate',
      value: Number(data.executiveSummary?.collection_rate || 0),
      tone: 'violet',
      helper: 'Collected vs billed',
      suffix: '%',
    },
    {
      key: 'outstanding_balance',
      label: 'Outstanding',
      value: Number(data.executiveSummary?.outstanding_balance || 0),
      tone: 'rose',
      helper: 'Remaining collectible balance',
      currency: true,
    },
    {
      key: 'occupancy_rate',
      label: 'Occupancy Rate',
      value: Number(data.executiveSummary?.occupancy_rate || 0),
      tone: 'amber',
      helper: 'Occupied units across portfolio',
      suffix: '%',
    },
  ]), [data.executiveSummary])

  return {
    month,
    setMonth,
    data,
    serviceStatus,
    serviceStatusLoading,
    serviceStatusError,
    loading,
    error,
    executiveCards,
    reload: () => {
      loadPortal(month)
      loadServiceStatus()
    },
    reloadServiceStatus: loadServiceStatus,
  }
}
