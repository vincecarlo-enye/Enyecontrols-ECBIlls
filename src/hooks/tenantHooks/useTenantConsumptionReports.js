import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useBills } from '@/components/billing/hooks/useBills'

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeType(value) {
  const type = String(value || '').toLowerCase()
  if (type === 'electric' || type === 'electricity') return 'electricity'
  if (type === 'water') return 'water'
  if (type === 'thermal') return 'thermal'
  return ''
}

function getTenantUnits(user) {
  return (Array.isArray(user?.tenants) ? user.tenants : [user?.tenant])
    .filter(Boolean)
    .map((tenant) => tenant?.unit)
    .filter(Boolean)
}

function getSelectedUnits(units, requestedUnit) {
  if (requestedUnit === 'all') return units

  return units.filter((unit) => {
    const label = unit?.unit_number || unit?.name || ''
    return String(label) === String(requestedUnit)
  })
}

function getBillDate(bill) {
  const raw = bill?.raw || {}
  const value = raw?.billing_end || raw?.due_date || raw?.created_at || null
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function getMonthlyData(bills) {
  const monthlyMap = new Map()

  bills.forEach((bill) => {
    const date = getBillDate(bill)
    if (!date) return

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'short' })

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        month: label,
        electricity: 0,
        water: 0,
        thermal: 0,
      })
    }

    const bucket = monthlyMap.get(key)
    const items = bill?.raw?.items || bill?.raw?.bill_items || []

    items.forEach((item) => {
      const type = normalizeType(item?.type || item?.utility_type)
      if (!type || !bucket[type] && bucket[type] !== 0) return
      bucket[type] += toNumber(item?.consumption ?? item?.quantity)
    })
  })

  return Array.from(monthlyMap.entries())
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([, row]) => ({
      month: row.month,
      electricity: Number(row.electricity.toFixed(2)),
      water: Number(row.water.toFixed(2)),
      thermal: Number(row.thermal.toFixed(2)),
    }))
    .slice(-6)
}

export function useTenantConsumptionReports() {
  const { user } = useAuth()
  const { bills, loading, error, refreshBills } = useBills()
  const [requestedUnit, setRequestedUnit] = useState('all')

  const tenantUnits = useMemo(() => getTenantUnits(user), [user])
  const selectedUnits = useMemo(
    () => getSelectedUnits(tenantUnits, requestedUnit),
    [requestedUnit, tenantUnits]
  )

  const filteredBills = useMemo(() => {
    if (requestedUnit === 'all') return bills
    return bills.filter((bill) => String(bill?.unit) === String(requestedUnit))
  }, [bills, requestedUnit])

  const monthly = useMemo(() => getMonthlyData(filteredBills), [filteredBills])

  const summary = useMemo(() => ({
    electricity: Number(monthly.reduce((sum, row) => sum + toNumber(row.electricity), 0).toFixed(2)),
    water: Number(monthly.reduce((sum, row) => sum + toNumber(row.water), 0).toFixed(2)),
    thermal: Number(monthly.reduce((sum, row) => sum + toNumber(row.thermal), 0).toFixed(2)),
  }), [monthly])

  const reload = useCallback(async (unit = 'all') => {
    setRequestedUnit(unit || 'all')
    await refreshBills()
  }, [refreshBills])

  return {
    unit:
      requestedUnit === 'all' || selectedUnits.length !== 1
        ? null
        : {
            id: selectedUnits[0]?.id ?? null,
            unit_number: selectedUnits[0]?.unit_number || selectedUnits[0]?.name || '',
          },
    units: selectedUnits.map((unit) => ({
      id: unit?.id ?? null,
      unit_number: unit?.unit_number || unit?.name || '',
    })),
    summary,
    monthly,
    loading,
    error,
    reload,
  }
}
