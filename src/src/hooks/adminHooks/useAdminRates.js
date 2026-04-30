import { normalizeUtilityKey } from '@/utils/utilityTypes'
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  createAdminRate,
  fetchAdminRates,
  getAdminRatesSnapshot,
  updateAdminRate,
} from '../../services/adminService/adminRateService'

const fallbackRates = {
  electricity: { id: null, rate: 0, unit: '/kWh', completeness: 0, raw: null },
  water: { id: null, rate: 0, unit: '/m³', completeness: 0, raw: null },
  thermal: { id: null, rate: 0, unit: '/kBTU', completeness: 0, raw: null },
}


function getRatePriority(row) {
  const effectiveFrom = row?.effective_from ? new Date(row.effective_from).getTime() : 0
  const createdAt = row?.created_at ? new Date(row.created_at).getTime() : 0

  return [
    row?.is_active ? 1 : 0,
    Number.isFinite(effectiveFrom) ? effectiveFrom : 0,
    Number.isFinite(createdAt) ? createdAt : 0,
    Number(row?.id || 0),
  ]
}

function isHigherPriorityRate(nextRow, currentRow) {
  if (!currentRow) return true

  const nextPriority = getRatePriority(nextRow)
  const currentPriority = getRatePriority(currentRow)

  for (let index = 0; index < nextPriority.length; index += 1) {
    if (nextPriority[index] === currentPriority[index]) continue
    return nextPriority[index] > currentPriority[index]
  }

  return false
}

function normalizeRateRow(type, row = {}) {
  if (!type || !row || typeof row !== 'object') return null

  return {
    id: row.id ?? row.rate_id ?? `${type}-current`,
    name: row.name ?? `${type} rate`,
    type,
    price_per_unit: row.price_per_unit ?? row.pricePerUnit ?? row.rate ?? row.value ?? 0,
    unit_measure: row.unit_measure ?? row.unitMeasure ?? row.unit ?? '',
    effective_from: row.effective_from ?? row.effectiveFrom ?? row.updated_at ?? row.created_at ?? null,
    effective_to: row.effective_to ?? row.effectiveTo ?? null,
    is_active: row.is_active ?? row.isActive ?? true,
    description: row.description ?? '',
    created_at: row.created_at ?? row.createdAt ?? row.updated_at ?? null,
  }
}

function extractRateRows(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.rates)) return payload.rates

  const keyedRows = ['electricity', 'electric', 'water', 'thermal']
    .map((key) => {
      const normalizedType = normalizeUtilityKey(key)
      const value = payload[key]
      if (!normalizedType || !value || typeof value !== 'object') return null
      return normalizeRateRow(key === 'electric' ? 'electric' : normalizedType, value)
    })
    .filter(Boolean)

  if (keyedRows.length > 0) return keyedRows

  return []
}

function mapRatesToCardShape(rowsInput = []) {
  const rows = extractRateRows(rowsInput)
  const mapped = { ...fallbackRates }
  const currentRatesByType = {}

  rows.forEach((row) => {
    const key = normalizeUtilityKey(row.type)
    if (!key) return

    if (isHigherPriorityRate(row, currentRatesByType[key])) {
      currentRatesByType[key] = row
    }
  })

  Object.entries(currentRatesByType).forEach(([key, row]) => {
    mapped[key] = {
      id: row.id,
      rate: Number(row.price_per_unit || 0),
      unit: key === 'thermal' && ['kbtu/h', 'kbut/h', 'kbuth', 'kbtu', 'btu'].includes(String(row.unit_measure || '').toLowerCase())
        ? '/kBTU'
        : row.unit_measure ? `/${row.unit_measure}` : fallbackRates[key].unit,
      completeness: row.price_per_unit ? 100 : 0,
      raw: row,
    }
  })

  return mapped
}

export function useAdminRates() {
  const initialSnapshot = getAdminRatesSnapshot()
  const initialRows = extractRateRows(initialSnapshot)
  const hasInitialRates = initialRows.length > 0
  const [rawRates, setRawRates] = useState(initialRows)
  const [loading, setLoading] = useState(!hasInitialRates)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadRates = useCallback(async () => {
    setLoading((current) => current || !hasInitialRates)
    setError('')

    try {
      const data = await fetchAdminRates()
      const rows = extractRateRows(data)
      setRawRates(rows)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load rates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  const rates = useMemo(() => mapRatesToCardShape(rawRates), [rawRates])

  const saveRate = useCallback(async (type, nextData) => {
    const target = rates[type]
    const nextRate = Number(nextData?.rate || 0)
    const nextUnit = String(nextData?.unit || '').replace(/^\//, '')
    const rawType = type === 'electricity' ? 'electric' : type

    try {
      setSaving(true)

      if (target?.id) {
        const raw = target.raw

        await updateAdminRate(target.id, {
          name: raw.name,
          type: raw.type,
          price_per_unit: nextRate,
          unit_measure: nextUnit || raw.unit_measure,
          effective_from: raw.effective_from,
          effective_to: raw.effective_to,
          is_active: raw.is_active,
          description: raw.description,
        })
      } else {
        await createAdminRate({
          name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Rate`,
          type: rawType,
          price_per_unit: nextRate,
          unit_measure: nextUnit || fallbackRates[type].unit.replace(/^\//, ''),
          effective_from: new Date().toISOString().slice(0, 10),
          effective_to: null,
          is_active: true,
          description: `${type} billing rate`,
        })
      }

      await loadRates()

      return {
        success: true,
        message: `${type} rate updated successfully.`,
      }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || `Failed to update ${type} rate.`,
      }
    } finally {
      setSaving(false)
    }
  }, [rates, loadRates])

  const saveAllRates = useCallback(async (nextRates) => {
    try {
      setSaving(true)

      for (const type of ['electricity', 'water', 'thermal']) {
        const target = rates[type]
        const next = nextRates[type]

        if (!target?.id || !next) continue

        const raw = target.raw

        await updateAdminRate(target.id, {
          name: raw.name,
          type: raw.type,
          price_per_unit: Number(next.rate || 0),
          unit_measure: String(next.unit || raw.unit_measure || '').replace(/^\//, '') || raw.unit_measure,
          effective_from: raw.effective_from,
          effective_to: raw.effective_to,
          is_active: raw.is_active,
          description: raw.description,
        })
      }

      await loadRates()

      return {
        success: true,
        message: 'All rates updated successfully.',
      }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to save all rates.',
      }
    } finally {
      setSaving(false)
    }
  }, [rates, loadRates])

  return {
    rates,
    rawRates,
    loading,
    saving,
    error,
    loadRates,
    saveRate,
    saveAllRates,
  }
}
