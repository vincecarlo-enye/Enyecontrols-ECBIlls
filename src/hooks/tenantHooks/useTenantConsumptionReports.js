import { normalizeTenantBill } from '@/utils/billing'
import { normalizeUtilityKey } from '@/utils/utilityTypes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { isDateWithinTenantTimeRange } from '@/context/UnitFilterContext'
import { getTenantConsumptionReports } from '@/services/tenantService/tenantConsumptionService'
import { fetchTenantBills } from '@/services/tenantService/tenantBillingService'

const TENANT_VISIBLE = ['published', 'submitted', 'paid', 'overdue']

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
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
      const type = normalizeUtilityKey(item?.type || item?.utility_type)
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
}

function getDailyData(bills) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayMap = new Map(
    dayLabels.map((label) => [label, {
      month: label,
      electricity: 0,
      water: 0,
      thermal: 0,
    }])
  )

  bills.forEach((bill) => {
    const date = getBillDate(bill)
    if (!date) return

    const dayLabel = dayLabels[(date.getDay() + 6) % 7]
    const bucket = dayMap.get(dayLabel)
    if (!bucket) return

    const items = bill?.raw?.items || bill?.raw?.bill_items || []
    items.forEach((item) => {
      const type = normalizeUtilityKey(item?.type || item?.utility_type)
      if (!type || (bucket[type] !== 0 && !bucket[type])) return
      bucket[type] += toNumber(item?.consumption ?? item?.quantity)
    })
  })

  return dayLabels.map((label) => ({
    ...dayMap.get(label),
    electricity: Number(dayMap.get(label).electricity.toFixed(2)),
    water: Number(dayMap.get(label).water.toFixed(2)),
    thermal: Number(dayMap.get(label).thermal.toFixed(2)),
  }))
}

function getWeeklyData(bills) {
  const rows = Array.from({ length: 4 }, (_, index) => ({
    month: `Week ${index + 1}`,
    electricity: 0,
    water: 0,
    thermal: 0,
  }))

  bills.forEach((bill) => {
    const date = getBillDate(bill)
    if (!date) return

    const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7))
    const bucket = rows[weekIndex]
    const items = bill?.raw?.items || bill?.raw?.bill_items || []

    items.forEach((item) => {
      const type = normalizeUtilityKey(item?.type || item?.utility_type)
      if (!type || (bucket[type] !== 0 && !bucket[type])) return
      bucket[type] += toNumber(item?.consumption ?? item?.quantity)
    })
  })

  return rows.map((row) => ({
    ...row,
    electricity: Number(row.electricity.toFixed(2)),
    water: Number(row.water.toFixed(2)),
    thermal: Number(row.thermal.toFixed(2)),
  }))
}

function getRangeData(bills, timeRange) {
  if (timeRange === '7d') return getDailyData(bills)
  if (timeRange === '1m') return getWeeklyData(bills)
  return getMonthlyData(bills)
}

