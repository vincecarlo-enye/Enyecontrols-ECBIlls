import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useBills } from '@/components/billing/hooks/useBills'

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeType(value) {
  const type = String(value || '').toLowerCase()
  if (type === 'electricity' || type === 'electric') return 'electric'
  if (type === 'water') return 'water'
  if (type === 'thermal') return 'thermal'
  return ''
}

function getTenantUnits(user) {
  return Array.from(
    new Set(
      (Array.isArray(user?.tenants) ? user.tenants : [user?.tenant])
        .filter(Boolean)
        .map((tenant) => tenant?.unit)
        .filter(Boolean)
    )
  )
}

function getSelectedUnits(units, requestedUnit) {
  if (requestedUnit === 'all') return units

  return units.filter((unit) => {
    const label = unit?.unit_number || unit?.name || ''
    return String(label) === String(requestedUnit)
  })
}

function sumBillItems(items = []) {
  const summary = {
    electric: { previous: 0, current: 0, consumption: 0, unit: 'kWh' },
    water: { previous: 0, current: 0, consumption: 0, unit: 'm3' },
    thermal: { previous: 0, current: 0, consumption: 0, unit: 'kBTU' },
  }

  items.forEach((item) => {
    const type = normalizeType(item?.type || item?.utility_type)
    if (!type || !summary[type]) return

    summary[type].previous += toNumber(item?.previous_reading)
    summary[type].current += toNumber(item?.current_reading)
    summary[type].consumption += toNumber(item?.consumption ?? item?.quantity)
    summary[type].unit =
      item?.rate?.unit_measure ||
      item?.unit_measure ||
      summary[type].unit
  })

  return summary
}

function buildSummaryFromBills(bills) {
  const base = {
    electric: { previous: 0, current: 0, previous_reading: 0, current_reading: 0, consumption: 0, unit: 'kWh' },
    water: { previous: 0, current: 0, previous_reading: 0, current_reading: 0, consumption: 0, unit: 'm3' },
    thermal: { previous: 0, current: 0, previous_reading: 0, current_reading: 0, consumption: 0, unit: 'kBTU' },
  }

  bills.forEach((bill) => {
    const itemSummary = sumBillItems(bill?.raw?.items || bill?.raw?.bill_items || [])
    ;['electric', 'water', 'thermal'].forEach((type) => {
      base[type].previous += itemSummary[type].previous
      base[type].current += itemSummary[type].current
      base[type].previous_reading += itemSummary[type].previous
      base[type].current_reading += itemSummary[type].current
      base[type].consumption += itemSummary[type].consumption
      base[type].unit = itemSummary[type].unit || base[type].unit
    })
  })

  return base
}

function getBillDate(bill) {
  const raw = bill?.raw || {}
  return raw?.billing_end || raw?.due_date || raw?.created_at || null
}

function buildGroupedHistory(bills, formatter) {
  const map = new Map()

  bills.forEach((bill) => {
    const billDate = getBillDate(bill)
    if (!billDate) return

    const date = new Date(billDate)
    if (Number.isNaN(date.getTime())) return

    const key = formatter.key(date)
    const label = formatter.label(date)

    if (!map.has(key)) {
      map.set(key, {
        label,
        electric: 0,
        water: 0,
        thermal: 0,
      })
    }

    const bucket = map.get(key)
    const itemSummary = sumBillItems(bill?.raw?.items || bill?.raw?.bill_items || [])
    bucket.electric += itemSummary.electric.consumption
    bucket.water += itemSummary.water.consumption
    bucket.thermal += itemSummary.thermal.consumption
  })

  return Array.from(map.entries())
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([, bucket]) => ({
      ...bucket,
      electric: Number(bucket.electric.toFixed(2)),
      water: Number(bucket.water.toFixed(2)),
      thermal: Number(bucket.thermal.toFixed(2)),
    }))
}

function buildHourlyFallback(summary = {}) {
  const electric = toNumber(summary?.electric?.consumption)
  const water = toNumber(summary?.water?.consumption)
  const thermal = toNumber(summary?.thermal?.consumption)

  return Array.from({ length: 24 }, (_, h) => ({
    time: `${String(h).padStart(2, '0')}:00`,
    electric: Number((electric / 24).toFixed(2)),
    water: Number((water / 24).toFixed(2)),
    thermal: Number((thermal / 24).toFixed(2)),
  }))
}

export function useTenantUsageMonitoring() {
  const { user } = useAuth()
  const { bills, loading, error, refreshBills } = useBills()
  const [requestedUnit, setRequestedUnit] = useState('all')

  const tenantUnits = useMemo(() => getTenantUnits(user), [user])
  const selectedUnits = useMemo(
    () => getSelectedUnits(tenantUnits, requestedUnit),
    [requestedUnit, tenantUnits]
  )

  const filteredBills = useMemo(() => {
    if (requestedUnit === 'all') {
      return bills
    }

    return bills.filter((bill) => String(bill?.unit) === String(requestedUnit))
  }, [bills, requestedUnit])

  const latestBills = useMemo(() => {
    if (requestedUnit !== 'all') {
      return filteredBills.length > 0 ? [filteredBills[0]] : []
    }

    const seen = new Set()
    return filteredBills.filter((bill) => {
      const key = String(bill?.unit || '')
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [filteredBills, requestedUnit])

  const summary = useMemo(() => buildSummaryFromBills(latestBills), [latestBills])

  const daily = useMemo(() => {
    return buildGroupedHistory(filteredBills, {
      key: (date) => date.toISOString().slice(0, 10),
      label: (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }).slice(-7)
  }, [filteredBills])

  const monthly = useMemo(() => {
    return buildGroupedHistory(filteredBills, {
      key: (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: (date) => date.toLocaleDateString('en-US', { month: 'short' }),
    }).slice(-6)
  }, [filteredBills])

  const hourly = useMemo(() => buildHourlyFallback(summary), [summary])

  const refreshUsage = useCallback(async (unit = 'all') => {
    setRequestedUnit(unit || 'all')
    await refreshBills()
  }, [refreshBills])

  useEffect(() => {
    setRequestedUnit((prev) => prev || 'all')
  }, [])

  return {
    summary,
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
    hourly,
    daily,
    monthly,
    loading,
    error,
    refreshUsage,
  }
}
