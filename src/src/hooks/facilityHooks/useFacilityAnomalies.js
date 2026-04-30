import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchFacilityAnomalies,
  fetchFacilityAnomalyAnalytics,
  updateFacilityAnomaly,
} from '@/services/facilityService/facilityAnomalyService'

export function useFacilityAnomalies() {
  const [anomalies, setAnomalies] = useState([])
  const [analytics, setAnalytics] = useState({ total: 0, critical: 0, open: 0, resolved_rate: 0, trend: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAnomalies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [listRes, analyticsRes] = await Promise.all([
        fetchFacilityAnomalies(),
        fetchFacilityAnomalyAnalytics(),
      ])
      setAnomalies(Array.isArray(listRes?.data) ? listRes.data : [])
      setAnalytics(analyticsRes?.data || { total: 0, critical: 0, open: 0, resolved_rate: 0, trend: [] })
    } catch (err) {
      setAnomalies([])
      setAnalytics({ total: 0, critical: 0, open: 0, resolved_rate: 0, trend: [] })
      setError(err?.response?.data?.message || err?.message || 'Failed to load anomalies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnomalies()
  }, [loadAnomalies])

  const saveAnomaly = useCallback(async (id, payload) => {
    try {
      setSaving(true)
      const response = await updateFacilityAnomaly(id, payload)
      const updated = response?.data
      if (updated) {
        setAnomalies((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
      }
      return { success: true, message: response?.message || 'Anomaly updated successfully.' }
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || 'Failed to update anomaly.' }
    } finally {
      setSaving(false)
    }
  }, [])

  const stats = useMemo(() => ({
    total: anomalies.length,
    open: anomalies.filter((row) => row.status === 'open').length,
    resolved: anomalies.filter((row) => row.status === 'resolved').length,
    critical: anomalies.filter((row) => row.severity === 'critical').length,
  }), [anomalies])

  return {
    anomalies,
    analytics,
    stats,
    loading,
    saving,
    error,
    reload: loadAnomalies,
    saveAnomaly,
  }
}
