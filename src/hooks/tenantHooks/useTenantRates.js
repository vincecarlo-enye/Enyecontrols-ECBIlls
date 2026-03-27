import { useCallback, useEffect, useMemo, useState } from 'react'
import { getTenantRates } from '@/services/tenantService/tenantRateService'

function normalizeRates(rows = []) {
  const base = {
    electricity: { rate: 0, unit: 'per kWh', effectiveFrom: '', description: '' },
    water: { rate: 0, unit: 'per m³', effectiveFrom: '', description: '' },
    thermal: { rate: 0, unit: 'per BTU', effectiveFrom: '', description: '' },
  }

  rows.forEach((item) => {
    const type = String(item?.type || '').toLowerCase()
    const key =
      type === 'electric'
        ? 'electricity'
        : type === 'water'
          ? 'water'
          : type === 'thermal'
            ? 'thermal'
            : null

    if (!key) return

    const isMoreRecent =
      !base[key].effectiveFrom ||
      new Date(item?.effective_from || 0) > new Date(base[key].effectiveFrom || 0)

    if (item?.is_active || isMoreRecent) {
      base[key] = {
        rate: Number(item?.price_per_unit || 0),
        unit: item?.unit_measure || base[key].unit,
        effectiveFrom: item?.effective_from || '',
        description: item?.description || '',
      }
    }
  })

  return base
}

export default function useTenantRates() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRates = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getTenantRates()
      setRates(data)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load utility rates.'
      )
      setRates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  return {
    rates: useMemo(() => normalizeRates(rates), [rates]),
    loading,
    error,
    reload: loadRates,
  }
}
