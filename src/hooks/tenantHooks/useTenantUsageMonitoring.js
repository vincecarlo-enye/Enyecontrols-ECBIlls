import { normalizeUtilityKey } from '@/utils/utilityTypes'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { isDateWithinTenantTimeRange } from '@/context/UnitFilterContext'
import { useBills } from '@/components/billing/hooks/useBills'
import { fetchTenantUsageMonitoring } from '@/services/tenantService/tenantUsageService'

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
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
    const type = normalizeUtilityKey(item?.type || item?.utility_type)
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

function buildWeekdayHistory(bills) {
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekdayMap = new Map(
    weekdayOrder.map((day) => [day, {
      day,
      electric: 0,
      water: 0,
      thermal: 0,
    }])
  )

  bills.forEach((bill) => {
    const billDate = getBillDate(bill)
    if (!billDate) return

    const date = new Date(billDate)
    if (Number.isNaN(date.getTime())) return

    const weekdayIndex = date.getDay()
    const day = weekdayOrder[(weekdayIndex + 6) % 7]
    const bucket = weekdayMap.get(day)
    if (!bucket) return

    const itemSummary = sumBillItems(bill?.raw?.items || bill?.raw?.bill_items || [])
    bucket.electric += itemSummary.electric.consumption
    bucket.water += itemSummary.water.consumption
    bucket.thermal += itemSummary.thermal.consumption
  })

  return weekdayOrder.map((day) => {
    const bucket = weekdayMap.get(day)
    return {
      day,
      electric: Number(bucket.electric.toFixed(2)),
      water: Number(bucket.water.toFixed(2)),
      thermal: Number(bucket.thermal.toFixed(2)),
    }
  })
}

function buildQuarterHistory(bills) {
  const quarterOrder = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter']
  const quarterMap = new Map(
    quarterOrder.map((quarter) => [quarter, {
      month: quarter,
      electric: 0,
      water: 0,
      thermal: 0,
    }])
  )

  bills.forEach((bill) => {
    const billDate = getBillDate(bill)
    if (!billDate) return

    const date = new Date(billDate)
    if (Number.isNaN(date.getTime())) return

    const quarter = quarterOrder[Math.floor(date.getMonth() / 3)]
    const bucket = quarterMap.get(quarter)
    if (!bucket) return

    const itemSummary = sumBillItems(bill?.raw?.items || bill?.raw?.bill_items || [])
    bucket.electric += itemSummary.electric.consumption
    bucket.water += itemSummary.water.consumption
    bucket.thermal += itemSummary.thermal.consumption
  })

  return quarterOrder.map((quarter) => {
    const bucket = quarterMap.get(quarter)
    return {
      month: quarter,
      electric: Number(bucket.electric.toFixed(2)),
      water: Number(bucket.water.toFixed(2)),
      thermal: Number(bucket.thermal.toFixed(2)),
    }
  })
}

function buildWeeklyHistory(bills) {
  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
  const weekMap = new Map(
    weekLabels.map((week) => [week, {
      month: week,
      electric: 0,
      water: 0,
      thermal: 0,
    }])
  )

  bills.forEach((bill) => {
    const billDate = getBillDate(bill)
    if (!billDate) return

    const date = new Date(billDate)
    if (Number.isNaN(date.getTime())) return

    const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 3)
    const week = weekLabels[weekIndex]
    const bucket = weekMap.get(week)
    if (!bucket) return

    const itemSummary = sumBillItems(bill?.raw?.items || bill?.raw?.bill_items || [])
    bucket.electric += itemSummary.electric.consumption
    bucket.water += itemSummary.water.consumption
    bucket.thermal += itemSummary.thermal.consumption
  })

  return weekLabels.map((week) => {
    const bucket = weekMap.get(week)
    return {
      month: week,
      electric: Number(bucket.electric.toFixed(2)),
      water: Number(bucket.water.toFixed(2)),
      thermal: Number(bucket.thermal.toFixed(2)),
    }
  })
}

