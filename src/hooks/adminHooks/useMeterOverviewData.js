import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminMeters } from '@/services/adminService/adminMeterService'
import { fetchAdminUnits } from '@/services/adminService/adminUnitService'

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
      // ignore malformed JSON
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
    unitIds: parseAssignedUnitIds(meter.assigned_unit_ids, meter.unit_id || meter?.unit?.id || null),
    unitsLabel: Array.isArray(meter.assigned_units) && meter.assigned_units.length > 0
      ? meter.assigned_units.map((unit) => unit.unit_number || unit.name || `Unit #${unit.id}`).join(', ')
      : meter?.unit?.unit_number || meter?.unit?.name || '',
    unit: meter?.unit?.unit_number || meter?.unit?.name || '',
    tenant: meter?.tenant?.name || meter?.unit?.tenants?.[0]?.name || '',
    status: meter.status || 'active',
  }))
}

function mapUnits(rows = []) {
  return rows.map((unit) => ({
    id: unit.id,
    unit: unit.unit_number || unit.name || '',
    tenant: unit?.tenants?.find((tenant) => tenant?.status === 'active')?.name || unit?.tenants?.[0]?.name || '',
    status: unit.status || 'vacant',
  }))
}

function enrichMetersWithUnits(meters = [], units = []) {
  const unitMap = new Map(units.map((unit) => [String(unit.id), unit]))

  return meters.map((meter) => {
    const assignedUnits = (meter.unitIds || []).map((id) => unitMap.get(String(id))).filter(Boolean)
    const activeUnits = assignedUnits.filter((unit) => unit.status === 'occupied' || unit.tenant)
    const tenantNames = [...new Set(activeUnits.map((unit) => unit.tenant).filter(Boolean))]

    return {
      ...meter,
      unit: assignedUnits.map((unit) => unit.unit).filter(Boolean).join(', ') || meter.unitsLabel || meter.unit,
      tenant: tenantNames.join(', ') || meter.tenant || '',
    }
  })
}

export function useMeterOverviewData() {
  const [meters, setMeters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMeterOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [metersRes, unitsRes] = await Promise.all([
        fetchAdminMeters({ page: 1, per_page: 200 }),
        fetchAdminUnits(),
      ])

      const normalizedUnits = mapUnits(Array.isArray(unitsRes?.data) ? unitsRes.data : [])
      const normalizedMeters = mapMeters(Array.isArray(metersRes?.data) ? metersRes.data : [])

      setMeters(enrichMetersWithUnits(normalizedMeters, normalizedUnits))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load meter overview.')
      setMeters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMeterOverview()
  }, [loadMeterOverview])

  const summary = useMemo(() => {
    const active = meters.filter((meter) => meter.status === 'active').length
    const total = meters.length

    return {
      active,
      total,
      counts: {
        electric: meters.filter((meter) => meter.type === 'electric').length,
        water: meters.filter((meter) => meter.type === 'water').length,
        thermal: meters.filter((meter) => meter.type === 'thermal').length,
        other: meters.filter((meter) => meter.type === 'other').length,
      },
    }
  }, [meters])

  return {
    meters,
    loading,
    error,
    loadMeterOverview,
    ...summary,
  }
}