export function useTenantConsumptionReports() {
  const { user } = useAuth()
  const [requestedUnit, setRequestedUnit] = useState('all')
  const [requestedTimeRange, setRequestedTimeRange] = useState('1m')
  const [fallbackBills, setFallbackBills] = useState([])
  const [billsLoading, setBillsLoading] = useState(true)
  const [billsError, setBillsError] = useState('')
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState('')
  const [reportSummary, setReportSummary] = useState(null)
  const [reportMonthly, setReportMonthly] = useState([])
  const [reportUnit, setReportUnit] = useState(null)
  const [reportUnits, setReportUnits] = useState([])
  const fallbackLoadedRef = useRef(false)
  const fallbackRequestRef = useRef(null)

  const tenantUnits = useMemo(() => getTenantUnits(user), [user])
  const selectedUnits = useMemo(
    () => getSelectedUnits(tenantUnits, requestedUnit),
    [requestedUnit, tenantUnits]
  )

  const loadFallbackBills = useCallback(async ({ force = false } = {}) => {
    if (fallbackLoadedRef.current && !force) return
    if (fallbackRequestRef.current && !force) return fallbackRequestRef.current

    const request = (async () => {
      setBillsLoading(true)
      setBillsError('')

      try {
        const res = await fetchTenantBills()
        const rows = Array.isArray(res?.data) ? res.data : []

        setFallbackBills(
          rows
            .map(normalizeTenantBill)
            .filter((bill) => TENANT_VISIBLE.includes(bill.status))
        )
        fallbackLoadedRef.current = true
      } catch (err) {
        setFallbackBills([])
        setBillsError(err?.response?.data?.message || 'Failed to load bills.')
      } finally {
        setBillsLoading(false)
        fallbackRequestRef.current = null
      }
    })()

    fallbackRequestRef.current = request
    return request
  }, [])

  useEffect(() => {
    loadFallbackBills()
  }, [loadFallbackBills])

  const filteredBills = useMemo(() => {
    const unitScopedBills = requestedUnit === 'all'
      ? fallbackBills
      : fallbackBills.filter((bill) => String(bill?.unit) === String(requestedUnit))

    return unitScopedBills.filter((bill) => {
      const billDate = getBillDate(bill)
      return billDate ? isDateWithinTenantTimeRange(billDate, requestedTimeRange) : false
    })
  }, [fallbackBills, requestedTimeRange, requestedUnit])

  const monthly = useMemo(() => getRangeData(filteredBills, requestedTimeRange), [filteredBills, requestedTimeRange])

  const fallbackSummary = useMemo(() => ({
    electricity: Number(monthly.reduce((sum, row) => sum + toNumber(row.electricity), 0).toFixed(2)),
    water: Number(monthly.reduce((sum, row) => sum + toNumber(row.water), 0).toFixed(2)),
    thermal: Number(monthly.reduce((sum, row) => sum + toNumber(row.thermal), 0).toFixed(2)),
  }), [monthly])

  const loadReports = useCallback(async (unit = 'all', timeRange = '1m') => {
    try {
      setReportLoading(true)
      setReportError('')

      const data = await getTenantConsumptionReports({ unit, timeRange })
      setReportUnit(data?.unit || null)
      setReportUnits(Array.isArray(data?.units) ? data.units : [])
      setReportSummary(data?.summary && typeof data.summary === 'object' ? {
        electricity: toNumber(data.summary.electricity),
        water: toNumber(data.summary.water),
        thermal: toNumber(data.summary.thermal),
      } : null)
      setReportMonthly(
        Array.isArray(data?.monthly)
          ? data.monthly.map((row) => ({
              month: row?.month || '',
              electricity: toNumber(row?.electricity),
              water: toNumber(row?.water),
              thermal: toNumber(row?.thermal),
            }))
          : []
      )
    } catch (err) {
      setReportUnit(null)
      setReportUnits([])
      setReportSummary(null)
      setReportMonthly([])
      setReportError(err?.response?.data?.message || err?.message || 'Failed to load consumption reports.')
    } finally {
      setReportLoading(false)
    }
  }, [])

  const summary = useMemo(() => reportSummary || fallbackSummary, [fallbackSummary, reportSummary])
  const resolvedMonthly = useMemo(() => (reportMonthly.length > 0 ? reportMonthly : monthly), [monthly, reportMonthly])
  const backendDriven = reportMonthly.length > 0 || reportSummary !== null

  const reload = useCallback(async (unit = 'all', timeRange = '1m') => {
    setRequestedUnit(unit || 'all')
    setRequestedTimeRange(timeRange || '1m')

    await Promise.all([
      loadReports(unit || 'all', timeRange || '1m'),
      loadFallbackBills(),
    ])
  }, [loadFallbackBills, loadReports])

  const loading = reportLoading || (!backendDriven && billsLoading)
  const error = reportError || (!backendDriven ? billsError : '')

  return {
    unit: reportUnit || (
      requestedUnit === 'all' || selectedUnits.length !== 1
        ? null
        : {
            id: selectedUnits[0]?.id ?? null,
            unit_number: selectedUnits[0]?.unit_number || selectedUnits[0]?.name || '',
          }
    ),
    units: reportUnits.length > 0
      ? reportUnits
      : selectedUnits.map((unit) => ({
          id: unit?.id ?? null,
          unit_number: unit?.unit_number || unit?.name || '',
        })),
    summary,
    monthly: resolvedMonthly,
    timeRange: requestedTimeRange,
    backendDriven,
    loading,
    error,
    reload,
  }
}
