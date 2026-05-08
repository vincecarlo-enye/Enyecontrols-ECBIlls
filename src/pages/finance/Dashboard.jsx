import { formatDate } from '@/utils/filterUtils'
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, CreditCard, FileText, CheckCircle2, Clock, Zap, Droplets, Flame,
  BarChart3, PieChart as PieIcon, Activity,
} from 'lucide-react'
import ChartCard from '@/components/ui/ChartCard'
import UtilityCard from '@/components/common/UtilityCard'
import FilterPills from '@/components/common/FilterPills'
import AnnouncementPanel from '@/components/common/AnnouncementPanel'
import SummaryCardStrip from '@/components/dashboard/SummaryCardStrip'
import PageSection, { PageHeader } from '@/components/layout/PageSection'
import { usePageLoader } from '@/hooks/usePageLoader'
import { buildUtilityCardMetric } from '@/utils/utilityCards'
import { buildUtilityComparisonRows, computeUsageTrend } from '@/utils/dashboardCharts'
import { fetchFinanceBills, fetchFinancePayments, fetchSharedRates, getFinanceBillsSnapshot, getFinancePaymentsSnapshot, getSharedRatesSnapshot } from '@/services/financeService/financeBillService'
import { useFinanceUtilityDashboard } from '@/hooks/financeHooks/useFinanceUtilityDashboard'
import {
  CHART_AXIS_TICK,
  CHART_AXIS_TICK_SM,
  CHART_GRID_PROPS_LIGHT,
  CHART_MARGIN_STANDARD,
  ThemedChartTooltip,
  formatChartCurrency,
  formatCompactChartCurrency,
  formatChartNumber,
} from '@/components/charts/rechartsTheme.jsx'
import { ChartLoadingState, TableLoadingRow, UpdatingBadge } from '@/components/common/InlineLoadingState'

const fmt = (n) => `PHP ${Number(n || 0).toLocaleString()}`
const FINANCE_FILTER_OPTIONS = ['7D', '1M', '1Y']

function formatMonthKey(value) {
  if (!value) return 'Unknown'
  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  return String(value)
}

function formatDayKey(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return String(value)
}

function formatWeekdayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function parseDateValue(value) {
  if (!value) return null
  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct
  const fallback = new Date(String(value).replace(/-/g, '/'))
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function getRangeTimestamp(value) {
  const date = parseDateValue(value)
  return date ? date.getTime() : 0
}

function isDateInDashboardRange(value, range) {
  const date = parseDateValue(value)
  if (!date) return false

  const today = new Date()

  if (range === '7D') {
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 6)
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)
    return date >= start && date <= end
  }

  if (range === '1M') {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
  }

  const start = new Date(today.getFullYear(), today.getMonth() - 6, 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
  return date >= start && date <= end
}

function formatYearKey(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { year: 'numeric' })
  }
  const match = String(value).match(/\d{4}/)
  return match ? match[0] : String(value)
}


function getMonthTimestamp(value) {
  if (!value) return 0
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.getTime()
  }
  const parsed = new Date(`${value} 1`)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function buildRollingMonthlySeries(rows = [], length = 12, defaults = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    const today = new Date()
    return Array.from({ length }, (_, index) => {
      const date = addMonths(today, index - (length - 1))
      return { month: formatMonthLabel(date), ...defaults }
    })
  }

  const sortedRows = rows
    .slice()
    .sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))

  const latestDate = new Date()

  if (Number.isNaN(latestDate.getTime())) {
    return sortedRows.slice(-length)
  }

  const valueByMonth = new Map(
    sortedRows.map((row) => [formatMonthLabel(new Date(getMonthTimestamp(row.month))), row])
  )

  return Array.from({ length }, (_, index) => {
    const date = addMonths(latestDate, index - (length - 1))
    const month = formatMonthLabel(date)
    return {
      month,
      ...defaults,
      ...(valueByMonth.get(month) || {}),
    }
  })
}

function buildRollingDailySeries(rows = [], length = 7, defaults = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    const today = new Date()
    return Array.from({ length }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() + index - (length - 1))
      return { month: formatWeekdayLabel(date), ...defaults }
    })
  }

  const sortedRows = rows
    .slice()
    .sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))

  const latestDate = new Date()

  if (Number.isNaN(latestDate.getTime())) {
    return sortedRows.slice(-length)
  }

  const valueByDay = new Map(
    sortedRows.map((row) => [formatDayKey(row.month), row])
  )

  return Array.from({ length }, (_, index) => {
    const date = new Date(latestDate)
    date.setDate(latestDate.getDate() + index - (length - 1))
    const dayKey = formatDayKey(date)
    return {
      month: formatWeekdayLabel(date),
      ...defaults,
      ...(valueByDay.get(dayKey) || {}),
      monthLabel: dayKey,
    }
  }).map((row) => ({
    ...row,
    month: row.month,
  }))
}

function getCurrentMonthMatch(row = {}, now = new Date()) {
  const raw = String(row?.month || row?.label || row?.date || '').trim()
  if (!raw) return false

  const shortMonth = now.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
  const longMonth = now.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
  const numericMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lower = raw.toLowerCase()

  return (
    lower === shortMonth ||
    lower === longMonth ||
    lower === numericMonth ||
    lower === `${shortMonth} ${now.getFullYear()}` ||
    lower.includes(shortMonth) ||
    lower.includes(longMonth)
  )
}

