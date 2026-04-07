import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  createAdminRate,
  fetchAdminRates,
  updateAdminRate,
} from '../../services/adminService/adminRateService'

const fallbackRates = {
  electricity: { id: null, rate: 0, unit: '/kWh', completeness: 0, raw: null },
  water: { id: null, rate: 0, unit: '/m3', completeness: 0, raw: null },
  thermal: { id: null, rate: 0, unit: '/kBTU/h', completeness: 0, raw: null },
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeType(type) {
  if (type === 'electric') return 'electricity'
  if (type === 'water') return 'water'
  if (type === 'thermal') return 'thermal'
  return null
}

function mapRatesToCardShape(rows = []) {
  const mapped = { ...fallbackRates }

  rows.forEach((row) => {
    const key = normalizeType(row.type)
    if (!key || mapped[key].id) return

    mapped[key] = {
      id: row.id,
      rate: Number(row.price_per_unit || 0),
      unit: row.unit_measure ? `/${row.unit_measure}` : fallbackRates[key].unit,
      completeness: row.price_per_unit ? 100 : 0,
      raw: row,
    }
  })

  return mapped
}

function rateWindowCoversDate(rawRate, date = todayIsoDate()) {
  if (!rawRate) return false

  const from = rawRate.effective_from ? String(rawRate.effective_from).slice(0, 10) : null
  const to = rawRate.effective_to ? String(rawRate.effective_to).slice(0, 10) : null

  if (from && from > date) return false
  if (to && to < date) return false

  return true
}

export function useAdminRates() {
  const [rawRates, setRawRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadRates = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchAdminRates()
      const rows = Array.isArray(data) ? data : data?.data || []
      setRawRates(rows)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load rates.')
      setRawRates([])
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
    const effectiveFrom = todayIsoDate()

    try {
      setSaving(true)

      if (target?.id && rateWindowCoversDate(target.raw, effectiveFrom)) {
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
          effective_from: effectiveFrom,
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
        const effectiveFrom = todayIsoDate()

        if (!next) continue

        if (target?.id && rateWindowCoversDate(target.raw, effectiveFrom)) {
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
        } else {
          const rawType = type === 'electricity' ? 'electric' : type

          await createAdminRate({
            name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Rate`,
            type: rawType,
            price_per_unit: Number(next.rate || 0),
            unit_measure:
              String(next.unit || fallbackRates[type].unit).replace(/^\//, '') ||
              fallbackRates[type].unit.replace(/^\//, ''),
            effective_from: effectiveFrom,
            effective_to: null,
            is_active: true,
            description: `${type} billing rate`,
          })
        }
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
