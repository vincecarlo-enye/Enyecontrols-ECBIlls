import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approveFacilityReading,
  bulkApproveFacilityReadings,
  bulkRejectFacilityReadings,
  fetchFacilityMonitoring,
  rejectFacilityReading,
} from '@/services/facilityService/facilityMonitoringService'
import { DASHBOARD_READ_REFRESH_MS } from '@/constants/liveData'

const EMPTY_ANOMALY = {
  title: 'No anomaly detected',
  message: 'No recent floor usage data is available yet.',
  severity: 'normal',
}

export function useFacilityMonitoring() {
  const [liveData, setLiveData] = useState([])
  const [currentLoad, setCurrentLoad] = useState(0)
  const [previousLoad, setPreviousLoad] = useState(0)
  const [floorData, setFloorData] = useState([])
  const [anomaly, setAnomaly] = useState(EMPTY_ANOMALY)
  const [pendingReadings, setPendingReadings] = useState([])
  const [actualReadings, setActualReadings] = useState([])
  const [approvalSummary, setApprovalSummary] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadMonitoring = useCallback(async (options = {}) => {
    const { silent = false } = options

    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const response = await fetchFacilityMonitoring()
      const data = response?.data || {}

      setLiveData(Array.isArray(data.live_data) ? data.live_data : [])
      setCurrentLoad(Number(data.current_load || 0))
      setPreviousLoad(Number(data.previous_load || 0))
      setFloorData(Array.isArray(data.floor_data) ? data.floor_data : [])
      setAnomaly(data.anomaly || EMPTY_ANOMALY)
      setPendingReadings(Array.isArray(data.pending_readings) ? data.pending_readings : [])
      setActualReadings(Array.isArray(data.actual_readings) ? data.actual_readings : [])
      setApprovalSummary(data.approval_summary || { pending: 0, approved: 0, rejected: 0 })
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setLiveData([])
      setCurrentLoad(0)
      setPreviousLoad(0)
      setFloorData([])
      setAnomaly(EMPTY_ANOMALY)
      setPendingReadings([])
      setActualReadings([])
      setApprovalSummary({ pending: 0, approved: 0, rejected: 0 })
      setError(err?.response?.data?.message || err?.message || 'Failed to load monitoring data.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadMonitoring()
  }, [loadMonitoring])

  useEffect(() => {
    const timer = setInterval(() => {
      loadMonitoring({ silent: true })
    }, DASHBOARD_READ_REFRESH_MS)

    return () => clearInterval(timer)
  }, [loadMonitoring])

  const approveReading = useCallback(async (id, note = '') => {
    try {
      setActing(true)
      await approveFacilityReading(id, { notes: note })
      await loadMonitoring({ silent: true })
      return { success: true, message: 'Reading approved successfully.' }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to approve reading.',
      }
    } finally {
      setActing(false)
    }
  }, [loadMonitoring])

  const rejectReading = useCallback(async (id, note = '') => {
    try {
      setActing(true)
      await rejectFacilityReading(id, { notes: note })
      await loadMonitoring({ silent: true })
      return { success: true, message: 'Reading rejected successfully.' }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to reject reading.',
      }
    } finally {
      setActing(false)
    }
  }, [loadMonitoring])

  const bulkApproveReadings = useCallback(async (readingIds, note = '') => {
    try {
      setActing(true)
      const response = await bulkApproveFacilityReadings({ reading_ids: readingIds, notes: note })
      await loadMonitoring({ silent: true })
      return { success: Boolean(response?.success), message: response?.message || 'Bulk approval completed.' }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to approve selected readings.',
      }
    } finally {
      setActing(false)
    }
  }, [loadMonitoring])

  const bulkRejectReadings = useCallback(async (readingIds, note = '') => {
    try {
      setActing(true)
      const response = await bulkRejectFacilityReadings({ reading_ids: readingIds, notes: note })
      await loadMonitoring({ silent: true })
      return { success: Boolean(response?.success), message: response?.message || 'Bulk rejection completed.' }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to reject selected readings.',
      }
    } finally {
      setActing(false)
    }
  }, [loadMonitoring])

  const trend = useMemo(() => currentLoad - previousLoad, [currentLoad, previousLoad])

  return {
    liveData,
    currentLoad,
    previousLoad,
    trend,
    floorData,
    anomaly,
    pendingReadings,
    actualReadings,
    approvalSummary,
    loading,
    acting,
    error,
    lastUpdated,
    reload: loadMonitoring,
    approveReading,
    rejectReading,
    bulkApproveReadings,
    bulkRejectReadings,
  }
}



