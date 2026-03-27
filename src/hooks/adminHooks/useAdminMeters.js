import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createAdminMeter,
  deleteAdminMeter,
  fetchAdminMeters,
  fetchAvailableMeterWatches,
  updateAdminMeter,
} from '../../services/adminService/adminMeterService'
import { fetchAdminUnits } from '../../services/adminService/adminUnitService'

function mapMeters(rows = []) {
  return rows.map((meter) => ({
    id: meter.id,
    type: meter.type,
    meterName: meter.meter_name || '',
    watchName: meter.watch_name || '',
    pageName: meter.page_name || '',
    unit: meter?.unit?.unit_number || meter?.unit?.name || '',
    unitId: meter?.unit_id || meter?.unit?.id || null,
    tenant: meter?.tenant?.name || meter?.unit?.tenants?.[0]?.name || '',
    tenantId: meter?.tenant_id || meter?.tenant?.id || meter?.unit?.tenants?.[0]?.id || null,
    status: meter.status || 'active',
    raw: meter,
  }))
}

function mapUnits(rows = []) {
  return rows.map((unit) => ({
    id: unit.id,
    unit: unit.unit_number || unit.name || '',
    tenant: unit?.tenants?.[0]?.name || '',
    tenantId: unit?.tenants?.[0]?.id || null,
  }))
}

function normalizeWatchType(type) {
  if (type === 'electricity') return 'electric'
  return type
}

function inferMeterType(watchName, unit, value) {
  const watch = String(watchName || '').toLowerCase()
  const normalizedUnit = String(unit || '').toLowerCase()

  if (normalizedUnit === 'kwh' || watch.includes('energy') || watch.includes('power')) {
    return 'electric'
  }

  if (
    ['m3', 'm³', 'm3/h', 'm³/h'].includes(normalizedUnit) ||
    watch.includes('water')
  ) {
    return 'water'
  }

  if (
    normalizedUnit === 'kbtu/h' ||
    normalizedUnit === 'kbut/h' ||
    watch.includes('btu') ||
    watch.includes('thermal')
  ) {
    return 'thermal'
  }

  if (typeof value === 'boolean') {
    return 'other'
  }

  return 'other'
}

function normalizeAvailableWatches(payload) {
  if (Array.isArray(payload?.data) && payload.data.length > 0 && payload.data[0]?.watch_name) {
    return payload.data
  }

  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

  return rows
    .map((item) => {
      const watchName = item?.watch_name ?? item?.WatchName ?? ''
      if (!watchName) return null

      const unit = item?.unit ?? item?.Unit ?? ''
      const value = item?.value ?? item?.Value ?? null

      return {
        watch_name: watchName,
        unit,
        value,
        value_type: typeof value,
        suggested_type: inferMeterType(watchName, unit, value),
        can_register_as_meter: true,
      }
    })
    .filter(Boolean)
}

export function useAdminMeters() {
  const [meters, setMeters] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadMeters = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [metersRes, unitsRes] = await Promise.all([
        fetchAdminMeters(),
        fetchAdminUnits(),
      ])

      setMeters(mapMeters(Array.isArray(metersRes?.data) ? metersRes.data : []))
      setUnits(mapUnits(Array.isArray(unitsRes?.data) ? unitsRes.data : []))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load meters.')
      setMeters([])
      setUnits([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMeters()
  }, [loadMeters])

  const getAvailableWatches = useCallback(async (pageName) => {
    const res = await fetchAvailableMeterWatches(pageName)
    return normalizeAvailableWatches(res)
  }, [])

  const addMeter = useCallback(async (data) => {
    try {
      setSaving(true)
      setError('')

      await createAdminMeter({
        meter_name: data.meterName,
        watch_name: data.watchName,
        page_name: data.pageName || null,
        type: normalizeWatchType(data.type),
        unit_id: data.unitId || null,
        tenant_id: data.tenantId || null,
        status: data.status || 'active',
      })

      await loadMeters()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to create meter.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadMeters])

  const updateMeter = useCallback(async (id, data) => {
    try {
      setSaving(true)
      setError('')

      await updateAdminMeter(id, {
        meter_name: data.meterName,
        watch_name: data.watchName,
        page_name: data.pageName || null,
        type: normalizeWatchType(data.type),
        unit_id: data.unitId || null,
        tenant_id: data.tenantId || null,
        status: data.status || 'active',
      })

      await loadMeters()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update meter.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadMeters])

  const removeMeter = useCallback(async (id) => {
    try {
      setSaving(true)
      setError('')
      await deleteAdminMeter(id)
      await loadMeters()
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete meter.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadMeters])

  return {
    meters,
    units,
    loading,
    saving,
    error,
    loadMeters,
    getAvailableWatches,
    addMeter,
    updateMeter,
    deleteMeter: removeMeter,
  }
}