function buildCurrentMonthWeekSeries(rows = [], defaults = {}) {
  const now = new Date()
  const buckets = Array.from({ length: 4 }, (_, index) => ({
    month: `W${index + 1}`,
    ...defaults,
  }))

  ;(Array.isArray(rows) ? rows : []).forEach((row) => {
    const date = parseDateValue(row?.dateValue || row?.date || row?.rawDate || row?.month)
    if (!date) {
      if (!getCurrentMonthMatch(row, now)) return
      const weekIndex = Math.min(3, Math.floor((now.getDate() - 1) / 7))
      Object.keys(defaults).forEach((key) => {
        buckets[weekIndex][key] += Number(row?.[key] || 0)
      })
      return
    }
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return
    const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7))
    Object.keys(defaults).forEach((key) => {
      buckets[weekIndex][key] += Number(row?.[key] || 0)
    })
  })

  return buckets
}

function buildFinanceUtilityComparisonRows(filter, source = {}) {
  const sharedRows = buildUtilityComparisonRows(
    filter,
    source.electric || [],
    source.water || [],
    source.thermal || [],
  )

  const byDate = new Map()
  const addSeries = (rows = [], key) => {
    rows.forEach((row) => {
      const date = parseDateValue(row?.date || row?.day || row?.label)
      if (!date) return
      const dateKey = getDateKey(date)
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, {
          date,
          electricity: 0,
          water: 0,
          thermal: 0,
        })
      }
      byDate.get(dateKey)[key] += Number(row?.usage ?? row?.value ?? 0)
    })
  }

  addSeries(source.electric, 'electricity')
  addSeries(source.water, 'water')
  addSeries(source.thermal, 'thermal')

  if (filter === '7D') {
    const today = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() + index - 6)
      const row = byDate.get(getDateKey(date))
      const fallback = byDate.size > 0 ? null : sharedRows[index]
      return {
        label: formatWeekdayLabel(date),
        electricity: row?.electricity ?? Number(fallback?.electricity || 0),
        water: row?.water ?? Number(fallback?.water || 0),
        thermal: row?.thermal ?? Number(fallback?.thermal || 0),
      }
    })
  }

  if (filter === '1M') {
    const today = new Date()
    const buckets = Array.from({ length: 4 }, (_, index) => ({
      label: `W${index + 1}`,
      electricity: 0,
      water: 0,
      thermal: 0,
    }))

    if (byDate.size > 0) {
      byDate.forEach((row) => {
        if (row.date.getMonth() !== today.getMonth() || row.date.getFullYear() !== today.getFullYear()) return
        const weekIndex = Math.min(3, Math.floor((row.date.getDate() - 1) / 7))
        buckets[weekIndex].electricity += row.electricity
        buckets[weekIndex].water += row.water
        buckets[weekIndex].thermal += row.thermal
      })
      return buckets
    }

    return buckets.map((bucket, index) => ({
      ...bucket,
      electricity: Number(sharedRows[index]?.electricity || 0),
      water: Number(sharedRows[index]?.water || 0),
      thermal: Number(sharedRows[index]?.thermal || 0),
    }))
  }

  const today = new Date()
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() + index - 6, 1)
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      electricity: 0,
      water: 0,
      thermal: 0,
    }
  })

  if (byDate.size > 0) {
    byDate.forEach((row) => {
      const bucket = buckets.find((item) => item.year === row.date.getFullYear() && item.month === row.date.getMonth())
      if (!bucket) return
      bucket.electricity += row.electricity
      bucket.water += row.water
      bucket.thermal += row.thermal
    })
    return buckets.map(({ label, electricity, water, thermal }) => ({ label, electricity, water, thermal }))
  }

  const fallbackRows = sharedRows.slice(-7)
  return buckets.map((bucket, index) => ({
    label: bucket.label,
    electricity: Number(fallbackRows[index]?.electricity || 0),
    water: Number(fallbackRows[index]?.water || 0),
    thermal: Number(fallbackRows[index]?.thermal || 0),
  }))
}

function computeRangeTrend(rows = [], key) {
  if (!Array.isArray(rows) || rows.length < 2) return 0
  const last = Number(rows[rows.length - 1]?.[key] ?? 0)
  const prev = Number(rows[rows.length - 2]?.[key] ?? 0)
  if (prev === 0) {
    if (last === 0) return 0
    return 100
  }
  return Number((((last - prev) / prev) * 100).toFixed(1))
}

function buildActiveKeySet(rows = [], key = 'month') {
  return new Set(
    (Array.isArray(rows) ? rows : [])
      .map((row) => String(row?.[key] ?? '').trim())
      .filter(Boolean)
  )
}

function normalizeBill(row = {}) {
  const items = Array.isArray(row?.items) ? row.items : []
  const breakdown = { electricity: 0, water: 0, thermal: 0 }
  const dateValue = row?.billing_end || row?.due_date || row?.created_at || ''
  items.forEach((item) => {
    const type = String(item?.type || '').toLowerCase()
    const amount = Number(item?.amount ?? 0)
    if (type === 'electric' || type === 'electricity') breakdown.electricity += amount
    if (type === 'water') breakdown.water += amount
    if (type === 'thermal') breakdown.thermal += amount
  })

  return {
    id: String(row?.id ?? ''),
    tenant: row?.tenant?.name || 'Unknown Tenant',
    unit: row?.unit?.unit_number || row?.unit?.name || 'N/A',
    amount: Number(row?.amount ?? 0),
    status: String(row?.status || 'draft').toLowerCase(),
    dateValue,
    dayKey: formatDayKey(dateValue),
    monthKey: formatMonthKey(row?.billing_month || row?.billing_end || row?.created_at || ''),
    yearKey: formatYearKey(dateValue),
    dueDate: formatDate(row?.due_date || ''),
    breakdown,
  }
}

