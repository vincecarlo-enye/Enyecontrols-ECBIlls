import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createAdminMeter,
  deleteAdminMeter,
  fetchAdminMeters,
  fetchAvailableMeterWatches,
  updateAdminMeter,
} from '../../services/adminService/adminMeterService'
import { getSharedAdminUnits } from '@/services/adminService/adminDirectoryStore'

function parseAssignedUnitIds(value, fallbackUnitId = null) {
  if (Array.isArray(value)) {
    return value.map((id) => Number(id)).filter(Boolean)
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map((id) => Number(id)).filter(Boolean)
      }
    } catch {
      //
    }
  }

  return fallbackUnitId ? [Number(fallbackUnitId)] : []
}

function normalizeWatchType(type) {
  if (type === 'electricity') return 'electric'
  return type
}

function mapMeters(rows = []) {
  return rows.map((meter) => ({
    id: meter.id,
    type: normalizeWatchType(meter.type),
    meterName: meter.meter_name || '',
    watchName: meter.watch_name || '',
    pageName: meter.page_name || '',
    unitIds: parseAssignedUnitIds(meter.assigned_unit_ids, meter.unit_id || meter?.unit?.id || null),
    assignedUnits: Array.isArray(meter.assigned_units) ? meter.assigned_units : [],
    unitsLabel: Array.isArray(meter.assigned_units) && meter.assigned_units.length > 0
      ? meter.assigned_units
          .map((unit) => unit.unit_number || unit.name || `Unit #${unit.id}`)
          .join(', ')
      : meter?.unit?.unit_number || meter?.unit?.name || '',
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
    tenant: unit?.tenants?.find((tenant) => tenant?.status === 'active')?.name || unit?.tenants?.[0]?.name || '',
    tenantId: unit?.tenants?.find((tenant) => tenant?.status === 'active')?.id || unit?.tenants?.[0]?.id || null,
    status: unit.status || 'vacant',
    tenantCount: Array.isArray(unit?.tenants) ? unit.tenants.length : 0,
  }))
}

function enrichMetersWithUnits(meters = [], units = []) {
  const unitMap = new Map(units.map((unit) => [String(unit.id), unit]))

  return meters.map((meter) => {
    const assignedUnits = (meter.unitIds || [])
      .map((id) => unitMap.get(String(id)))
      .filter(Boolean)

    const activeUnits = assignedUnits.filter((unit) => unit.status === 'occupied' || unit.tenant)
    const tenantNames = [...new Set(
      activeUnits
        .map((unit) => unit.tenant)
        .filter(Boolean)
    )]
    const occupiedUnitCount = activeUnits.length
    const tenantCount = tenantNames.length

    return {
      ...meter,
      assignedUnitDetails: assignedUnits,
      tenant: tenantNames.join(', ') || meter.tenant || '',
      tenantCount,
      occupiedUnitCount,
      occupancyLabel: assignedUnits.length > 0
        ? `${assignedUnits.length} unit${assignedUnits.length !== 1 ? 's' : ''}`
        : meter.unitsLabel || meter.unit || '',
    }
  })
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

const DEFAULT_PER_PAGE = 12
const DEFAULT_META = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
}

export function useAdminMeters() {
  const [meters, setMeters] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [meta, setMeta] = useState(DEFAULT_META)

  const loadMeters = useCallback(async (nextPage = page, nextPerPage = perPage) => {
    try {
      setLoading(true)
      setError('')

      const [metersRes, unitsRes] = await Promise.all([
        fetchAdminMeters({ page: nextPage, per_page: nextPerPage }),
        getSharedAdminUnits(),
      ])

      const normalizedUnits = mapUnits(unitsRes)
      const normalizedMeters = mapMeters(Array.isArray(metersRes?.data) ? metersRes.data : [])

      setUnits(normalizedUnits)
      setMeters(enrichMetersWithUnits(normalizedMeters, normalizedUnits))
      setMeta(metersRes?.meta || {
        ...DEFAULT_META,
        current_page: nextPage,
        per_page: nextPerPage,
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load meters.')
      setMeters([])
      setUnits([])
      setMeta(DEFAULT_META)
    } finally {
      setLoading(false)
    }
  }, [page, perPage])

  useEffect(() => {
    loadMeters(page, perPage)
  }, [loadMeters, page, perPage])

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
        unit_ids: Array.isArray(data.unitIds) ? data.unitIds : [],
        status: data.status || 'active',
      })

      setPage(1)
      await loadMeters(1, perPage)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to create meter.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadMeters, perPage])

  const updateMeter = useCallback(async (id, data) => {
    try {
      setSaving(true)
      setError('')

      await updateAdminMeter(id, {
        meter_name: data.meterName,
        watch_name: data.watchName,
        page_name: data.pageName || null,
        type: normalizeWatchType(data.type),
        unit_ids: Array.isArray(data.unitIds) ? data.unitIds : [],
        status: data.status || 'active',
      })

      await loadMeters(page, perPage)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update meter.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadMeters, page, perPage])

  const removeMeter = useCallback(async (id) => {
    try {
      setSaving(true)
      setError('')
      await deleteAdminMeter(id)
      const nextPage = page > 1 && meters.length === 1 ? page - 1 : page
      if (nextPage !== page) setPage(nextPage)
      await loadMeters(nextPage, perPage)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete meter.'
      setError(message)
      return { success: false, message }
    } finally {
      setSaving(false)
    }
  }, [loadMeters, page, perPage, meters.length])

  const counts = useMemo(
    () => ({
      electric: meters.filter((meter) => meter.type === 'electric').length,
      water: meters.filter((meter) => meter.type === 'water').length,
      thermal: meters.filter((meter) => meter.type === 'thermal').length,
      other: meters.filter((meter) => meter.type === 'other').length,
    }),
    [meters]
  )

  return {
    meters,
    units,
    loading,
    saving,
    error,
    meta,
    page,
    perPage,
    setPage,
    setPerPage,
    counts,
    loadMeters,
    getAvailableWatches,
    addMeter,
    updateMeter,
    deleteMeter: removeMeter,
  }
}