function buildMonthlyHistory(bills) {
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthMap = new Map(
    monthLabels.map((month) => [month, {
      month,
      electric: 0,
      water: 0,
      thermal: 0,
    }])
  )

  bills.forEach((bill) => {
    const billDate = getBillDate(bill)
    if (!billDate) return

    const date = new Date(billDate)
    if (Number.isNaN(date.getTime())) return

    const month = monthLabels[date.getMonth()]
    const bucket = monthMap.get(month)
    if (!bucket) return

    const itemSummary = sumBillItems(bill?.raw?.items || bill?.raw?.bill_items || [])
    bucket.electric += itemSummary.electric.consumption
    bucket.water += itemSummary.water.consumption
    bucket.thermal += itemSummary.thermal.consumption
  })

  return monthLabels.map((month) => {
    const bucket = monthMap.get(month)
    return {
      month,
      electric: Number(bucket.electric.toFixed(2)),
      water: Number(bucket.water.toFixed(2)),
      thermal: Number(bucket.thermal.toFixed(2)),
    }
  })
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

function firstObject(...values) {
  return values.find((value) => value && typeof value === 'object' && !Array.isArray(value)) || {}
}

function firstArray(...values) {
  return values.find(Array.isArray) || []
}

function extractPayload(response) {
  return firstObject(response?.data, response)
}

function normalizeSummaryBucket(bucket = {}, fallbackUnit) {
  const record = firstObject(bucket)
  return {
    previous: toNumber(record?.previous ?? record?.previous_reading ?? record?.prev ?? record?.start),
    current: toNumber(record?.current ?? record?.current_reading ?? record?.curr ?? record?.end),
    previous_reading: toNumber(record?.previous_reading ?? record?.previous ?? record?.prev ?? record?.start),
    current_reading: toNumber(record?.current_reading ?? record?.current ?? record?.curr ?? record?.end),
    consumption: toNumber(record?.consumption ?? record?.usage ?? record?.value ?? record?.total),
    unit: record?.unit ?? record?.unit_measure ?? fallbackUnit,
  }
}

function normalizeSummaryPayload(payload = {}) {
  const summary = firstObject(
    payload?.summary,
    payload?.current_summary,
    payload?.current,
    payload?.overview,
  )

  if (!summary || Object.keys(summary).length === 0) {
    return null
  }

  return {
    electric: normalizeSummaryBucket(summary?.electric ?? summary?.electricity, 'kWh'),
    water: normalizeSummaryBucket(summary?.water, 'm3'),
    thermal: normalizeSummaryBucket(summary?.thermal, 'kBTU'),
  }
}

function normalizeCombinedSeries(rows = [], labelKey) {
  return rows.map((row, index) => ({
    [labelKey]:
      row?.[labelKey] ??
      row?.label ??
      row?.time ??
      row?.day ??
      row?.month ??
      `Item ${index + 1}`,
    electric: toNumber(row?.electric ?? row?.electricity),
    water: toNumber(row?.water),
    thermal: toNumber(row?.thermal),
  }))
}

function buildSeriesMapRows(source = {}, labelKey, fallbackLabels = []) {
  const electricRows = firstArray(source?.electric, source?.electricity)
  const waterRows = firstArray(source?.water)
  const thermalRows = firstArray(source?.thermal)
  const maxLength = Math.max(electricRows.length, waterRows.length, thermalRows.length, fallbackLabels.length)

  return Array.from({ length: maxLength }).map((_, index) => ({
    [labelKey]:
      electricRows[index]?.[labelKey] ??
      electricRows[index]?.label ??
      waterRows[index]?.[labelKey] ??
      waterRows[index]?.label ??
      thermalRows[index]?.[labelKey] ??
      thermalRows[index]?.label ??
      fallbackLabels[index] ??
      `Item ${index + 1}`,
    electric: toNumber(electricRows[index]?.usage ?? electricRows[index]?.value ?? electricRows[index]?.total),
    water: toNumber(waterRows[index]?.usage ?? waterRows[index]?.value ?? waterRows[index]?.total),
    thermal: toNumber(thermalRows[index]?.usage ?? thermalRows[index]?.value ?? thermalRows[index]?.total),
  }))
}

function normalizeSeriesPayload(payload = {}, keys = [], labelKey, fallbackLabels = []) {
  const source = firstObject(...keys.map((key) => payload?.[key]))

  if (Array.isArray(source)) {
    return normalizeCombinedSeries(source, labelKey)
  }

  if (source && typeof source === 'object') {
    return buildSeriesMapRows(source, labelKey, fallbackLabels)
  }

  return []
}

function normalizeUnitsPayload(payload = {}) {
  return firstArray(payload?.units, payload?.available_units).map((unit) => ({
    id: unit?.id ?? null,
    unit_number: unit?.unit_number || unit?.name || unit?.unit || '',
  }))
}

function normalizeUnitPayload(payload = {}) {
  const unit = firstObject(payload?.unit, payload?.selected_unit)
  if (!unit || Object.keys(unit).length === 0) return null

  return {
    id: unit?.id ?? null,
    unit_number: unit?.unit_number || unit?.name || unit?.unit || '',
  }
}

export function useTenantUsageMonitoring() {
  const { user } = useAuth()
  const { bills, loading, error, refreshBills } = useBills()
  const [requestedUnit, setRequestedUnit] = useState('all')
  const [requestedTimeRange, setRequestedTimeRange] = useState('1m')
  const [monitoringLoading, setMonitoringLoading] = useState(true)
  const [monitoringError, setMonitoringError] = useState('')
  const [monitoringSummary, setMonitoringSummary] = useState(null)
  const [monitoringHourly, setMonitoringHourly] = useState([])
  const [monitoringDaily, setMonitoringDaily] = useState([])
  const [monitoringMonthly, setMonitoringMonthly] = useState([])
  const [monitoringUnit, setMonitoringUnit] = useState(null)
  const [monitoringUnits, setMonitoringUnits] = useState([])

  const tenantUnits = useMemo(() => getTenantUnits(user), [user])
  const selectedUnits = useMemo(
    () => getSelectedUnits(tenantUnits, requestedUnit),
    [requestedUnit, tenantUnits]
  )

  const filteredBills = useMemo(() => {
    const unitScopedBills = requestedUnit === 'all'
      ? bills
      : bills.filter((bill) => String(bill?.unit) === String(requestedUnit))

    return unitScopedBills.filter((bill) => {
      const billDate = getBillDate(bill)
      return billDate ? isDateWithinTenantTimeRange(billDate, requestedTimeRange) : false
    })
  }, [bills, requestedTimeRange, requestedUnit])

  const fallbackSummary = useMemo(() => buildSummaryFromBills(filteredBills), [filteredBills])
  const fallbackDaily = useMemo(() => buildWeekdayHistory(filteredBills), [filteredBills])
  const fallbackMonthly = useMemo(() => {
    if (requestedTimeRange === '7d') return buildWeekdayHistory(filteredBills)
    if (requestedTimeRange === '1m') return buildWeeklyHistory(filteredBills)
    return buildMonthlyHistory(filteredBills)
  }, [filteredBills, requestedTimeRange])

  const loadMonitoring = useCallback(async (unit = 'all', timeRange = '1m') => {
    try {
      setMonitoringLoading(true)
      setMonitoringError('')

      const response = await fetchTenantUsageMonitoring({ unit, timeRange })
      const payload = extractPayload(response)

      setMonitoringSummary(normalizeSummaryPayload(payload))
      setMonitoringHourly(
        normalizeSeriesPayload(payload, ['hourly', 'hourly_data', 'live_data', 'hourly_history'], 'time')
      )
      setMonitoringDaily(
        normalizeSeriesPayload(payload, ['daily', 'daily_data', 'daily_history'], 'day', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
      )
      setMonitoringMonthly(
        normalizeSeriesPayload(payload, ['monthly', 'monthly_data', 'monthly_overview'], 'month')
      )
      setMonitoringUnit(normalizeUnitPayload(payload))
      setMonitoringUnits(normalizeUnitsPayload(payload))
    } catch (err) {
      setMonitoringSummary(null)
      setMonitoringHourly([])
      setMonitoringDaily([])
      setMonitoringMonthly([])
      setMonitoringUnit(null)
      setMonitoringUnits([])
      setMonitoringError(err?.response?.data?.message || err?.message || 'Failed to load usage monitoring data.')
    } finally {
      setMonitoringLoading(false)
    }
  }, [])

  const summary = useMemo(() => monitoringSummary || fallbackSummary, [fallbackSummary, monitoringSummary])
  const daily = useMemo(() => (monitoringDaily.length > 0 ? monitoringDaily : fallbackDaily), [fallbackDaily, monitoringDaily])
  const monthly = useMemo(() => (monitoringMonthly.length > 0 ? monitoringMonthly : fallbackMonthly), [fallbackMonthly, monitoringMonthly])
  const hourly = useMemo(() => (monitoringHourly.length > 0 ? monitoringHourly : buildHourlyFallback(summary)), [monitoringHourly, summary])
  const resolvedUnit = useMemo(() => {
    if (monitoringUnit) return monitoringUnit
    if (requestedUnit === 'all' || selectedUnits.length !== 1) return null

    return {
      id: selectedUnits[0]?.id ?? null,
      unit_number: selectedUnits[0]?.unit_number || selectedUnits[0]?.name || '',
    }
  }, [monitoringUnit, requestedUnit, selectedUnits])

  const refreshUsage = useCallback(async (unit = 'all', timeRange = '1m') => {
    setRequestedUnit(unit || 'all')
    setRequestedTimeRange(timeRange || '1m')
    await Promise.all([
      refreshBills(),
      loadMonitoring(unit || 'all', timeRange || '1m'),
    ])
  }, [loadMonitoring, refreshBills])

  useEffect(() => {
    setRequestedUnit((prev) => prev || 'all')
  }, [])

  return {
    summary,
    unit: resolvedUnit,
    units: monitoringUnits.length > 0
      ? monitoringUnits
      : selectedUnits.map((unit) => ({
          id: unit?.id ?? null,
          unit_number: unit?.unit_number || unit?.name || '',
        })),
    hourly,
    daily,
    monthly,
    timeRange: requestedTimeRange,
    loading: loading || monitoringLoading,
    error: monitoringError || error,
    refreshUsage,
  }
}
