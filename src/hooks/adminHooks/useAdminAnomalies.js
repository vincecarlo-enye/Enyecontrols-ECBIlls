import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAdminAnomalies,
  updateAdminAnomaly,
} from '@/services/adminService/adminAnomalyService'

export function useAdminAnomalies() {
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAnomalies = useCallback(async (options = {}) => {
    const { silent = false } = options

    if (!silent) {
      setLoading(true)
    }
    setError('')
    try {
      const listRes = await fetchAdminAnomalies()
      setAnomalies(Array.isArray(listRes?.data) ? listRes.data : [])
    } catch (err) {
      setAnomalies([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load admin anomalies.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadAnomalies()
  }, [loadAnomalies])

  const saveAnomaly = useCallback(async (id, payload) => {
    try {
      setSaving(true)
      const response = await updateAdminAnomaly(id, payload)
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

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayRows = anomalies.filter((row) => {
      const sourceDate =
        row.detectedAt ||
        row.detected_at ||
        row.createdAt ||
        row.created_at ||
        row.updatedAt ||
        row.updated_at ||
        ''

      return String(sourceDate).slice(0, 10) === today
    })

    const totalToday = todayRows.length
    const criticalToday = todayRows.filter((row) => row.severity === 'critical').length
    const minorToday = todayRows.filter((row) => row.severity === 'medium').length
    const resolved = anomalies.filter((row) => row.status === 'resolved').length
    const resolutionRate = anomalies.length
      ? Math.round((resolved / anomalies.length) * 100)
      : 0

    return {
      total_today: totalToday,
      critical_today: criticalToday,
      minor_today: minorToday,
      resolution_rate: resolutionRate,
    }
  }, [anomalies])

  const stats = useMemo(() => ({
    total: anomalies.length,
    open: anomalies.filter((row) => row.status === 'open').length,
    resolved: anomalies.filter((row) => row.status === 'resolved').length,
    critical: anomalies.filter((row) => row.severity === 'critical').length,
  }), [anomalies])

  return {
    anomalies,
    summary,
    stats,
    loading,
    saving,
    error,
    reload: loadAnomalies,
    saveAnomaly,
  }
}
