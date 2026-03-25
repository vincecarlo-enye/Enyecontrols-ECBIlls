import { useEffect, useMemo, useState, useCallback } from 'react'
import { fetchAdminRates, updateAdminRate } from '../../services/adminService/adminRateService'

const fallbackRates = {
  electricity: { id: null, rate: 0, unit: '/kWh', completeness: 0, raw: null },
  water: { id: null, rate: 0, unit: '/m³', completeness: 0, raw: null },
  thermal: { id: null, rate: 0, unit: '/kBTU/h', completeness: 0, raw: null },
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

  const saveRate = useCallback(async (type, newRate) => {
    const target = rates[type]

    if (!target?.id) {
      return {
        success: false,
        message: `No existing ${type} rate found.`,
      }
    }

    const raw = target.raw

    try {
      setSaving(true)

      await updateAdminRate(target.id, {
        name: raw.name,
        type: raw.type,
        price_per_unit: newRate,
        unit_measure: raw.unit_measure,
        effective_from: raw.effective_from,
        effective_to: raw.effective_to,
        is_active: raw.is_active,
        description: raw.description,
      })

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
          unit_measure: raw.unit_measure,
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