function normalizePayment(row = {}) {
  const bill = row?.bill || {}
  const breakdown = normalizeBill(bill).breakdown
  const dateValue = row?.paid_at || row?.verified_at || row?.created_at || ''
  return {
    id: row?.id,
    invoiceId: String(bill?.id ?? row?.bill_id ?? ''),
    tenant: row?.tenant?.name || bill?.tenant?.name || 'Unknown Tenant',
    unit: bill?.unit?.unit_number || bill?.unit?.name || 'N/A',
    amount: Number(row?.amount ?? 0),
    status: String(row?.status || 'pending').toLowerCase(),
    date: formatDate(dateValue),
    dateValue,
    dayKey: formatDayKey(dateValue),
    monthKey: formatMonthKey(bill?.billing_month || row?.created_at || ''),
    yearKey: formatYearKey(dateValue),
    breakdown,
  }
}

export default function FinanceDashboard() {
  const pageLoading = usePageLoader(800)
  const initialBillsSnapshot = getFinanceBillsSnapshot()
  const initialPaymentsSnapshot = getFinancePaymentsSnapshot()
  const initialRatesSnapshot = getSharedRatesSnapshot()
  const initialBills = (Array.isArray(initialBillsSnapshot?.data) ? initialBillsSnapshot.data : []).map(normalizeBill)
  const initialPayments = (Array.isArray(initialPaymentsSnapshot?.data) ? initialPaymentsSnapshot.data : []).map(normalizePayment)
  const initialBillingRates = {
    electricity: { rate: 0, unit: '/kWh', completeness: 0 },
    water: { rate: 0, unit: '/m3', completeness: 0 },
    thermal: { rate: 0, unit: '/kBTU', completeness: 0 },
  }

  ;(Array.isArray(initialRatesSnapshot) ? initialRatesSnapshot : initialRatesSnapshot?.data || []).forEach((rate) => {
    const type = String(rate?.type || '').toLowerCase()
    const mappedType = type === 'electric' ? 'electricity' : type
    if (!initialBillingRates[mappedType]) return
    initialBillingRates[mappedType] = {
      rate: Number(rate?.price_per_unit ?? 0),
      unit: mappedType === 'thermal' ? '/kBTU' : `/${rate?.unit_measure || initialBillingRates[mappedType].unit.replace(/^\//, '')}`,
      completeness: Number(rate?.price_per_unit ?? 0) > 0 ? 100 : 0,
    }
  })

  const [bills, setBills] = useState(initialBills)
  const [payments, setPayments] = useState(initialPayments)
  const [billingRates, setBillingRates] = useState(initialBillingRates)
  const [loading, setLoading] = useState(!(initialBills.length || initialPayments.length))
  const [error, setError] = useState('')
  const [chartRange, setChartRange] = useState('7D')
  const utilityComparisonFilter = chartRange
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionStatus, setTransactionStatus] = useState('all')

  // Real meter consumption data — mirrors Super Admin / Admin / Facility pattern
  const {
    summary: utilitySummary,
    daily: utilityDaily,
    comparison: utilityComparison,
    loading: utilityLoading,
    comparisonLoadingRanges: utilityComparisonLoadingRanges,
    ensureComparisonRange,
  } = useFinanceUtilityDashboard()

  useEffect(() => {
    let cancelled = false

    fetchSharedRates()
      .then((ratesRes) => {
        if (cancelled) return
        const rows = Array.isArray(ratesRes) ? ratesRes : ratesRes?.data || []
        const nextRates = {
          electricity: { rate: 0, unit: '/kWh', completeness: 0 },
          water: { rate: 0, unit: '/m3', completeness: 0 },
          thermal: { rate: 0, unit: '/kBTU', completeness: 0 },
        }

        rows.forEach((rate) => {
          const type = String(rate?.type || '').toLowerCase()
          const mappedType = type === 'electric' ? 'electricity' : type
          if (!nextRates[mappedType]) return
          nextRates[mappedType] = {
            rate: Number(rate?.price_per_unit ?? 0),
            unit: mappedType === 'thermal' ? '/kBTU' : `/${rate?.unit_measure || nextRates[mappedType].unit.replace(/^\//, '')}`,
            completeness: Number(rate?.price_per_unit ?? 0) > 0 ? 100 : 0,
          }
        })

        setBillingRates(nextRates)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [billsRes, paymentsRes] = await Promise.all([
          fetchFinanceBills(),
          fetchFinancePayments(),
        ])
        setBills((Array.isArray(billsRes?.data) ? billsRes.data : []).map(normalizeBill))
        setPayments((Array.isArray(paymentsRes?.data) ? paymentsRes.data : []).map(normalizePayment))
      } catch (err) {
        setBills([])
        setPayments([])
        setError(err?.response?.data?.message || 'Failed to load finance dashboard.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const {
    dailyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    dailyUtilityRevenue,
    utilityRevenue,
    yearlyUtilityRevenue,
    utilityPie,
    utilityMeters,
    summaryCards,
    totalElec,
    totalWater,
    totalThermal,
    recentTransactions,
  } = useMemo(() => {
    const dailyRevenueMap = new Map()
    const monthlyRevenueMap = new Map()
    const yearlyRevenueMap = new Map()
    const dailyUtilityRevenueMap = new Map()
    const utilityRevenueMap = new Map()
    const yearlyUtilityRevenueMap = new Map()
    const dailyCollectionMap = new Map()
    const monthlyCollectionMap = new Map()
    const yearlyCollectionMap = new Map()

    for (const bill of bills) {
      const dayKey = bill.dayKey
      const monthKey = bill.monthKey
      const yearKey = bill.yearKey

      if (!dailyRevenueMap.has(dayKey)) {
        dailyRevenueMap.set(dayKey, { month: dayKey, dateValue: bill.dateValue, revenue: 0, expenses: 0 })
      }
      if (!monthlyRevenueMap.has(monthKey)) {
        monthlyRevenueMap.set(monthKey, { month: monthKey, revenue: 0, expenses: 0 })
      }
      if (!yearlyRevenueMap.has(yearKey)) {
        yearlyRevenueMap.set(yearKey, { month: yearKey, revenue: 0, expenses: 0 })
      }
      if (!dailyUtilityRevenueMap.has(dayKey)) {
        dailyUtilityRevenueMap.set(dayKey, { month: dayKey, dateValue: bill.dateValue, electricity: 0, water: 0, thermal: 0 })
      }
      if (!utilityRevenueMap.has(monthKey)) {
        utilityRevenueMap.set(monthKey, { month: monthKey, electricity: 0, water: 0, thermal: 0 })
      }
      if (!yearlyUtilityRevenueMap.has(yearKey)) {
        yearlyUtilityRevenueMap.set(yearKey, { month: yearKey, electricity: 0, water: 0, thermal: 0 })
      }

      dailyRevenueMap.get(dayKey).revenue += bill.amount
      monthlyRevenueMap.get(monthKey).revenue += bill.amount
      yearlyRevenueMap.get(yearKey).revenue += bill.amount

      const dailyUtilityRow = dailyUtilityRevenueMap.get(dayKey)
      const utilityRow = utilityRevenueMap.get(monthKey)
      const yearlyUtilityRow = yearlyUtilityRevenueMap.get(yearKey)
      dailyUtilityRow.electricity += bill.breakdown.electricity
      dailyUtilityRow.water += bill.breakdown.water
      dailyUtilityRow.thermal += bill.breakdown.thermal
      utilityRow.electricity += bill.breakdown.electricity
      utilityRow.water += bill.breakdown.water
      utilityRow.thermal += bill.breakdown.thermal
      yearlyUtilityRow.electricity += bill.breakdown.electricity
      yearlyUtilityRow.water += bill.breakdown.water
      yearlyUtilityRow.thermal += bill.breakdown.thermal
    }

    for (const payment of payments) {
      if (payment.status !== 'verified') continue

      const dayKey = payment.dayKey
      const monthKey = payment.monthKey
      const yearKey = payment.yearKey

      dailyCollectionMap.set(dayKey, (dailyCollectionMap.get(dayKey) || 0) + payment.amount)
      monthlyCollectionMap.set(monthKey, (monthlyCollectionMap.get(monthKey) || 0) + payment.amount)
      yearlyCollectionMap.set(yearKey, (yearlyCollectionMap.get(yearKey) || 0) + payment.amount)
    }

    const buildRevenueSeries = (revenueMap, collectionMap) => {
      const keys = new Set([...revenueMap.keys(), ...collectionMap.keys()])

      return Array.from(keys)
        .map((key) => {
          const revenue = Number(revenueMap.get(key)?.revenue ?? 0)
          const collected = Number(collectionMap.get(key) ?? 0)

          return {
            month: key,
            dateValue: revenueMap.get(key)?.dateValue || key,
            revenue,
            collected,
            outstanding: Math.max(revenue - collected, 0),
          }
        })
        .sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))
    }

    const dailyRevenue = buildRevenueSeries(dailyRevenueMap, dailyCollectionMap)
    const monthlyRevenue = buildRevenueSeries(monthlyRevenueMap, monthlyCollectionMap)
    const yearlyRevenue = buildRevenueSeries(yearlyRevenueMap, yearlyCollectionMap)
    const dailyUtilityRevenue = Array.from(dailyUtilityRevenueMap.values()).sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))
    const utilityRevenue = Array.from(utilityRevenueMap.values()).sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))
    const yearlyUtilityRevenue = Array.from(yearlyUtilityRevenueMap.values()).sort((a, b) => getMonthTimestamp(a.month) - getMonthTimestamp(b.month))
    const totalElec = utilityRevenue.reduce((sum, row) => sum + row.electricity, 0)
    const totalWater = utilityRevenue.reduce((sum, row) => sum + row.water, 0)
    const totalThermal = utilityRevenue.reduce((sum, row) => sum + row.thermal, 0)
    const utilityTotal = totalElec + totalWater + totalThermal
    const utilityPie = [
      { name: 'Electricity', value: utilityTotal ? Math.round((totalElec / utilityTotal) * 100) : 0, color: '#f59e0b' },
      { name: 'Water', value: utilityTotal ? Math.round((totalWater / utilityTotal) * 100) : 0, color: '#06b6d4' },
      { name: 'Thermal', value: utilityTotal ? Math.round((totalThermal / utilityTotal) * 100) : 0, color: '#f43f5e' },
    ]
    const utilityMeters = {
      electric: buildUtilityCardMetric({ type: 'electricity', usage: totalElec, unit: 'kWh', fallbackEstimatedCost: totalElec, trend: computeRangeTrend(utilityRevenue, 'electricity'), rates: billingRates }),
      water: buildUtilityCardMetric({ type: 'water', usage: totalWater, unit: 'm3', fallbackEstimatedCost: totalWater, trend: computeRangeTrend(utilityRevenue, 'water'), rates: billingRates }),
      thermal: buildUtilityCardMetric({ type: 'thermal', usage: totalThermal, unit: 'kBTU', fallbackEstimatedCost: totalThermal, trend: computeRangeTrend(utilityRevenue, 'thermal'), rates: billingRates }),
    }

    const totalRevenue = bills.reduce((sum, bill) => sum + bill.amount, 0)
    const pendingPayments = payments.filter((payment) => payment.status === 'pending')
    const verifiedPayments = payments.filter((payment) => payment.status === 'verified')
    const paidBills = bills.filter((bill) => bill.status === 'paid')
    const totalCollected = verifiedPayments.reduce((sum, payment) => sum + payment.amount, 0)

    const recentTransactions = payments
      .slice()
      .sort((a, b) => getRangeTimestamp(b.dateValue) - getRangeTimestamp(a.dateValue))
      .slice(0, 8)
      .map((payment) => {
        const activeUtilities = Object.entries(payment.breakdown || {})
          .filter(([, value]) => Number(value || 0) > 0)
          .map(([key]) => key)

        let utility = 'No Utility Data'

        if (activeUtilities.length === 1) {
          utility = activeUtilities[0] === 'water'
            ? 'Water'
            : activeUtilities[0] === 'thermal'
              ? 'Thermal'
              : 'Electricity'
        } else if (activeUtilities.length > 1) {
          utility = 'Mixed Utilities'
        }

        return {
          id: payment.invoiceId,
          tenant: payment.tenant,
          unit: payment.unit,
          utility,
          amount: payment.amount,
          status: payment.status === 'verified' ? 'Paid' : payment.status === 'rejected' ? 'Rejected' : 'Pending',
          date: payment.date,
          dateValue: payment.dateValue,
          dayKey: payment.dayKey,
          monthKey: payment.monthKey,
          yearKey: payment.yearKey,
        }
      })

    const summaryCards = [
      {
        label: 'Total Revenue',
        value: fmt(totalRevenue),
        icon: DollarSign,
        gradient: 'from-blue-500 to-indigo-600',
        shadow: 'shadow-blue-500/25',
        trend: `${bills.length} bills`,
        trendUp: true,
        sub: 'All generated bills',
      },
      {
        label: 'Utility Revenue',
        value: fmt(utilityTotal),
        icon: Zap,
        gradient: 'from-amber-500 to-orange-500',
        shadow: 'shadow-amber-500/25',
        trend: `${utilityPie[0].value}% electricity share`,
        trendUp: true,
        sub: 'Elec + Water + Thermal',
      },
      {
        label: 'Pending Payments',
        value: fmt(pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)),
        icon: Clock,
        gradient: 'from-amber-400 to-yellow-500',
        shadow: 'shadow-yellow-500/25',
        trend: `${pendingPayments.length} open receipts`,
        trendUp: true,
        sub: 'Requires follow-up',
      },
      {
        label: 'Paid Bills',
        value: fmt(totalCollected),
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-teal-500',
        shadow: 'shadow-emerald-500/25',
        trend: `${paidBills.length} completed`,
        trendUp: false,
        sub: 'Collected payments',
      },
      {
        label: 'Total Bills Generated',
        value: bills.length.toLocaleString(),
        icon: FileText,
        gradient: 'from-violet-500 to-purple-600',
        shadow: 'shadow-violet-500/25',
        trend: `${verifiedPayments.length} verified payments`,
        trendUp: true,
        sub: 'Across all tenants',
      },
    ]

    return {
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      dailyUtilityRevenue,
      utilityRevenue,
      yearlyUtilityRevenue,
      utilityPie,
      utilityMeters,
      summaryCards,
      totalElec,
      totalWater,
      totalThermal,
      recentTransactions,
    }
  }, [billingRates, bills, payments])

  const rangedMonthlyRevenue = useMemo(() => {
    if (chartRange === '7D') {
      return buildRollingDailySeries(dailyRevenue, 7, {
        revenue: 0,
        collected: 0,
        outstanding: 0,
      })
    }
    if (chartRange === '1Y') {
      return buildRollingMonthlySeries(monthlyRevenue, 7, {
        revenue: 0,
        collected: 0,
        outstanding: 0,
      })
    }
    return buildCurrentMonthWeekSeries(dailyRevenue, {
      revenue: 0,
      collected: 0,
      outstanding: 0,
    })
  }, [chartRange, dailyRevenue, monthlyRevenue])

  const rangedUtilityRevenue = useMemo(() => {
    if (chartRange === '7D') {
      return buildRollingDailySeries(dailyUtilityRevenue, 7, {
        electricity: 0,
        water: 0,
        thermal: 0,
      })
    }
    if (chartRange === '1Y') {
      return buildRollingMonthlySeries(utilityRevenue, 7, {
        electricity: 0,
        water: 0,
        thermal: 0,
      })
    }
    return buildCurrentMonthWeekSeries(dailyUtilityRevenue, {
      electricity: 0,
      water: 0,
      thermal: 0,
    })
  }, [chartRange, dailyUtilityRevenue, utilityRevenue])

  const rangedUtilityPie = useMemo(() => {
    const totals = rangedUtilityRevenue.reduce((acc, row) => ({
      electricity: acc.electricity + Number(row.electricity || 0),
      water: acc.water + Number(row.water || 0),
      thermal: acc.thermal + Number(row.thermal || 0),
    }), { electricity: 0, water: 0, thermal: 0 })
    const total = totals.electricity + totals.water + totals.thermal

    return [
      { name: 'Electricity', value: total ? Math.round((totals.electricity / total) * 100) : 0, color: '#f59e0b' },
      { name: 'Water', value: total ? Math.round((totals.water / total) * 100) : 0, color: '#06b6d4' },
      { name: 'Thermal', value: total ? Math.round((totals.thermal / total) * 100) : 0, color: '#f43f5e' },
    ]
  }, [rangedUtilityRevenue])

  // Utility meter cards — built from real meter readings (same source as Admin/SuperAdmin/Facility)
  // normalizeSeries() produces { day, date, usage } — UtilityCard expects { label, value }
  const utilityComparisonRows = useMemo(() => {
    const activeSeries = (utilityComparison?.[utilityComparisonFilter] && (
      (utilityComparison[utilityComparisonFilter].electric || []).length > 0 ||
      (utilityComparison[utilityComparisonFilter].water || []).length > 0 ||
      (utilityComparison[utilityComparisonFilter].thermal || []).length > 0
    ))
      ? utilityComparison[utilityComparisonFilter]
      : { electric: utilityDaily.electric, water: utilityDaily.water, thermal: utilityDaily.thermal }

    return buildFinanceUtilityComparisonRows(utilityComparisonFilter, activeSeries)
  }, [utilityComparison, utilityComparisonFilter, utilityDaily])

  const filteredUtilityCards = useMemo(() => {
    const buildCard = (summaryKey, rateKey, rowKey) => {
      const cardSummary = utilitySummary?.[summaryKey] || {}
      const values = utilityComparisonRows.map((row) => ({
        label: row.label,
        value: Number(row?.[rowKey] || 0),
      }))
      const seriesTotal = values.reduce((sum, row) => sum + row.value, 0)

      return buildUtilityCardMetric({
        type: rateKey,
        usage: seriesTotal > 0 ? seriesTotal : Number(cardSummary.periodConsumption ?? cardSummary.usage ?? cardSummary.value ?? 0),
        unit: cardSummary.unit || (summaryKey === 'electric' ? 'kWh' : summaryKey === 'thermal' ? 'kBTU' : 'm3'),
        fallbackEstimatedCost: Number(cardSummary.estimatedCost ?? cardSummary.cost ?? 0),
        trend: seriesTotal > 0 ? computeUsageTrend(values) : Number(cardSummary.trend ?? cardSummary.delta ?? 0),
        rates: billingRates,
        series: values,
      })
    }

    return {
      electric: buildCard('electric', 'electricity', 'electricity'),
      water: buildCard('water', 'water', 'water'),
      thermal: buildCard('thermal', 'thermal', 'thermal'),
    }
  }, [billingRates, utilityComparisonRows, utilitySummary])

  const revenueTrendMeta = useMemo(() => {
    const totals = rangedMonthlyRevenue.reduce((acc, row) => ({
      revenue: acc.revenue + Number(row.revenue || 0),
      collected: acc.collected + Number(row.collected || 0),
      outstanding: acc.outstanding + Number(row.outstanding || 0),
    }), { revenue: 0, collected: 0, outstanding: 0 })
    const target = rangedMonthlyRevenue.length > 0 ? totals.revenue / rangedMonthlyRevenue.length : 0
    const collectionRate = totals.revenue > 0
      ? Number(((totals.collected / totals.revenue) * 100).toFixed(1))
      : 0

    return {
      ...totals,
      target,
      collectionRate,
      billedTrend: computeRangeTrend(rangedMonthlyRevenue, 'revenue'),
      collectedTrend: computeRangeTrend(rangedMonthlyRevenue, 'collected'),
      outstandingTrend: computeRangeTrend(rangedMonthlyRevenue, 'outstanding'),
    }
  }, [rangedMonthlyRevenue])

  const scopedBills = useMemo(() => {
    return bills.filter((bill) => isDateInDashboardRange(bill.dateValue, chartRange))
  }, [bills, chartRange])

  const scopedPayments = useMemo(() => {
    return payments.filter((payment) => isDateInDashboardRange(payment.dateValue, chartRange))
  }, [chartRange, payments])

  const filteredTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase()

    return recentTransactions.filter((row) => {
      const matchesStatus = transactionStatus === 'all' || row.status.toLowerCase() === transactionStatus
      const matchesRange = isDateInDashboardRange(row.dateValue, chartRange)
      const haystack = [row.id, row.tenant, row.unit, row.utility, row.date]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesSearch = !query || haystack.includes(query)

      return matchesStatus && matchesRange && matchesSearch
    })
  }, [chartRange, recentTransactions, transactionSearch, transactionStatus])

  const billingStatusData = useMemo(() => {
    const counts = scopedBills.reduce((acc, bill) => {
      const status = String(bill?.status || '').toLowerCase()
      if (status === 'paid') acc.paid += 1
      else if (status === 'partial') acc.partial += 1
      else if (status === 'payment_submitted' || status === 'submitted') acc.submitted += 1
      else if (status === 'overdue') acc.overdue += 1
      else if (['published', 'unpaid', 'pending', 'draft'].includes(status)) acc.open += 1
      return acc
    }, {
      paid: 0,
      partial: 0,
      submitted: 0,
      overdue: 0,
      open: 0,
    })

    return [
      { name: 'Paid', value: counts.paid, color: '#10b981' },
      { name: 'Partial', value: counts.partial, color: '#3b82f6' },
      { name: 'Submitted', value: counts.submitted, color: '#f59e0b' },
      { name: 'Overdue', value: counts.overdue, color: '#f43f5e' },
      { name: 'Open', value: counts.open, color: '#8b5cf6' },
    ]
  }, [scopedBills])

  const paymentReviewStatusData = useMemo(() => {
    const counts = scopedPayments.reduce((acc, payment) => {
      const status = String(payment?.status || '').toLowerCase()
      if (status === 'verified') acc.verified += 1
      else if (status === 'rejected') acc.rejected += 1
      else acc.pending += 1
      return acc
    }, {
      pending: 0,
      verified: 0,
      rejected: 0,
    })

    return [
      { name: 'Pending', value: counts.pending, color: '#f59e0b' },
      { name: 'Verified', value: counts.verified, color: '#10b981' },
      { name: 'Rejected', value: counts.rejected, color: '#ef4444' },
    ]
  }, [scopedPayments])

  // Ensure the right comparison range is loaded when the filter changes
  useEffect(() => {
    ensureComparisonRange(utilityComparisonFilter)
  }, [utilityComparisonFilter, ensureComparisonRange])

  const loadingState = (pageLoading && bills.length === 0 && payments.length === 0) || (loading && bills.length === 0 && payments.length === 0 && !error)
  const isInitialLoading = loadingState
  const isRefreshing = loading && (bills.length > 0 || payments.length > 0)
  const isUtilityLoading = utilityLoading
  const isUtilityComparisonLoading = utilityComparisonLoadingRanges?.has?.(utilityComparisonFilter)
  const utilityColor = {
    Electricity: 'text-amber-600 dark:text-amber-400',
    Water: 'text-cyan-600 dark:text-cyan-400',
    Thermal: 'text-rose-600 dark:text-rose-400',
    'Mixed Utilities': 'text-violet-600 dark:text-violet-400',
    'No Utility Data': 'text-slate-500 dark:text-slate-400',
  }
  const utilityIcon = { Electricity: Zap, Water: Droplets, Thermal: Flame, 'Mixed Utilities': Activity }
  const statusCls = {
    Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  }

  return (
    <PageSection variant="light">
      <PageHeader
        title="Finance Dashboard"
        subtitle="Revenue analytics, billing insights and financial performance"
        icon={BarChart3}
        actions={(
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-700/40 dark:bg-blue-900/20">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Live</span>
            </div>
            <UpdatingBadge show={isRefreshing} />
            <FilterPills options={FINANCE_FILTER_OPTIONS} value={chartRange} onChange={setChartRange} />
            
          </div>
        )}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-4">
        <UtilityCard type="electric" {...filteredUtilityCards.electric} loading={isInitialLoading || isUtilityLoading} updating={isUtilityComparisonLoading} />
        <UtilityCard type="thermal" {...filteredUtilityCards.thermal} loading={isInitialLoading || isUtilityLoading} updating={isUtilityComparisonLoading} />
        <UtilityCard type="water" {...filteredUtilityCards.water} loading={isInitialLoading || isUtilityLoading} updating={isUtilityComparisonLoading} />
      </div>

      <SummaryCardStrip
        cards={summaryCards.map((card) => ({ ...card, loading: isInitialLoading, updating: isRefreshing }))}
        gapClassName="gap-4"
        stretch
        stretchGridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-5"
      />

      <ChartCard
        className="mb-4"
        title="Revenue Trend"
        exportable
        exportRows={rangedMonthlyRevenue}
        subtitle={
          chartRange === '7D'
            ? 'Billed vs collected by day, with remaining collection gap'
            : chartRange === '1Y'
              ? 'Billed vs collected by month for the last 7 months'
              : 'Billed vs collected by week for the current month'
        }
        action={<Activity className="w-4 h-4 text-blue-500" />}
        badge={(
          <span className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="inline-block h-1.5 w-3 rounded-full bg-blue-500" />
              Billed
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-3 rounded-full bg-emerald-500" />
              Collected
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="inline-block h-1.5 w-3 rounded-full bg-amber-500" />
              Gap
            </span>
          </span>
        )}
        badgeCls=""
        updating={isRefreshing}
      >
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Billed',
              value: fmt(revenueTrendMeta.revenue),
              note: `${revenueTrendMeta.billedTrend >= 0 ? '+' : ''}${revenueTrendMeta.billedTrend}% vs previous`,
              tone: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
            },
            {
              label: 'Collected',
              value: fmt(revenueTrendMeta.collected),
              note: `${revenueTrendMeta.collectedTrend >= 0 ? '+' : ''}${revenueTrendMeta.collectedTrend}% vs previous`,
              tone: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            },
            {
              label: 'Collection Gap',
              value: fmt(revenueTrendMeta.outstanding),
              note: `${revenueTrendMeta.outstandingTrend >= 0 ? '+' : ''}${revenueTrendMeta.outstandingTrend}% vs previous`,
              tone: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-900/20',
            },
            {
              label: 'Collection Rate',
              value: `${revenueTrendMeta.collectionRate}%`,
              note: `Avg billed target ${fmt(revenueTrendMeta.target)}`,
              tone: 'text-violet-600 dark:text-violet-400',
              bg: 'bg-violet-50 dark:bg-violet-900/20',
            },
          ].map(({ label, value, note, tone, bg }) => (
            <div key={label} className={`rounded-xl px-4 py-3 ${bg}`}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
              <p className={`mt-1 text-sm font-bold ${tone}`}>{value}</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{note}</p>
            </div>
          ))}
        </div>
        {rangedMonthlyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={rangedMonthlyRevenue} margin={CHART_MARGIN_STANDARD}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
            <XAxis dataKey="month" tick={CHART_AXIS_TICK_SM} />
            <YAxis tick={CHART_AXIS_TICK_SM} tickFormatter={formatCompactChartCurrency} />
            <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartCurrency(value), name]} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              y={revenueTrendMeta.target}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: 'Avg target', position: 'insideTopRight', fill: '#94a3b8', fontSize: 11 }}
            />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Billed" barSize={24} />
            <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2.5} fill="url(#gradCollected)" dot={false} name="Collected" />
            <Line type="monotone" dataKey="outstanding" stroke="#f59e0b" strokeWidth={2} dot={false} name="Collection Gap" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : isInitialLoading ? (
          <ChartLoadingState className="h-[240px]" />
        ) : (
          <ChartLoadingState text="No chart data available yet." className="h-[240px]" />
        )}
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-5 mb-4">
        <ChartCard
          className="lg:col-span-3"
          title="Utility Consumption"
          exportable
          exportRows={utilityComparisonRows}
          loading={isUtilityLoading}
          updating={isUtilityComparisonLoading}
          subtitle={
            utilityComparisonFilter === '7D'
              ? 'Daily meter readings for the last 7 days'
              : utilityComparisonFilter === '1M'
                ? 'Weekly consumption for the current month'
                : 'Monthly consumption for the last 7 months'
          }
          action={(
            <div className="flex items-center gap-2">
              <FilterPills options={['7D', '1M', '1Y']} value={chartRange} onChange={setChartRange} />
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>
          )}
        >
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Electricity', value: utilitySummary.electric.periodConsumption, unit: utilitySummary.electric.unit || 'kWh', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Zap },
              { label: 'Water', value: utilitySummary.water.periodConsumption, unit: utilitySummary.water.unit || 'm3', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: Droplets },
              { label: 'Thermal', value: utilitySummary.thermal.periodConsumption, unit: utilitySummary.thermal.unit || 'kBTU', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: Flame },
            ].map(({ label, value, unit, color, bg, icon: Icon }) => (
              <div key={label} className={`rounded-xl p-3 text-center ${bg}`}>
                <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-[10px] font-normal">{unit}</span></p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={utilityComparisonRows}
              margin={CHART_MARGIN_STANDARD}
            >
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis dataKey="label" tick={CHART_AXIS_TICK} />
              <YAxis tick={CHART_AXIS_TICK} tickFormatter={formatChartNumber} />
              <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [`${formatChartNumber(value)}`, name]} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Electricity" />
              <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Water" />
              <Bar dataKey="thermal" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Thermal" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="lg:col-span-2 " title="Revenue Distribution" subtitle="Utility contribution percentage" action={<PieIcon className="w-4 h-4 text-slate-400" />} exportable exportRows={rangedUtilityPie} loading={isInitialLoading && rangedUtilityPie.every((entry) => Number(entry.value || 0) === 0)} updating={isRefreshing}>
          <div className="flex flex-1 flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={rangedUtilityPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {rangedUtilityPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<ThemedChartTooltip formatter={(value) => `${formatChartNumber(value)}%`} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 w-full space-y-2">
              {rangedUtilityPie.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: color }} />
                    <span className="text-slate-600 dark:text-slate-300">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-bold text-slate-700 dark:text-slate-200">{value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <ChartCard
          className="overflow-visible"
          title="Billing Status"
          exportable
          exportRows={billingStatusData}
          subtitle="Current receivables and settlement distribution"
          action={<FileText className="w-4 h-4 text-slate-400" />}
          loading={isInitialLoading && billingStatusData.every((entry) => Number(entry.value || 0) === 0)}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={billingStatusData} layout="vertical" margin={CHART_MARGIN_STANDARD}>
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis type="number" tick={CHART_AXIS_TICK} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={CHART_AXIS_TICK} width={90} />
              <Tooltip allowEscapeViewBox={{ x: false, y: false }} reverseDirection={{ x: true, y: false }} content={<ThemedChartTooltip constrainToViewBox formatter={(value, name) => [formatChartNumber(value), name]} />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Bills">
                {billingStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Payment Review Status"
          exportable
          exportRows={paymentReviewStatusData}
          subtitle="Receipt review workload and outcomes"
          action={<CreditCard className="w-4 h-4 text-slate-400" />}
          loading={isInitialLoading && paymentReviewStatusData.every((entry) => Number(entry.value || 0) === 0)}
          updating={isRefreshing}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={paymentReviewStatusData} margin={CHART_MARGIN_STANDARD}>
              <CartesianGrid {...CHART_GRID_PROPS_LIGHT} />
              <XAxis dataKey="name" tick={CHART_AXIS_TICK} />
              <YAxis tick={CHART_AXIS_TICK} allowDecimals={false} />
              <Tooltip content={<ThemedChartTooltip formatter={(value, name) => [formatChartNumber(value), name]} />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Payments">
                {paymentReviewStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard className="mb-4" title="Recent Transactions" subtitle="Latest payment records across all tenants and utilities" action={<CreditCard className="w-4 h-4 text-blue-500" />} updating={isRefreshing}>
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr),200px]">
          <input
            type="search"
            value={transactionSearch}
            onChange={(event) => setTransactionSearch(event.target.value)}
            placeholder="Search transaction, tenant, unit, utility, or date"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <select
            value={transactionStatus}
            onChange={(event) => setTransactionStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                {['Transaction ID', 'Tenant Name', 'Unit', 'Utility Type', 'Amount', 'Status', 'Date'].map((header) => (
                  <th key={header} className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap ${header === 'Status' ? 'text-center' : 'text-left'}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isInitialLoading ? (
                <TableLoadingRow colSpan={7} />
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No transactions matched the current filters.
                  </td>
                </tr>
              ) : filteredTransactions.map((row, index) => {
                const Icon = utilityIcon[row.utility]
                return (
                  <tr key={`${row.id}-${row.date}-${row.status}-${index}`} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.tenant}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{row.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-[12px] font-medium ${utilityColor[row.utility]}`}>
                        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                        {row.utility}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap tabular-nums">{fmt(row.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${statusCls[row.status] || statusCls.Pending}`}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap">{row.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <AnnouncementPanel />
    </PageSection>
  )
}
